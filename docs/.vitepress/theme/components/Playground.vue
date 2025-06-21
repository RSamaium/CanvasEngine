<template>
  <div class="playground-container" ref="playgroundContainer" :class="{ 'fullscreen': isFullscreen }">
    <div class="playground-header" v-if="title || description">
      <div class="header-content">
        <h3 v-if="title">{{ title }}</h3>
        <p v-if="description" class="playground-description">{{ description }}</p>
      </div>
      <div class="header-controls">
        <!-- View Mode Buttons -->
        <div class="view-mode-controls">
          <button 
            :class="['view-mode-btn', { active: viewMode === 'code' }]"
            @click="setViewMode('code')"
            title="Show code only"
          >
            <span class="icon">📝</span>
            Code
          </button>
          <button 
            :class="['view-mode-btn', { active: viewMode === 'preview' }]"
            @click="setViewMode('preview')"
            title="Show preview only"
          >
            <span class="icon">👁️</span>
            Preview
          </button>
          <button 
            :class="['view-mode-btn', { active: viewMode === 'both' }]"
            @click="setViewMode('both')"
            title="Show both code and preview"
          >
            <span class="icon">⚡</span>
            Both
          </button>
        </div>
        
        <!-- Fullscreen Button -->
        <button 
          class="fullscreen-btn"
          @click="toggleFullscreen"
          :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
        >
          <span class="icon">{{ isFullscreen ? '🗗' : '⛶' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Simplified header when no title/description but need controls -->
    <div class="playground-controls-only" v-else>
      <div class="header-controls">
        <!-- View Mode Buttons -->
        <div class="view-mode-controls">
          <button 
            :class="['view-mode-btn', { active: viewMode === 'code' }]"
            @click="setViewMode('code')"
            title="Show code only"
          >
            <span class="icon">📝</span>
            Code
          </button>
          <button 
            :class="['view-mode-btn', { active: viewMode === 'preview' }]"
            @click="setViewMode('preview')"
            title="Show preview only"
          >
            <span class="icon">👁️</span>
            Preview
          </button>
          <button 
            :class="['view-mode-btn', { active: viewMode === 'both' }]"
            @click="setViewMode('both')"
            title="Show both code and preview"
          >
            <span class="icon">⚡</span>
            Both
          </button>
        </div>
        
        <!-- Fullscreen Button -->
        <button 
          class="fullscreen-btn"
          @click="toggleFullscreen"
          :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
        >
          <span class="icon">{{ isFullscreen ? '🗗' : '⛶' }}</span>
        </button>
      </div>
    </div>
    
    <div class="playground-content" :class="`view-mode-${viewMode}`">
      <!-- Code Editor with CodeMirror -->
      <div class="code-editor" v-show="viewMode === 'code' || viewMode === 'both'">
        <div class="editor-header">
          <div class="tabs">
            <button 
              v-for="file in fileList" 
              :key="file.name"
              :class="['tab', { active: activeFile === file.name }]"
              @click="setActiveFile(file.name)"
            >
              {{ file.name }}
            </button>
          </div>
        </div>
        
        <div class="editor-content">
          <div ref="editorContainer" class="codemirror-container"></div>
        </div>
      </div>
      
      <!-- Preview Panel -->
      <div class="preview-panel" v-show="viewMode === 'preview' || viewMode === 'both'">
        <div class="preview-header">
          <span>Preview</span>
        </div>
        
        <div class="preview-content">
          <div v-if="error" class="error-display">
            <div class="error-header">
              <i class="error-icon">⚠️</i>
              <strong>Error</strong>
            </div>
            <pre class="error-message">{{ error }}</pre>
          </div>
          
          <div v-else ref="canvasContainer" class="canvas-container"></div>
        </div>
        
        <!-- Console Accordion -->
        <div class="console-accordion">
          <button 
            class="console-toggle" 
            @click="consoleOpen = !consoleOpen"
            :class="{ active: consoleOpen }"
          >
            <span>Console</span>
            <span class="console-badge" v-if="logs.length > 0">{{ logs.length }}</span>
            <span class="toggle-icon" :class="{ rotated: consoleOpen }">▼</span>
          </button>
          
          <div ref="consoleContent" class="console-content" v-show="consoleOpen">
            <div v-if="logs.length === 0" class="console-empty">
              No console output
            </div>
            <div v-else>
              <div v-for="(log, index) in logs" :key="index" class="console-line">
                <span class="console-timestamp">{{ log.timestamp }}</span>
                <span class="console-message" :class="log.type">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Fullscreen overlay backdrop -->
    <div v-if="isFullscreen" class="fullscreen-backdrop" @click="exitFullscreen"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorState, Compartment } from '@codemirror/state'
import pkg from "peggy"
import { dependencyConfig, CORE_FUNCTIONS, PRIMITIVE_COMPONENTS } from './config'

const { generate } = pkg

/**
 * Enhanced Playground component for CanvasEngine with CodeMirror
 * 
 * Features:
 * - CodeMirror editor with syntax highlighting
 * - View mode controls (Code, Preview, Both)
 * - Fullscreen mode
 * - Accordion console
 * - Auto-reload on code changes
 * - Error display in preview
 * - Automatic WebGL context management (destroys when out of viewport)
 * 
 * The component automatically monitors its visibility using Intersection Observer
 * and destroys the WebGL context when the playground is not visible to prevent
 * the "Too many active WebGL contexts" warning. It recreates the context when
 * the playground becomes visible again.
 * 
 * @example
 * ```vue
 * <Playground
 *   title="Basic Canvas Example"
 *   description="A simple canvas with a red rectangle"
 *   :files="{
 *     'app.ce': '<Canvas><Rect color="red" width={100} height={100} /></Canvas>'
 *   }"
 *   defaultViewMode="both"
 * />
 * ```
 */

interface PlaygroundProps {
  /** Title of the playground example */
  title?: string
  /** Description of what the example demonstrates */
  description?: string
  /** Custom files to include in the editor */
  files?: Record<string, string>
  /** Height of the playground */
  height?: number
  /** Default view mode: 'code', 'preview', or 'both' */
  defaultViewMode?: 'code' | 'preview' | 'both'
}

interface PlaygroundFile {
  name: string
  content: string
  language: string
}

interface ConsoleLog {
  timestamp: string
  message: string
  type: 'log' | 'error' | 'warn' | 'info'
}

const props = withDefaults(defineProps<PlaygroundProps>(), {
  height: 600,
  files: () => ({}),
  defaultViewMode: 'both'
})

// Reactive state
const editorContainer = ref<HTMLDivElement>()
const canvasContainer = ref<HTMLDivElement>()
const consoleContent = ref<HTMLDivElement>()
const activeFile = ref('app.ce')
const error = ref('')
const logs = ref<ConsoleLog[]>([])
const consoleOpen = ref(false)
const viewMode = ref<'code' | 'preview' | 'both'>(props.defaultViewMode)
const isFullscreen = ref(false)
let currentApp: any = null
let editorView: EditorView | null = null
let parser: any = null
let isConsoleScrollAtBottom = ref(true)
let consoleScrollContainer: HTMLElement | null = null
let messageListener: ((event: MessageEvent) => void) | null = null
// Unique identifier for this playground instance
const playgroundId = ref(`playground-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`)

// Intersection Observer for viewport detection
let intersectionObserver: IntersectionObserver | null = null
const isInViewport = ref(true)
const playgroundContainer = ref<HTMLDivElement>()

/**
 * Set view mode and update layout
 */
const setViewMode = (mode: 'code' | 'preview' | 'both') => {
  viewMode.value = mode
  
  // Trigger editor resize after view mode change
  nextTick(() => {
    if (editorView) {
      editorView.requestMeasure()
    }
  })
}

/**
 * Toggle fullscreen mode
 */
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    // Add fullscreen class to body to prevent scrolling
    document.body.classList.add('playground-fullscreen-active')
    
    // Add escape key listener
    document.addEventListener('keydown', handleEscapeKey)
  } else {
    exitFullscreen()
  }
  
  // Trigger editor resize after fullscreen change
  nextTick(() => {
    if (editorView) {
      editorView.requestMeasure()
    }
  })
}

