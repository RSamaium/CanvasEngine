import { createFilter } from "vite";
import { parse } from "acorn";
import fs from "fs";
import pkg from "peggy";
import path from "path";
import * as ts from "typescript";
import { fileURLToPath } from 'url';

// Export HMR utilities
export * from './hmr-client.js';

const { generate } = pkg;

const DEV_SRC = "../../src"

// Generate unique ID for HMR
function generateHMRId(id: string): string {
  // Use btoa for base64 encoding (browser-compatible)
  return btoa(id).replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Formats a syntax error message with visual pointer to the error location
 * 
 * @param {string} template - The template content that failed to parse
 * @param {object} error - The error object with location information
 * @returns {string} - Formatted error message with a visual pointer
 * 
 * @example
 * ```
 * const errorMessage = showErrorMessage("<Canvas>test(d)</Canvas>", syntaxError);
 * // Returns a formatted error message with an arrow pointing to 'd'
 * ```
 */
function showErrorMessage(template: string, error: any): string {
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
 * Vite plugin to load shader files (.frag, .vert, .wgsl) as text strings
 * 
 * This plugin allows importing shader files directly as string literals in your code.
 * It supports fragment shaders (.frag), vertex shaders (.vert), and WebGPU shaders (.wgsl).
 * The content is loaded as a raw string and can be used directly with graphics APIs.
 * 
 * @returns {object} - Vite plugin configuration object
 * 
 * @example
 * ```typescript
 * // In your vite.config.ts
 * import { shaderLoader } from './path/to/compiler'
 * 
 * export default defineConfig({
 *   plugins: [shaderLoader()]
 * })
 * 
 * // In your code
 * import fragmentShader from './shader.frag'
 * import vertexShader from './shader.vert'
 * import computeShader from './shader.wgsl'
 * 
 * console.log(fragmentShader) // Raw shader code as string
 * ```
 */
export function shaderLoader() {
  const filter = createFilter(/\.(frag|vert|wgsl)$/);

  return {
    name: "vite-plugin-shader-loader",
    transform(code: string, id: string) {
      if (!filter(id)) return;

      // Escape the shader code to be safely embedded in a JavaScript string
      const escapedCode = code
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/`/g, '\\`')    // Escape backticks
        .replace(/\$/g, '\\$');  // Escape dollar signs

      // Return the shader content as a default export string
      return {
        code: `export default \`${escapedCode}\`;`,
        map: null,
      };
    },
  };
}

export default function canvasengine() {
  const filter = createFilter("**/*.ce");

  // Convert import.meta.url to a file path
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const grammar = fs.readFileSync(
    path.join(__dirname, "grammar.pegjs").replace("dist/grammar.pegjs", "grammar.pegjs"), 
  "utf8");
  const parser = generate(grammar);
  // Check for development mode using various methods
  const isDev = (() => {
    try {
      return (globalThis as any).process?.env?.NODE_ENV === "development" || 
             (globalThis as any).process?.env?.NODE_ENV === "dev" ||
             (globalThis as any).__DEV__ === true;
    } catch {
      return false;
    }
  })();
  const FLAG_COMMENT = "/*--[TPL]--*/";

  const PRIMITIVE_COMPONENTS = [
    "Canvas",
    "Sprite",
    "Text",
    "Viewport",
    "Graphics",
    "Container",
    "ImageMap",
    "NineSliceSprite",
    "Rect",
    "Circle",
    "Ellipse",
    "Triangle",
    "TilingSprite",
    "svg",
    "Video",
    "Mesh",
    "Svg",
    "DOMContainer",
    "DOMElement",
    "Button"
  ];

  return {
    name: "vite-plugin-ce",
    transform(code: string, id: string) {
      if (!filter(id)) return null;

      // Extract the script content
      const scriptMatch = code.match(/<script>([\s\S]*?)<\/script>/);
      let scriptContent = scriptMatch ? scriptMatch[1].trim() : "";
      
      // Transform SVG tags to Svg components
      let template = code.replace(/<script>[\s\S]*?<\/script>/, "")
        .replace(/^\s+|\s+$/g, '');

      let parsedTemplate;
      try {
        parsedTemplate = parser.parse(template);
      } catch (error) {
        const errorMsg = showErrorMessage(template, error);
        throw new Error(`Error parsing template in file ${id}:\n${errorMsg}`);
      }

      // trick to avoid typescript remove imports in scriptContent
      scriptContent += FLAG_COMMENT + parsedTemplate

      let transpiledCode = ts.transpileModule(scriptContent, {
        compilerOptions: {
          module: ts.ModuleKind.Preserve,
        },
      }).outputText;

      // remove code after /*---*/
      transpiledCode = transpiledCode.split(FLAG_COMMENT)[0]

      // Use Acorn to parse the script content
      const parsed = parse(transpiledCode, {
        sourceType: "module",
        ecmaVersion: 2020,
      });

      // Extract imports
      const imports = parsed.body.filter(
        (node) => node.type === "ImportDeclaration"
      );

      // Extract non-import statements from scriptContent
      const nonImportCode = parsed.body
        .filter((node) => node.type !== "ImportDeclaration")
        .map((node) => transpiledCode.slice(node.start, node.end))
        .join("\n");

      let importsCode = imports
        .map((imp) => {
          let importCode = transpiledCode.slice(imp.start, imp.end);
          if (isDev && importCode.includes("from 'canvasengine'")) {
            importCode = importCode.replace(
              "from 'canvasengine'",
              `from '${DEV_SRC}'`
            );
          }
          return importCode;
        })
        .join("\n");

      // Define an array for required imports
      const requiredImports = ["h", "computed", "cond", "loop"];

      // Check for missing imports
      const missingImports = requiredImports.filter(
        (importName) =>
          !imports.some(
            (imp) =>
              imp.specifiers &&
              imp.specifiers.some(
                (spec) =>
                  spec.type === "ImportSpecifier" &&
                  spec.imported && 
                  'name' in spec.imported &&
                  spec.imported.name === importName
              )
          )
      );

      // Add missing imports
      if (missingImports.length > 0) {
        const additionalImportCode = `import { ${missingImports.join(
          ", "
        )} } from ${isDev ? `'${DEV_SRC}'` : "'canvasengine'"};`;
        importsCode = `${additionalImportCode}\n${importsCode}`;
      }

      // Check for primitive components in parsedTemplate
      const primitiveImports = PRIMITIVE_COMPONENTS.filter((component) =>
        parsedTemplate.includes(`h(${component}`)
      );

      // Add missing imports for primitive components
      primitiveImports.forEach((component) => {
        const importStatement = `import { ${component} } from ${
          isDev ? `'${DEV_SRC}'` : "'canvasengine'"
        };`;
        if (!importsCode.includes(importStatement)) {
          importsCode = `${importStatement}\n${importsCode}`;
        }
      });

      // Generate HMR code for development
      const hmrId = generateHMRId(id);
      let hmrCode = '';
      
      if (isDev) {
        hmrCode = `
// HMR Support for CanvasEngine .ce components
if (import.meta.hot) {
  const hmrId = "${hmrId}";
  
  // Store the component reference for HMR
  if (!import.meta.hot.data.ceComponents) {
    import.meta.hot.data.ceComponents = new Map();
  }
  
  // Function to update component instances
  const updateComponent = (newComponent) => {
    if (import.meta.hot.data.ceComponents.has(hmrId)) {
      const instances = import.meta.hot.data.ceComponents.get(hmrId);
      instances.forEach(instance => {
        if (instance && typeof instance.update === 'function') {
          // Update the component instance with new logic
          instance.update(newComponent);
        } else if (instance && instance.parent) {
          // Force re-render by updating parent
          if (typeof instance.parent.forceUpdate === 'function') {
            instance.parent.forceUpdate();
          }
        }
      });
    }
    console.log(\`[HMR] Updated CanvasEngine component: \${hmrId}\`);
  };
  
  // Accept HMR updates
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.default) {
      updateComponent(newModule.default);
      
      // Trigger a re-render signal if available
      if (window.__CANVASENGINE_HMR_UPDATE__) {
        window.__CANVASENGINE_HMR_UPDATE__(hmrId, newModule.default);
      }
    }
  });
  
  // Clean up on disposal
  import.meta.hot.dispose(() => {
    if (import.meta.hot.data.ceComponents) {
      import.meta.hot.data.ceComponents.delete(hmrId);
    }
  });
}
        `;
      }

      // Generate the output
      const output = String.raw`
      ${importsCode}
      import { useProps, useDefineProps } from ${isDev ? `'${DEV_SRC}'` : "'canvasengine'"}

      export default function component($$props) {
        const $props = useProps($$props)
        const defineProps = useDefineProps($$props)
        ${nonImportCode}
        let $this = ${parsedTemplate}
        
        ${isDev ? `
        // Register component instance for HMR
        if (import.meta.hot && $this) {
          const hmrId = "${hmrId}";
          if (!import.meta.hot.data.ceComponents) {
            import.meta.hot.data.ceComponents = new Map();
          }
          if (!import.meta.hot.data.ceComponents.has(hmrId)) {
            import.meta.hot.data.ceComponents.set(hmrId, new Set());
          }
          import.meta.hot.data.ceComponents.get(hmrId).add($this);
        }
        ` : ''}
        
        return $this
      }
      
      ${hmrCode}
      `;

      return {
        code: output,
        map: null,
      };
    },
  };
}
