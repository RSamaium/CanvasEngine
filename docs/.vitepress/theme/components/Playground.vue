<template>
  <div class="playground-container">
    <div class="playground-header" v-if="title || description">
      <h3 v-if="title">{{ title }}</h3>
      <p v-if="description" class="playground-description">{{ description }}</p>
    </div>
    
    <div class="playground-content">
      <!-- Code Editor with CodeMirror -->
      <div class="code-editor">
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
      
      <!-- Preview Panel (Full Width) -->
      <div class="preview-panel">
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
          
          <div class="console-content" v-show="consoleOpen">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorState } from '@codemirror/state'
import pkg from "peggy"
import { dependencyConfig, CORE_FUNCTIONS, PRIMITIVE_COMPONENTS } from './config'

const { generate } = pkg

/**
 * Enhanced Playground component for CanvasEngine with CodeMirror
 * 
 * Features:
 * - CodeMirror editor with syntax highlighting
 * - Full-width preview
 * - Accordion console
 * - Auto-reload on code changes
 * - Error display in preview
 * 
 * @example
 * ```vue
 * <Playground
 *   title="Basic Canvas Example"
 *   description="A simple canvas with a red rectangle"
 *   :files="{
 *     'app.ce': '<Canvas><Rect color="red" width={100} height={100} /></Canvas>'
 *   }"
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
  files: () => ({})
})

// Reactive state
const editorContainer = ref<HTMLDivElement>()
const canvasContainer = ref<HTMLDivElement>()
const activeFile = ref('app.ce')
const error = ref('')
const logs = ref<ConsoleLog[]>([])
const consoleOpen = ref(false)
let currentApp: any = null
let editorView: EditorView | null = null
let parser: any = null

/**
 * Add log to console
 */
const addLog = (message: string, type: ConsoleLog['type'] = 'log') => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push({ timestamp, message, type })
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
 * Update CodeMirror editor content
 */
const updateEditor = () => {
  if (!editorView) return
  
  const currentFile = allFiles.value[activeFile.value]
  if (!currentFile) return
  
  const transaction = editorView.state.update({
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: currentFile.content
    }
  })
  
  editorView.dispatch(transaction)
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
    html(),
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
        height: '100%'
      },
      '.cm-content': {
        padding: '16px',
        minHeight: '100%'
      },
      '.cm-editor': {
        height: '100%'
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
  
  if (currentApp) {
    try {
      currentApp.destroy()
    } catch (e) {
      console.warn('Error destroying app:', e)
    }
    currentApp = null
  }
  
  if (canvasContainer.value) {
    // Remove all child elements including iframes
    while (canvasContainer.value.firstChild) {
      canvasContainer.value.removeChild(canvasContainer.value.firstChild)
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
    <style>
        body { overflow: hidden; margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        #root { width: 100%; height: 100%; min-height: 400px; }
        .error { color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px; font-family: monospace; white-space: pre-wrap; }
        .loading { text-align: center; padding: 20px; color: #666; }
    </style>
</head>
<body>
    <div id="root"></div>

    ${dependencyScripts}

    <script type="module">
        console.log("Starting CanvasEngine playground...");
        
        async function initializeCanvas() {
            try {
                console.log("Importing CanvasEngine with import map...");
                
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
                
                console.log("All required functions and components verified");
                
                ${componentFunction}
                
                console.log("Component function defined");
                
                if (typeof component !== "function") {
                    throw new Error("Component is not a function: " + typeof component);
                }
 
                const result = await bootstrapCanvas(rootElement, component);
                console.log("CanvasEngine initialized successfully");
                
            } catch (error) {
                console.error("CanvasEngine error:", error);
                const rootElement = document.getElementById("root");
                if (rootElement) {
                    let errorMessage = error.message;
                    
                    if (errorMessage.includes("already has a handler")) {
                        errorMessage = "PixiJS extension conflict detected. Try refreshing the page.";
                    }
                    
                    rootElement.innerHTML = '<div class="error"><strong>Error:</strong><br/>' + errorMessage + '<br/><br/><small>If this persists, try refreshing the page.</small></div>';
                }
            }
        }
        
        initializeCanvas();
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
    if (filePath === 'canvasengine') continue
    
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
       processedContent = result.transformedContent
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
    
    // Always ensure CanvasEngine is available
    dependencies.add('canvasengine')
    
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
        height: 400px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        background: white;
      `
      
      // Generate the complete HTML for the iframe
      const iframeContent = generateIframeContent(componentFunction, dependencies)
      
      iframe.onload = () => {
        try {
          // Intercept console logs from iframe
          if (iframe.contentWindow) {
            const iframeWindow = iframe.contentWindow as any
            const originalConsole = iframeWindow.console
            if (originalConsole) {
              iframeWindow.console = {
                ...originalConsole,
                log: (...args: any[]) => {
                 try {
                  addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'log')
                 } catch (e) {
                  // do nothing
                 }
                  originalConsole.log(...args)
                },
                error: (...args: any[]) => {
                  addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'error')
                  originalConsole.error(...args)
                },
                warn: (...args: any[]) => {
                  addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'warn')
                  originalConsole.warn(...args)
                },
                info: (...args: any[]) => {
                  addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'info')
                  originalConsole.info(...args)
                }
              }
            }
          }
        } catch (consoleError) {
          console.warn('Could not intercept iframe console:', consoleError)
        }
        
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

// Lifecycle
onMounted(() => {
  nextTick(async () => {
    await initParser()
    initEditor()
    runCode()
  })
})

onUnmounted(() => {
  if (editorView) {
    editorView.destroy()
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
}

.playground-header {
  padding: 20px 24px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
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
}

.codemirror-container {
  height: 100%;
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
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  height: 100%;
}

.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

/* Error Display */
.error-display {
  width: 100%;
  max-width: 600px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 20px;
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
  .playground-content {
    flex-direction: column;
  }
  
  .code-editor {
    width: 100%;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid var(--vp-c-border);
  }
  
  .preview-panel {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .playground-header {
    padding: 16px 20px;
  }
}
</style> 