/**
 * Exit fullscreen mode
 */
const exitFullscreen = () => {
  isFullscreen.value = false
  document.body.classList.remove('playground-fullscreen-active')
  document.removeEventListener('keydown', handleEscapeKey)
  
  // Trigger editor resize after exiting fullscreen
  nextTick(() => {
    if (editorView) {
      editorView.requestMeasure()
    }
  })
}

/**
 * Handle escape key to exit fullscreen
 */
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isFullscreen.value) {
    exitFullscreen()
  }
}

/**
 * Initialize viewport intersection observer to destroy playground when not visible
 * This prevents accumulation of WebGL contexts that cause the "Too many active WebGL contexts" warning
 */
const initViewportObserver = () => {
  if (!playgroundContainer.value) return
  
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const wasInViewport = isInViewport.value
        isInViewport.value = entry.isIntersecting
        
        // If playground was visible and is now not visible, destroy it
        if (wasInViewport && !isInViewport.value) {
          addLog('Playground moved out of viewport, destroying to free WebGL context', 'info')
          clearPreview()
        }
        // If playground becomes visible again, recreate it
        else if (!wasInViewport && isInViewport.value) {
          addLog('Playground back in viewport, recreating', 'info')
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            runCode()
          }, 100)
        }
      })
    },
    {
      // Trigger when 10% of the playground is visible/hidden
      threshold: 0.1,
      // Add some margin to trigger slightly before/after entering viewport
      rootMargin: '50px'
    }
  )
  
  intersectionObserver.observe(playgroundContainer.value)
}

/**
 * Cleanup viewport observer
 */
const cleanupViewportObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
}

/**
 * Check if console scroll is at bottom
 */
const checkConsoleScrollPosition = () => {
  if (consoleScrollContainer) {
    const threshold = 5 // pixels threshold
    const isAtBottom = (consoleScrollContainer as HTMLElement).scrollTop + (consoleScrollContainer as HTMLElement).clientHeight >= (consoleScrollContainer as HTMLElement).scrollHeight - threshold
    isConsoleScrollAtBottom.value = isAtBottom
  }
}

/**
 * Scroll console to bottom if needed
 */
const scrollConsoleToBottomIfNeeded = () => {
  if (isConsoleScrollAtBottom.value && consoleScrollContainer) {
    nextTick(() => {
      (consoleScrollContainer as HTMLElement).scrollTop = (consoleScrollContainer as HTMLElement).scrollHeight
    })
  }
}

/**
 * Initialize console scroll tracking
 */
const initConsoleScroll = () => {
  nextTick(() => {
    if (consoleContent.value) {
      consoleScrollContainer = consoleContent.value
      
      // Add scroll event listener
      consoleScrollContainer.addEventListener('scroll', checkConsoleScrollPosition)
      
      // Initial scroll position check
      checkConsoleScrollPosition()
    }
  })
}

