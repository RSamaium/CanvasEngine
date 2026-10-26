import { parse } from "acorn";
import MagicString from "magic-string";
import { analyzeTemplateAst, collectScriptRuntimeHelpers } from "./analyze";
import { parseSfc } from "./sfc";
import { parseTemplate } from "./template";
import type { CompileResult } from "./types";

/**
 * Generates a short hash (8 characters, letters only) from a string
 * 
 * @param {string} str - The string to hash
 * @returns {string} - An 8-character hash containing only lowercase letters (a-z)
 */
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive number and map to letters only (a-z)
  // Use modulo to map to 26 letters, then convert to character
  const positiveHash = Math.abs(hash);
  let result = '';
  for (let i = 0; i < 8; i++) {
    const letterIndex = (positiveHash + i * 31) % 26; // 31 is a prime to spread values
    result += String.fromCharCode(97 + letterIndex); // 97 is 'a'
  }
  return result;
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
  const code = error.code || "CE_TEMPLATE_UNEXPECTED_TOKEN";
  const message = String(error.message || "Unexpected template syntax.")
    .replace(/^Syntax error:\s*/i, "")
    .replace(/\s+at line \d+, column \d+(?: to line \d+, column \d+)?$/i, "");

  if (!error.location) {
    return `[${code}] ${message}`;
  }

  const lines = template.split('\n');
  const { line, column } = error.location.start;
  const errorLine = lines[line - 1] || '';
  const lineNumberWidth = String(line).length;
  const source = `${line} | ${errorLine}`;
  const pointer = `${' '.repeat(lineNumberWidth)} | ${' '.repeat(Math.max(column - 1, 0))}^`;
  const hint = error.hint
    ? `\n\nHint: ${error.hint}`
    : "\n\nHint: Check the highlighted template syntax.";

  return `[${code}] ${message} (line ${line}, column ${column})\n\n` +
         `${source}\n${pointer}${hint}`;
}

