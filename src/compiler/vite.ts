import { createFilter } from "vite";
import { parse } from "acorn";
import dd from "dedent";
import fs from "fs";
import pkg from "peggy";

const { generate } = pkg;

export default function vitePluginCe() {
  const filter = createFilter("**/*.ce");
  const grammar = fs.readFileSync("src/compiler/grammar.pegjs", "utf8");
  const parser = generate(grammar);
  const isDev = process.env.NODE_ENV === "development";

  const PRIMITIVE_COMPONENTS = [
    "Canvas",
    "Sprite",
    "Text",
    "Joystick",
    "Viewport",
    "Graphics",
    "Container",
  ];

  return {
    name: "vite-plugin-ce",
    transform(code: string, id: string) {
      if (!filter(id)) return;

      // Extract the script content
      const scriptMatch = code.match(/<script>([\s\S]*?)<\/script>/);
      const scriptContent = scriptMatch ? scriptMatch[1].trim() : "";
      const template = code.replace(/<script>[\s\S]*?<\/script>/, "").trim();
      const parsedTemplate = parser.parse(template);

      // Use Acorn to parse the script content
      const parsed = parse(scriptContent, { sourceType: "module" });

      // Extract imports
      const imports = parsed.body.filter(
        (node) => node.type === "ImportDeclaration"
      );

      // Extract non-import statements from scriptContent
      const nonImportCode = parsed.body
        .filter((node) => node.type !== "ImportDeclaration")
        .map((node) => scriptContent.slice(node.start, node.end))
        .join("\n");

      let importsCode = imports
        .map((imp) => {
          let importCode = scriptContent.slice(imp.start, imp.end);
          if (isDev && importCode.includes("from 'canvasengine'")) {
            importCode = importCode.replace(
              "from 'canvasengine'",
              "from '../src'"
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
                (spec) => spec.imported && spec.imported.name === importName
              )
          )
      );

      // Add missing imports
      if (missingImports.length > 0) {
        const additionalImportCode = `import { ${missingImports.join(
          ", "
        )} } from ${isDev ? "'../src'" : "'canvasengine'"};`;
        importsCode = `${additionalImportCode}\n${importsCode}`;
      }

      // Check for primitive components in parsedTemplate
      const primitiveImports = PRIMITIVE_COMPONENTS.filter((component) =>
        parsedTemplate.includes(`h(${component}`)
      );

      // Add missing imports for primitive components
      primitiveImports.forEach((component) => {
        const importStatement = `import { ${component} } from ${
          isDev ? "'../src'" : "'canvasengine'"
        };`;
        if (!importsCode.includes(importStatement)) {
          importsCode = `${importStatement}\n${importsCode}`;
        }
      });

      // Generate the output
      const output = dd`
            ${importsCode}
            import { useProps } from '../src'

            export default function component($$props) {
                const $props = useProps($$props)
                ${nonImportCode}
                return ${parsedTemplate}
            }
        `;

      return {
        code: output,
        map: null, // Provide source map if needed
      };
    },
  };
}