/**
 * Add log to console
 */
const addLog = (message: string, type: ConsoleLog['type'] = 'log') => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push({ timestamp, message, type })
  scrollConsoleToBottomIfNeeded()
}

/**
 * Initialize the PEG.js parser with CanvasEngine grammar
 */
const initParser = async () => {
  try {
    // Load the grammar from the compiler package
    const response = await fetch('/grammar.pegjs')
    const grammar = await response.text()
    parser = generate(grammar)
    addLog('Parser initialized successfully', 'info')
  } catch (err: any) {
    addLog(`Failed to initialize parser: ${err.message}`, 'error')
    console.error('Parser initialization error:', err)
  }
}

/**
 * Format a syntax error message with visual pointer to the error location
 * Similar to the function in packages/compiler/index.ts
 */
const showErrorMessage = (template: string, error: any): string => {
  if (!error.location) {
    return `Syntax error: ${error.message}`;
  }

  const lines = template.split('\n');
  const { line, column } = error.location.start;
  const errorLine = lines[line - 1] || '';
  
  // Create a visual pointer with an arrow
  const pointer = ' '.repeat(column - 1) + '^';
  
  return `Syntax error at line ${line}, column ${column}: ${error.message}\n\n` +
         `${errorLine}\n${pointer}\n`;
}

/**
 * Default files for the playground
 */
const defaultFiles: Record<string, PlaygroundFile> = {
  'app.ce': {
    name: 'app.ce',
    content: ``,
    language: 'html'
  }
}

/**
 * Merge default files with user-provided files
 */
const allFiles = computed(() => {
  const result: Record<string, PlaygroundFile> = { ...defaultFiles }
  
  if (props.files) {
    Object.entries(props.files).forEach(([fileName, content]) => {
      result[fileName] = {
        name: fileName,
        content,
        language: fileName.endsWith('.ce') ? 'html' : fileName.endsWith('.ts') ? 'typescript' : 'javascript'
      }
    })
  }
  
  return result
})

/**
 * List of files for the tab interface
 */
const fileList = computed(() => Object.values(allFiles.value))

/**
 * Set the active file and update editor
 */
const setActiveFile = (fileName: string) => {
  if (activeFile.value === fileName) return
  
  // Save current file content
  if (editorView && allFiles.value[activeFile.value]) {
    allFiles.value[activeFile.value].content = editorView.state.doc.toString()
  }
  
  activeFile.value = fileName
  updateEditor()
}

/**
 * Update CodeMirror editor content and language
 */
const updateEditor = () => {
  if (!editorView || !editorContainer.value) return
  
  const currentFile = allFiles.value[activeFile.value]
  if (!currentFile) return
  
  // Destroy current editor and recreate with new language
  editorView.destroy()
  
  const extensions = [
    basicSetup,
    getLanguageExtension(activeFile.value),
    oneDark,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // Update file content
        allFiles.value[activeFile.value].content = update.state.doc.toString()
        
        // Auto-reload preview with debounce
        clearTimeout(autoReloadTimeout)
        autoReloadTimeout = setTimeout(() => {
          runCode()
        }, 500)
      }
    }),
    EditorView.theme({
      '&': {
        fontSize: '14px',
        height: '100%',
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '100%'
      },
      '.cm-editor': {
        height: '100%',
      },
      '.cm-scroller': {
        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace"
      }
    })
  ]
  
  const state = EditorState.create({
    doc: currentFile.content,
    extensions
  })
  
  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })
}

/**
 * Get language extension based on file type
 */
const getLanguageExtension = (fileName: string) => {
  if (fileName.endsWith('.js')) {
    return javascript()
  } else if (fileName.endsWith('.ts')) {
    return javascript({ typescript: true })
  } else if (fileName.endsWith('.ce')) {
    return html()
  } else {
    return html() // Default fallback
  }
}

/**
 * Initialize CodeMirror editor
 */
const initEditor = () => {
  if (!editorContainer.value) return
  
  const currentFile = allFiles.value[activeFile.value]
  if (!currentFile) return
  
  const extensions = [
    basicSetup,
    getLanguageExtension(activeFile.value),
    oneDark,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // Update file content
        allFiles.value[activeFile.value].content = update.state.doc.toString()
        
        // Auto-reload preview with debounce
        clearTimeout(autoReloadTimeout)
        autoReloadTimeout = setTimeout(() => {
          runCode()
        }, 500)
      }
    }),
    EditorView.theme({
      '&': {
        fontSize: '14px',
        height: '100%',
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '100%'
      },
      '.cm-editor': {
        height: '100%',
      },
      '.cm-scroller': {
        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace"
      }
    })
  ]
  
  const state = EditorState.create({
    doc: currentFile.content,
    extensions
  })
  
  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })
}

/**
 * Clear the preview and reset state
 */