function splitCallArguments(argsText: string): string[] {
  const args: string[] = [];
  let current = "";
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = 0; i < argsText.length; i++) {
    const char = argsText[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaped = true;
      continue;
    }

    if (inSingle) {
      current += char;
      if (char === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      current += char;
      if (char === '"') inDouble = false;
      continue;
    }

    if (inTemplate) {
      current += char;
      if (char === "`") inTemplate = false;
      continue;
    }

    if (char === "'") {
      inSingle = true;
      current += char;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      current += char;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      current += char;
      continue;
    }

    if (char === "(" || char === "{" || char === "[") {
      depth++;
      current += char;
      continue;
    }

    if (char === ")" || char === "}" || char === "]") {
      depth--;
      current += char;
      continue;
    }

    if (char === "," && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function addScopeClassToDOMContainer(parsedTemplate: string, scopeClass: string): string {
  let result = "";
  let cursor = 0;

  while (cursor < parsedTemplate.length) {
    const start = parsedTemplate.indexOf("h(DOMContainer", cursor);
    if (start === -1) {
      result += parsedTemplate.slice(cursor);
      break;
    }

    result += parsedTemplate.slice(cursor, start);
    const openParen = parsedTemplate.indexOf("(", start);
    if (openParen === -1) {
      result += parsedTemplate.slice(start);
      break;
    }

    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let escaped = false;
    let end = -1;

    for (let i = openParen; i < parsedTemplate.length; i++) {
      const char = parsedTemplate[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (inSingle) {
        if (char === "'") inSingle = false;
        continue;
      }

      if (inDouble) {
        if (char === '"') inDouble = false;
        continue;
      }

      if (inTemplate) {
        if (char === "`") inTemplate = false;
        continue;
      }

      if (char === "'") {
        inSingle = true;
        continue;
      }

      if (char === '"') {
        inDouble = true;
        continue;
      }

      if (char === "`") {
        inTemplate = true;
        continue;
      }

      if (char === "(") depth++;
      if (char === ")") depth--;

      if (depth === 0) {
        end = i + 1;
        break;
      }
    }

    if (end === -1) {
      result += parsedTemplate.slice(start);
      break;
    }

    const callText = parsedTemplate.slice(start, end);
    const argsText = parsedTemplate.slice(openParen + 1, end - 1);
    const args = splitCallArguments(argsText);

    if (args[0]?.trim() !== "DOMContainer") {
      result += callText;
      cursor = end;
      continue;
    }

    if (args.length === 1) {
      args.push(`{ _scopeClass: '${scopeClass}' }`);
    } else {
      const props = args[1].trim();
      if (props === "null" || props === "undefined") {
        args[1] = `{ _scopeClass: '${scopeClass}' }`;
      } else if (props.startsWith("{")) {
        args[1] = props.replace(/^\{\s*/, `{ _scopeClass: '${scopeClass}', `);
      } else {
        args[1] = `{ _scopeClass: '${scopeClass}', ...${props} }`;
      }
    }

    result += `h(${args.join(", ")})`;
    cursor = end;
  }

  return result;
}

/** What parses a template: the parser of `grammar2.pegjs`, generated by Peggy. */
export interface TemplateParser {
  parse(source: string, options?: unknown): string;
}

export interface CompileCeOptions {
  /**
   * The template parser. The one of the plugin is generated from the grammar when the plugin starts; the one of
   * `@canvasengine/compiler/browser` was generated before, so nothing is generated from text at run time.
   */
  parser: TemplateParser;
  /** Strips the types of the script of a component (`ts.transpileModule`). Default: the script is plain JavaScript. */
  transpile?: (code: string) => string;
  /** The module the runtime of CanvasEngine is imported from in the output. Default: `canvasengine`. */
  runtime?: string;
  /** Wraps the component with the hot component support of CanvasEngine (`import.meta.hot`). Default: false. */
  hot?: boolean;
  /** Prefixes the selectors of a `<style scoped>` with the scope class. Needed only by a component that has one. */
  scopeStyles?: (css: string, scopeClass: string, id: string) => string;
}

/**
 * Compiles a `.ce` component to JavaScript: the compile of the Vite plugin of CanvasEngine, without Vite. It reads no file and
 * needs nothing of Node, so it runs in a browser and in a Worker.
 *
 * @param code - The source of the component.
 * @param id - What names the component: its path. It scopes the styles and names the source map.
 * @param options - See `CompileCeOptions`.
 */
export function compileCe(code: string, id: string, options: CompileCeOptions) {
  const DEV_SRC = options.runtime ?? "canvasengine";
  const isDev = DEV_SRC !== "canvasengine";
  const useHmr = options.hot === true;
  const FLAG_COMMENT = "/*--[TPL]--*/";

  const descriptor = parseSfc(code, id);
  let scriptContent = descriptor.script?.content ?? "";
  const styleContent = descriptor.style?.content ?? "";
  const isScoped = descriptor.style?.attributes.scoped === true;
  const template = descriptor.template.content;

  let parsedTemplate;
  let templateProgram;
  try {
    templateProgram = parseTemplate(template, options.parser);
    parsedTemplate = templateProgram.expression;
  } catch (error) {
    const errorMsg = showErrorMessage(template, error);
    throw new Error(`Error parsing template in ${id}\n${errorMsg}`);
  }

  // trick to avoid typescript remove imports in scriptContent
  scriptContent += FLAG_COMMENT + parsedTemplate

  let transpiledCode = options.transpile ? options.transpile(scriptContent) : scriptContent;

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

  const templateMetadata = analyzeTemplateAst(templateProgram.ast);
  const scriptHelpers = collectScriptRuntimeHelpers(parsed);
  const requiredImports = [
    ...templateMetadata.runtimeHelpers,
    ...scriptHelpers.filter(helper => !templateMetadata.runtimeHelpers.includes(helper)),
  ];

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

  const primitiveImports = templateMetadata.primitiveComponents;

  // Add missing imports for primitive components
  primitiveImports.forEach((component) => {
    const importStatement = `import { ${component} } from ${
      isDev ? `'${DEV_SRC}'` : "'canvasengine'"
    };`;
    if (!importsCode.includes(importStatement)) {
      importsCode = `${importStatement}\n${importsCode}`;
    }
  });

  // Process CSS: scope it if scoped attribute is present
  let processedStyleContent = styleContent;
  let scopeClass = '';
  
  if (isScoped && styleContent) {
    if (!options.scopeStyles) {
      throw new Error(`The component ${id} has a <style scoped>: give the option scopeStyles to compile it`);
    }
    // Generate short hash (8 characters) based on file path
    const fileHash = generateHash(id);
    scopeClass = fileHash;
    processedStyleContent = options.scopeStyles(styleContent, scopeClass, id);
    
    // Add _scopeClass prop to all DOMContainer in the template
    parsedTemplate = addScopeClassToDOMContainer(parsedTemplate, scopeClass);
  }
  
  // Escape style content for safe embedding in JavaScript string (using single quotes)
  // We need to escape: backslashes, single quotes, and line breaks
  const escapedStyleContent = processedStyleContent
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/'/g, "\\'")    // Escape single quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r');  // Escape carriage returns

  // Generate unique ID for style element based on file path
  const styleId = `ce-style-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Generate CSS injection code if style content exists
  // Use single quotes to avoid escaping issues with backticks
  const styleInjectionCode = styleContent ? 
    '// Inject CSS styles into the document head\n' +
    `if (typeof document !== 'undefined') {\n` +
    `  let styleElement = document.getElementById('${styleId}');\n` +
    '  if (!styleElement) {\n' +
    '    styleElement = document.createElement(\'style\');\n' +
    `    styleElement.id = '${styleId}';\n` +
    '    document.head.appendChild(styleElement);\n' +
    '  }\n' +
    `  styleElement.textContent = '${escapedStyleContent}';\n` +
    '}\n'
    : '';
  

  // Generate the output
  const runtimeImports = useHmr
    ? "createHotComponent, useProps, useDefineProps, useDefineEmits"
    : "useProps, useDefineProps, useDefineEmits";
  const componentExportCode = useHmr
    ? `const __ce_component = import.meta.hot
    ? createHotComponent(${JSON.stringify(id)}, component)
    : component

  if (import.meta.hot) {
    import.meta.hot.accept()
  }`
    : `const __ce_component = component`;

  const output = String.raw`
  ${importsCode}
  import { ${runtimeImports} } from ${isDev ? `'${DEV_SRC}'` : "'canvasengine'"}
  ${styleInjectionCode}
  function component($$props) {
    const $props = useProps($$props)
    const defineProps = useDefineProps($$props)
    const defineEmits = useDefineEmits($$props)
    ${nonImportCode}
    let $this = ${parsedTemplate}
    return $this
  }

  ${componentExportCode}

  export default __ce_component
  `;

  const mappedOutput = new MagicString(code, { filename: id });
  mappedOutput.overwrite(0, code.length, output);
  const sourceMap = mappedOutput.generateMap({
    source: id,
    includeContent: true,
    hires: true,
  });

  return {
    code: output,
    map: sourceMap,
    diagnostics: [],
    metadata: templateMetadata,
    meta: {
      canvasengine: templateMetadata,
    },
  } satisfies CompileResult & { meta: { canvasengine: typeof templateMetadata } };
}
