import { parse, type Node } from "acorn";
import MagicString from "magic-string";

export interface ToFactoryOptions {
  /** Modules the host provides: the specifier a module imports and the expression of the host that holds it (`{ canvasengine: "host.canvasengine" }`). */
  external: Record<string, string>;
  /** Gives the key `host.require` takes for a file of the same package (`./badge.ce` → `badge.ce`), or `undefined` when there is no such file. */
  resolve?: (specifier: string) => string | undefined;
}

const fail = (message: string): never => {
  throw new Error(message);
};

const patternNames = (pattern: any): string[] => {
  if (pattern.type === "Identifier") return [pattern.name];
  if (pattern.type === "ObjectPattern") return pattern.properties.flatMap((p: any) => patternNames(p.type === "RestElement" ? p.argument : p.value));
  if (pattern.type === "ArrayPattern") return pattern.elements.filter(Boolean).flatMap(patternNames);
  if (pattern.type === "AssignmentPattern") return patternNames(pattern.left);
  if (pattern.type === "RestElement") return patternNames(pattern.argument);
  return [];
};

/**
 * Turns an ES module into `export default (host) => { …; return exports }`: it imports nothing and has no static export, so a host
 * can build it from text (no bundler, no `import()` of a path) and give it what it uses. The imports of a module the host provides
 * (`options.external`) and of the other files of the package (`options.resolve`, read with `host.require(key)`, which gives the
 * exports object of the file) become constants at the top of the function. The exports become the returned object, `default` included.
 *
 * @param code - The module, as JavaScript.
 * @param options - What the host provides and how to name the files of the package.
 * @returns The factory, as JavaScript.
 * @throws When the module imports what the host does not provide, or re-exports (`export * from`, `export { a } from`).
 */
export function toFactory(code: string, options: ToFactoryOptions): string {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" }) as unknown as { body: any[] };
  const s = new MagicString(code);
  const imports: string[] = [];
  const exported: string[] = [];

  const source = (node: any): string => {
    const specifier = String(node.source.value);
    if (options.external[specifier] !== undefined) return options.external[specifier];
    const key = options.resolve?.(specifier);
    if (key === undefined) return fail(`Cannot import "${specifier}": a module can only import what its host provides or a file of its own package`);
    return `host.require(${JSON.stringify(key)})`;
  };

  for (const node of ast.body) {
    if (node.type === "ImportDeclaration") {
      const from = source(node);
      for (const spec of node.specifiers) {
        if (spec.type === "ImportNamespaceSpecifier") imports.push(`const ${spec.local.name} = ${from};`);
        else if (spec.type === "ImportDefaultSpecifier") imports.push(`const ${spec.local.name} = ${from}.default;`);
        else imports.push(`const ${spec.local.name} = ${from}.${spec.imported.name ?? spec.imported.value};`);
      }
      s.remove(node.start, node.end);
    } else if (node.type === "ExportDefaultDeclaration") {
      s.overwrite(node.start, node.declaration.start, "const $$default = ");
      s.appendLeft(node.end, ";");
      exported.push("default: $$default");
    } else if (node.type === "ExportNamedDeclaration") {
      if (node.source) fail(`Cannot re-export from "${node.source.value}": export what the module defines`);
      if (node.declaration) {
        s.remove(node.start, node.declaration.start);
        const d = node.declaration;
        const names = d.type === "VariableDeclaration" ? d.declarations.flatMap((x: any) => patternNames(x.id)) : [d.id.name];
        exported.push(...names);
      } else {
        for (const spec of node.specifiers) exported.push(spec.exported.name === spec.local.name ? spec.local.name : `${JSON.stringify(spec.exported.name ?? spec.exported.value)}: ${spec.local.name}`);
        s.remove(node.start, node.end);
      }
    } else if (node.type === "ExportAllDeclaration") {
      fail(`Cannot re-export from "${node.source.value}": export what the module defines`);
    }
  }

  return `export default (host) => {\n${imports.join("\n")}\n${s.toString()}\nreturn { ${exported.join(", ")} };\n}\n`;
}