const clearPreview = () => {
  error.value = ''
  logs.value = []
  
  // Clean up message listener
  if (messageListener) {
    window.removeEventListener('message', messageListener)
    messageListener = null
  }
  
  if (currentApp) {
    try {
      // Destroy PIXI application properly to free WebGL context
      if (currentApp.destroy) {
        currentApp.destroy(true, { children: true, texture: true, baseTexture: true })
      }
    } catch (e) {
      console.warn('Error destroying app:', e)
    }
    currentApp = null
  }
  
  if (canvasContainer.value) {
    // Remove all child elements including iframes
    while (canvasContainer.value.firstChild) {
      const child = canvasContainer.value.firstChild
      // If it's an iframe, ensure proper cleanup
      if (child instanceof HTMLIFrameElement) {
        try {
          // Try to destroy any PIXI apps in the iframe
          const iframeWindow = child.contentWindow
          if (iframeWindow && (iframeWindow as any).PIXI) {
            const pixiApps = (iframeWindow as any).PIXI.Application?.instances || []
            pixiApps.forEach((app: any) => {
              try {
                app.destroy(true, { children: true, texture: true, baseTexture: true })
              } catch (e) {
                console.warn('Error destroying iframe PIXI app:', e)
              }
            })
          }
        } catch (e) {
          // Cross-origin or other access issues, ignore
        }
      }
      canvasContainer.value.removeChild(child)
    }
  }
}


/**
 * Generate HTML content for the iframe sandbox
 * Creates a complete HTML page with CanvasEngine imports and bootstrap code
 */
const generateIframeContent = (componentFunction: string, dependencies: Set<string> = new Set()): string => {

  // Generate script tags for dependencies
  const dependencyScripts = Array.from(dependencies)
    .map(dep => dependencyConfig[dep])
    .filter(config => config && config.url)
    .map(config => `<script src="${config.url}"><\/script>`)
    .join('\n    ')

  // Generate core functions extraction code
  const coreExtractionCode = CORE_FUNCTIONS.map(func => 
    `if (!CanvasEngine.${func}) throw new Error("${func} function not found in CanvasEngine");
                coreExports.${func} = CanvasEngine.${func};`
  ).join('\n                ')

  // Generate component extraction code
  const componentExtractionCode = PRIMITIVE_COMPONENTS.map(comp => 
    `if (CanvasEngine.${comp}) componentExports.${comp} = CanvasEngine.${comp};`
  ).join('\n                ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CanvasEngine Playground</title>
    <script src="https://cdn.jsdelivr.net/npm/pixi.js@latest/dist/pixi.min.js"><\/script>
    <style>
        body { overflow: hidden; margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        #root { width: 100%; height: 100%; min-height: 400px; }
        .error { 
            color: #dc2626; 
            background: #fef2f2; 
            border: 1px solid #fecaca; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 16px; 
            font-family: monospace; 
            white-space: pre-wrap; 
            line-height: 1.4;
            max-height: 80vh;
            overflow-y: auto;
        }
        .error strong { 
            color: #b91c1c; 
            font-weight: 600; 
        }
        .error details { 
            margin-top: 12px; 
            cursor: pointer; 
        }
        .error summary { 
            color: #b91c1c; 
            font-weight: 500; 
            padding: 4px 0;
            user-select: none;
        }
        .error summary:hover { 
            background: rgba(220, 38, 38, 0.1); 
            border-radius: 4px;
            padding: 4px 8px;
        }
        .error pre { 
            background: #fff; 
            border: 1px solid #fecaca; 
            border-radius: 4px; 
            padding: 8px; 
            margin: 8px 0; 
            font-size: 11px; 
            white-space: pre-wrap; 
            overflow-x: auto;
            max-height: 200px;
            overflow-y: auto;
        }
        .loading { text-align: center; padding: 20px; color: #666; }
    </style>
</head>
<body>
    <div id="root"></div>

    ${dependencyScripts}

    <script type="module">
        // Set up console interception FIRST, before anything else
        const originalConsole = window.console;
        window.console = {
            ...originalConsole,
            log: (...args) => {
                try {
                    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                    window.parent.postMessage({
                        type: 'playground-console',
                        playgroundId: '${playgroundId.value}',
                        logType: 'log',
                        message: message,
                        timestamp: new Date().toISOString()
                    }, '*');
                } catch (e) {
                    // Fallback to original console if message posting fails
                }
                originalConsole.log(...args);
            },
            error: (...args) => {
                const errorMsg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                window.parent.postMessage({
                    type: 'playground-console',
                    playgroundId: '${playgroundId.value}',
                    logType: 'error',
                    message: errorMsg,
                    timestamp: new Date().toISOString(),
                    isSignificantError: errorMsg.toLowerCase().includes('error') || errorMsg.toLowerCase().includes('failed')
                }, '*');
                originalConsole.error(...args);
            },
            warn: (...args) => {
                const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                window.parent.postMessage({
                    type: 'playground-console',
                    playgroundId: '${playgroundId.value}',
                    logType: 'warn',
                    message: message,
                    timestamp: new Date().toISOString()
                }, '*');
                originalConsole.warn(...args);
            },
            info: (...args) => {
                const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                window.parent.postMessage({
                    type: 'playground-console',
                    playgroundId: '${playgroundId.value}',
                    logType: 'info',
                    message: message,
                    timestamp: new Date().toISOString()
                }, '*');
                originalConsole.info(...args);
            }
        };
        
        console.log("Starting CanvasEngine playground...");
        
        // Enhanced error handling function
        function handleError(error, context = 'Unknown') {
            console.error(\`\${context} error:\`, error);
            
            // Send error to parent window for console logging with unique playground ID
            try {
                window.parent.postMessage({
                    type: 'playground-error',
                    playgroundId: '${playgroundId.value}',
                    context: context,
                    message: error.message || error.toString(),
                    stack: error.stack || '',
                    timestamp: new Date().toISOString()
                }, '*');
            } catch (postError) {
                console.warn('Could not send error to parent:', postError);
            }
            
            const rootElement = document.getElementById("root");
            if (rootElement && !rootElement.querySelector('.error')) {
                let errorMessage = error.message || error.toString();
                
                if (errorMessage.includes("already has a handler")) {
                    errorMessage = "PixiJS extension conflict detected. Try refreshing the page.";
                }
                
                // Include stack trace if available
                let stackTrace = '';
                if (error.stack) {
                    stackTrace = '<br/><br/><details><summary>Stack Trace</summary><pre style="font-size: 11px; margin: 8px 0; white-space: pre-wrap;">' + 
                        error.stack + '</pre></details>';
                }
                
                rootElement.innerHTML = '<div class="error"><strong>' + context + ' Error:</strong><br/>' + 
                    errorMessage + stackTrace + 
                    '<br/><br/><small>If this persists, try refreshing the page.</small></div>';
            }
        }

        // Global error handler for uncaught exceptions
        window.addEventListener('error', (event) => {
            console.error('Global JavaScript Error:', event.error || event.message);
            const error = event.error || new Error(event.message);
            handleError(error, 'Global JavaScript');
            
            // Prevent default browser error handling
            event.preventDefault();
        });
        
        // Global promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            const error = event.reason instanceof Error ? event.reason : new Error(event.reason);
            handleError(error, 'Unhandled Promise');
            
            // Prevent default browser rejection handling
            event.preventDefault();
        });

        async function initializeCanvas() {
            try {
                const rootElement = document.getElementById("root");
                if (!rootElement) throw new Error("Root element not found");

                // Extract all core functions and primitive components from CanvasEngine
                const coreExports = {};
                const componentExports = {};
                
                // Get core functions
                ${coreExtractionCode}
                
                // Get primitive components  
                ${componentExtractionCode}
                
                // Destructure for easy access
                const { ${CORE_FUNCTIONS.join(', ')} } = coreExports;
                const { ${PRIMITIVE_COMPONENTS.join(', ')} } = componentExports;
                
                let comp = null
                
                // Wrap component function execution in try-catch to catch syntax errors
                try {
                    comp = ${componentFunction}
                } catch (syntaxError) {
                    throw new Error("Syntax error in component code: " + syntaxError.message);
                }

                if (typeof comp !== "function") {
                    throw new Error("Component is not a function: " + typeof comp);
                }

                // Wrap the component function to catch async errors during execution
                const wrappedComp = function(...args) {
                    try {
                        const result = comp(...args);
                        // If the result is a promise, catch any rejections
                        if (result && typeof result.then === 'function') {
                            return result.catch(asyncError => {
                                handleError(asyncError, 'Component Async');
                                throw asyncError;
                            });
                        }
                        return result;
                    } catch (syncError) {
                        handleError(syncError, 'Component Sync');
                        throw syncError;
                    }
                };
 
                // Wrap bootstrapCanvas call with additional error handling
                const result = await Promise.resolve(bootstrapCanvas(rootElement, wrappedComp))
                    .catch(bootstrapError => {
                        handleError(bootstrapError, 'Bootstrap');
                        throw bootstrapError;
                    });
                    
                console.log("CanvasEngine initialized successfully");
                
            } catch (error) {
                handleError(error, 'Initialization');
            }
        }
        
        // Initialize with additional promise rejection handling
        initializeCanvas().catch(error => {
            handleError(error, 'Main Initialization');
        });
    <\/script>
</body>
</html>`
}


/**
 * Process all imports and resolve local files
 * 
 * @param {string} scriptContent - The script content to transform
 * @returns {Promise<{transformedContent: string, dependencies: Set<string>}>} - The transformed script content with resolved imports and dependencies
 */
const processImports = async (scriptContent: string): Promise<{transformedContent: string, dependencies: Set<string>}> => {
  let transformedContent = scriptContent
  let resolvedModules = ''
  const dependencies = new Set<string>()
  
  // Transform external library imports
  for (const [packageName, config] of Object.entries(dependencyConfig)) {
    const regex = new RegExp(`import\\s*\\{\\s*([^}]+)\\s*\\}\\s*from\\s*['"]${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?`, 'g')
    transformedContent = transformedContent.replace(regex, (match, imports) => {
      const cleanImports = imports.trim()
      dependencies.add(packageName)
      return `const { ${cleanImports} } = ${config.globalName};`
    })
  }
  
  // Process local file imports
  const importRegex = /import\s+(.+?)\s+from\s+['"](.+?)['"];?/g
  let importMatch
  
  while ((importMatch = importRegex.exec(scriptContent)) !== null) {
    const [fullMatch, importClause, filePath] = importMatch
    
    // Skip CanvasEngine imports (already processed)
    if (filePath[0] != '.') continue
    
    // Resolve local file path (remove ./ and normalize)
    const normalizedPath = filePath.replace(/^\.\//, '').replace(/^\//, '')
    
    // Check if file exists in allFiles
    const targetFile = allFiles.value[normalizedPath]
    if (!targetFile) {
      addLog(`Warning: File not found: ${filePath}`, 'warn')
      continue
    }
    
    // Process the file based on its extension
    let processedContent = ''
    
    if (normalizedPath.endsWith('.ce')) {
      // Parse .ce file like a component
      const ceScriptMatch = targetFile.content.match(/<script>([\s\S]*?)<\/script>/)
      const ceScriptContent = ceScriptMatch ? ceScriptMatch[1].trim() : ""
      
      // Recursively process imports in the .ce file
      const processedCeScript = await processImports(ceScriptContent)
      
      // Merge dependencies from nested imports
      processedCeScript.dependencies.forEach(dep => dependencies.add(dep))

      const ceTemplate = targetFile.content.replace(/<script>[\s\S]*?<\/script>/, "")
        .replace(/^\s+|\s+$/g, '')
      
      let parsedCeTemplate
      try {
        parsedCeTemplate = parser.parse(ceTemplate)
      } catch (parseError: any) {
        const errorMsg = showErrorMessage(ceTemplate, parseError)
        throw new Error(`Error parsing template in ${normalizedPath}:\n${errorMsg}`)
      }
      
      // Generate component function for .ce file
      processedContent = `
        function ${getModuleName(normalizedPath)}($$props = {}) {
          const $props = useProps($$props);
          const defineProps = useDefineProps($$props);
          ${processedCeScript.transformedContent}
          return ${parsedCeTemplate};
        }
      `
         } else if (normalizedPath.endsWith('.js') || normalizedPath.endsWith('.ts')) {
       // Process .js/.ts files
       const result = await processImports(targetFile.content)
       
       // Transform ES6 exports to object assignments
       const moduleName = getModuleName(normalizedPath)
       const transformedJsContent = transformExports(result.transformedContent, moduleName)

       // Wrap in a function that creates and returns the module object
       processedContent = `
         const ${moduleName} = (function() {
           ${transformedJsContent}
         })();
       `
       
       // Merge dependencies from nested imports
       result.dependencies.forEach(dep => dependencies.add(dep))
     }
     
     // Add the processed content to resolved modules
     resolvedModules += processedContent + '\n'
     
     // Replace the import statement with variable assignment
     const moduleName = getModuleName(normalizedPath)
     if (importClause.includes('{')) {
       // Named imports: import { func1, func2 } from './utils.js'
       transformedContent = transformedContent.replace(fullMatch, `const ${importClause} = ${moduleName};`)
     } else {
       // Default import: import HelloWorld from './hello.ce'
       const varName = importClause.trim()
       transformedContent = transformedContent.replace(fullMatch, `const ${varName} = ${moduleName};`)
     }
   }
   
   return {
     transformedContent: resolvedModules + transformedContent,
     dependencies
   }
}

/**
 * Transform ES6 exports to return statement with object for sandbox compatibility
 */
const transformExports = (jsContent: string, moduleName: string): string => {
  let transformedContent = jsContent
  const exportedNames: string[] = []
  let hasDefaultExport = false
  let defaultExportValue = ''
  
  // Transform named exports: export const foo = ... → const foo = ...;
  transformedContent = transformedContent.replace(/export\s+const\s+(\w+)\s*=\s*([^;]+);?/g, (match, name, value) => {
    exportedNames.push(name)
    return `const ${name} = ${value};`
  })
  
  // Transform named exports: export function foo() {} → function foo() {}
  transformedContent = transformedContent.replace(/export\s+function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*\}/g, (match, name) => {
    exportedNames.push(name)
    const funcDeclaration = match.replace(/^export\s+/, '')
    return funcDeclaration
  })
  
  // Transform default export: export default ... → store the value
  transformedContent = transformedContent.replace(/export\s+default\s+([^;]+);?/g, (match, value) => {
    hasDefaultExport = true
    defaultExportValue = value
    return '' // Remove the export default line
  })
  
  // Transform export { ... } syntax
  transformedContent = transformedContent.replace(/export\s*\{\s*([^}]+)\s*\}/g, (match, exports) => {
    const exportList = exports.split(',').map(exp => exp.trim())
    exportList.forEach(exp => {
      const [localName, exportedName] = exp.includes(' as ') ? exp.split(' as ').map(s => s.trim()) : [exp, exp]
      if (!exportedNames.includes(exportedName)) {
        exportedNames.push(exportedName)
      }
    })
    return '' // Remove the export statement
  })
  
  // Build the return object
  const returnObject: string[] = []
  
  // Add named exports
  exportedNames.forEach(name => {
    returnObject.push(`${name}: ${name}`)
  })
  
  // Add default export if present
  if (hasDefaultExport) {
    returnObject.push(`default: ${defaultExportValue}`)
  }
  
  // Add return statement with the module object
  if (returnObject.length > 0) {
    transformedContent += `\n\nreturn {\n  ${returnObject.join(',\n  ')}\n};`
  } else {
    transformedContent += `\n\nreturn {};`
  }

  return transformedContent
}

/**
 * Generate a module name from file path
 */
const getModuleName = (filePath: string): string => {
  return filePath
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_') + '_module'
}

/**
 * Parse and run the CanvasEngine code using the PEG.js parser
 */
const runCode = async () => {
  try {
    // Don't run if not in viewport to save resources
    if (!isInViewport.value) {
      addLog('Playground not in viewport, skipping execution', 'info')
      return
    }
    
    clearPreview()
    
    // Ensure parser is initialized
    if (!parser) {
      await initParser()
      if (!parser) {
        throw new Error('Parser initialization failed')
      }
    }
    
    // Get the main component file content
    const mainFile = allFiles.value['app.ce']
    if (!mainFile) {
      throw new Error('app.ce file is required')
    }
    
    // Extract the script content and template like in the compiler
    const scriptMatch = mainFile.content.match(/<script>([\s\S]*?)<\/script>/)
    let scriptContent = scriptMatch ? scriptMatch[1].trim() : ""
    
    // Process all imports and resolve local files
    const importResult = await processImports(scriptContent)
    scriptContent = importResult.transformedContent
    const dependencies = importResult.dependencies
    
    // Always ensure CanvasEngine is available and is the first dependency
    const orderedDependencies = new Set(['canvasengine'])
    dependencies.forEach(dep => {
      if (dep !== 'canvasengine') {
        orderedDependencies.add(dep)
      }
    })
 
    // Extract template (everything except script)
    const template = mainFile.content.replace(/<script>[\s\S]*?<\/script>/, "")
      .replace(/^\s+|\s+$/g, '')
    
    let parsedTemplate
    try {
      // Parse the template using the PEG.js parser
      parsedTemplate = parser.parse(template)
      addLog(`Template parsed successfully: ${parsedTemplate}`, 'info')
    } catch (parseError: any) {
      const errorMsg = showErrorMessage(template, parseError)
      throw new Error(`Error parsing template:\n${errorMsg}`)
    }
    
    // Generate the complete component function like in the compiler
    // Make sure the component function returns the correct structure
    const componentFunction = `
            function component($$props = {}) {
                const $props = useProps($$props);
                const defineProps = useDefineProps($$props);
                ${scriptContent}
                return ${parsedTemplate};
            }`
    
    // Create sandbox iframe with CanvasEngine
    if (canvasContainer.value) {
      const iframe = document.createElement('iframe')
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        background: white;
      `
      
      // Generate the complete HTML for the iframe
      const iframeContent = generateIframeContent(componentFunction, orderedDependencies)

      // Set up message listener for iframe communication
      messageListener = (event: MessageEvent) => {
        if (event.data && event.data.playgroundId === playgroundId.value) {
          if (event.data.type === 'playground-error') {
            const { context, message, stack } = event.data
            const fullErrorMsg = stack ? `${message}\n\nStack trace:\n${stack}` : message
            error.value = fullErrorMsg
            addLog(`${context}: ${message}`, 'error')
          } else if (event.data.type === 'playground-console') {
            const { logType, message, isSignificantError } = event.data
            addLog(message, logType as ConsoleLog['type'])
            
            // Set error in preview if it's a significant console error
            if (isSignificantError) {
              error.value = message
            }
          }
        }
      }
      
      window.addEventListener('message', messageListener)

      iframe.onload = () => {
        try {
          iframe.contentDocument?.open()
          iframe.contentDocument?.write(iframeContent)
          iframe.contentDocument?.close()
        } catch (writeError) {
          console.error('Error writing to iframe:', writeError)
          addLog(`Error writing to iframe: ${writeError.message}`, 'error')
        }
      }
      
      canvasContainer.value.appendChild(iframe)
    }
    
  } catch (err: any) {
    error.value = err.message || 'Unknown error occurred'
    addLog(`Error: ${err.message}`, 'error')
    console.error('Playground error:', err)
  }
}

let autoReloadTimeout: ReturnType<typeof setTimeout>

// Watch for console open/close to initialize scroll tracking
watch(consoleOpen, (isOpen) => {
  if (isOpen) {
    initConsoleScroll()
  }
})

// Lifecycle
onMounted(() => {
  nextTick(async () => {
    await initParser()
    initEditor()
    initViewportObserver()
    runCode()
  })
})

onUnmounted(() => {
  if (editorView) {
    editorView.destroy()
  }
  
  // Clean up console scroll event listener
  if (consoleScrollContainer) {
    (consoleScrollContainer as HTMLElement).removeEventListener('scroll', checkConsoleScrollPosition)
  }
  
  // Clean up message listener
  if (messageListener) {
    window.removeEventListener('message', messageListener)
    messageListener = null
  }
  
  // Clean up viewport observer
  cleanupViewportObserver()
  
  // Clean up preview resources
  clearPreview()
  
  // Clean up fullscreen
  if (isFullscreen.value) {
    exitFullscreen()
  }
  
  clearTimeout(autoReloadTimeout)
})
</script>

<style scoped>
.playground-container {
  margin: 20px 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

/* Fullscreen styles */
.playground-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  border-radius: 0;
  z-index: 9999;
  box-shadow: none;
}

.fullscreen-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: -1;
}

:global(.playground-fullscreen-active) {
  overflow: hidden;
}

.playground-header {
  padding: 20px 24px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.playground-controls-only {
  padding: 12px 24px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
  display: flex;
  justify-content: flex-end;
}

.header-content {
  flex: 1;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.playground-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.playground-description {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.playground-content {
  display: flex;
  height: v-bind('props.height + "px"');
}

/* Fullscreen content adjustments */
.playground-container.fullscreen .playground-content {
  height: calc(100vh - 60px); /* Adjust for header */
}

/* View mode layouts */
.playground-content.view-mode-code {
  display: block;
}

.playground-content.view-mode-code .code-editor {
  width: 100%;
  height: 100%;
  border-right: none;
}

.playground-content.view-mode-preview {
  display: block;
}

.playground-content.view-mode-preview .preview-panel {
  width: 100%;
  height: 100%;
}

.playground-content.view-mode-both {
  display: flex;
}

.playground-content.view-mode-both .code-editor {
  width: 40%;
  border-right: 1px solid var(--vp-c-border);
}

.playground-content.view-mode-both .preview-panel {
  flex: 1;
}

/* View Mode Controls */
.view-mode-controls {
  display: flex;
  gap: 4px;
  background: var(--vp-c-bg-elv);
  border-radius: 8px;
  padding: 4px;
}

.view-mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.view-mode-btn:hover {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.view-mode-btn.active {
  background: var(--vp-c-brand);
  color: white;
}

.view-mode-btn .icon {
  font-size: 14px;
}

/* Fullscreen Button */
.fullscreen-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  font-size: 16px;
}

.fullscreen-btn:hover {
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand);
}

.fullscreen-btn .icon {
  font-size: 18px;
}

/* Code Editor */
.code-editor {
  width: 40%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
}

.editor-header {
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
}

.tabs {
  display: flex;
  gap: 4px;
}

.tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.tab:hover {
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
}

.tab.active {
  background: var(--vp-c-brand);
  color: white;
}

.editor-content {
  flex: 1;
  position: relative;
  overflow: auto;
  min-height: 0;
}

.codemirror-container {
  height: 100%;
  overflow: auto;
}

/* Preview Panel */
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.clear-button {
  padding: 6px 12px;
  background: transparent;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.clear-button:hover {
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
}

.preview-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  background: #f8f9fa;
  height: 100%;
  position: relative;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* Error Display */
.error-display {
  width: 100%;
  height: 100%;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #dc2626;
  font-weight: 600;
}

.error-icon {
  font-size: 18px;
}

.error-message {
  margin: 0;
  padding: 12px;
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #dc2626;
  white-space: pre-wrap;
  overflow-x: auto;
}

/* Console Accordion */
.console-accordion {
  border-top: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
}

.console-toggle {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  transition: all 0.2s;
}

.console-toggle:hover {
  background: var(--vp-c-bg-elv);
}

.console-toggle.active {
  background: var(--vp-c-bg-elv);
}

.console-badge {
  background: var(--vp-c-brand);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.toggle-icon {
  transition: transform 0.2s;
  font-size: 12px;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.console-content {
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
}

.console-empty {
  padding: 16px;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-style: italic;
}

.console-line {
  padding: 8px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  display: flex;
  gap: 12px;
}

.console-line:last-child {
  border-bottom: none;
}

.console-timestamp {
  color: var(--vp-c-text-3);
  font-size: 11px;
  flex-shrink: 0;
}

.console-message {
  color: var(--vp-c-text-1);
  flex: 1;
}

.console-message.error {
  color: #dc2626;
}

.console-message.warn {
  color: #d97706;
}

.console-message.info {
  color: #2563eb;
}

/* Responsive */
@media (max-width: 1024px) {
  .playground-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-controls {
    justify-content: center;
  }
  
  .playground-controls-only {
    justify-content: center;
  }
  
  .playground-content.view-mode-both {
    flex-direction: column;
    height: auto;
    min-height: 600px;
  }
  
  .playground-content.view-mode-both .code-editor {
    width: 100%;
    height: 250px;
    border-right: none;
    border-bottom: 1px solid var(--vp-c-border);
  }
  
  .playground-content.view-mode-code .code-editor {
    height: 100%;
  }
  
  .playground-content.view-mode-preview .preview-panel {
    height: 100%;
  }
  
  .editor-content {
    overflow: auto;
  }
  
  .preview-panel {
    flex: 1;
    min-height: 350px;
  }
  
  /* View mode controls responsive */
  .view-mode-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .view-mode-btn {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .fullscreen-btn {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 768px) {
  .playground-header {
    padding: 16px 20px;
  }
  
  .playground-controls-only {
    padding: 8px 20px;
  }
  
  .playground-content.view-mode-both {
    min-height: 700px;
  }
  
  .playground-content.view-mode-both .code-editor {
    height: 280px;
  }
  
  .playground-content.view-mode-code .code-editor {
    height: 100%;
  }
  
  .playground-content.view-mode-preview .preview-panel {
    height: 100%;
  }
  
  .editor-content {
    overflow: auto;
  }
  
  .preview-panel {
    min-height: 420px;
  }
  
  .tabs {
    flex-wrap: wrap;
    gap: 2px;
  }
  
  .tab {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .console-content {
    max-height: 150px;
  }
  
  /* Mobile view controls */
  .view-mode-btn {
    font-size: 11px;
    padding: 6px 8px;
    gap: 4px;
  }
  
  .view-mode-btn .icon {
    font-size: 12px;
  }
  
  .fullscreen-btn {
    width: 32px;
    height: 32px;
  }
  
  .fullscreen-btn .icon {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .playground-header {
    padding: 12px 16px;
    gap: 12px;
  }
  
  .playground-controls-only {
    padding: 8px 16px;
  }
  
  .playground-header h3 {
    font-size: 18px;
  }
  
  .playground-description {
    font-size: 13px;
  }
  
  .playground-content.view-mode-both {
    min-height: 650px;
  }
  
  .playground-content.view-mode-both .code-editor {
    height: 250px;
  }
  
  .playground-content.view-mode-code .code-editor {
    height: 100%;
  }
  
  .playground-content.view-mode-preview .preview-panel {
    height: 100%;
  }
  
  .editor-content {
    overflow: auto;
  }
  
  .preview-panel {
    min-height: 400px;
  }
  
  .preview-header,
  .editor-header {
    padding: 8px 12px;
  }
  
  .console-toggle {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .console-content {
    max-height: 120px;
  }
  
  .console-line {
    padding: 6px 12px;
    font-size: 11px;
  }
  
  /* Extra small mobile adjustments */
  .view-mode-controls {
    padding: 2px;
    gap: 2px;
  }
  
  .view-mode-btn {
    font-size: 10px;
    padding: 4px 6px;
    gap: 2px;
  }
  
  .view-mode-btn .icon {
    font-size: 11px;
  }
  
  .fullscreen-btn {
    width: 28px;
    height: 28px;
  }
  
  .fullscreen-btn .icon {
    font-size: 14px;
  }
  
  .header-controls {
    gap: 8px;
  }
}
</style> 