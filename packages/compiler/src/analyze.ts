import { parse } from "acorn";
import type { CompileMetadata } from "./types";

export const PRIMITIVE_COMPONENTS = new Set([
  "Canvas", "Sprite", "Text", "Viewport", "Graphics", "Container", "Navigation",
  "ImageMap", "NineSliceSprite", "Rect", "Circle", "Ellipse", "Triangle",
  "TilingSprite", "Video", "Mesh", "Svg", "DOMContainer", "DOMElement",
  "DOMSprite", "Button", "Joystick",
]);

const RUNTIME_HELPERS = ["h", "computed", "cond", "loop"];

export function analyzeTemplateExpression(expression: string): CompileMetadata {
  return analyzeTemplateAst(parseExpression(expression));
}

export function analyzeTemplateAst(program: any): CompileMetadata {
  const helpers = new Set<string>();
  const primitives = new Set<string>();

  walk(program, node => {
    if (node.type !== "CallExpression" || node.callee?.type !== "Identifier") return;

    const callee = node.callee.name;
    if (RUNTIME_HELPERS.includes(callee)) helpers.add(callee);
    if (callee !== "h") return;

    const component = node.arguments?.[0];
    if (component?.type === "Identifier" && PRIMITIVE_COMPONENTS.has(component.name)) {
      primitives.add(component.name);
    }
  });

  return {
    runtimeHelpers: RUNTIME_HELPERS.filter(helper => helpers.has(helper)),
    primitiveComponents: [...primitives],
  };
}

/**
 * Collects the runtime helpers (`computed`, `cond`, `loop`, `h`) called by a
 * component script, so they can be auto-imported like in the template.
 * Helpers declared at the top level of the script are ignored.
 *
 * @param program - Acorn AST of the transpiled `<script>` block.
 * @returns The helper names called by the script, in canonical order.
 *
 * @example
 * collectScriptRuntimeHelpers(parse("const a = computed(() => 1)", opts)) // ["computed"]
 */
export function collectScriptRuntimeHelpers(program: any): string[] {
  const declared = new Set<string>();
  for (const node of program.body ?? []) {
    if ((node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") && node.id) {
      declared.add(node.id.name);
    }
    if (node.type === "VariableDeclaration") {
      node.declarations.forEach((declaration: any) => collectPatternNames(declaration.id, declared));
    }
  }

  const helpers = new Set<string>();
  walk(program, node => {
    if (node.type !== "CallExpression" || node.callee?.type !== "Identifier") return;
    const callee = node.callee.name;
    if (RUNTIME_HELPERS.includes(callee) && !declared.has(callee)) helpers.add(callee);
  });

  return RUNTIME_HELPERS.filter(helper => helpers.has(helper));
}

function collectPatternNames(pattern: any, names: Set<string>): void {
  if (!pattern) return;
  if (pattern.type === "Identifier") names.add(pattern.name);
  else if (pattern.type === "ObjectPattern") {
    pattern.properties.forEach((property: any) =>
      collectPatternNames(property.type === "RestElement" ? property.argument : property.value, names)
    );
  } else if (pattern.type === "ArrayPattern") {
    pattern.elements.forEach((element: any) => collectPatternNames(element, names));
  } else if (pattern.type === "RestElement") collectPatternNames(pattern.argument, names);
  else if (pattern.type === "AssignmentPattern") collectPatternNames(pattern.left, names);
}

export function expressionHasCall(expression: string): boolean {
  const program = parseExpression(expression);
  let hasCall = false;
  walk(program, node => {
    if (node.type === "CallExpression") hasCall = true;
  });
  return hasCall;
}

function parseExpression(expression: string): any {
  return parse(`(${expression})`, {
    sourceType: "module",
    ecmaVersion: 2020,
  });
}

function walk(value: any, visit: (node: any) => void): void {
  if (!value || typeof value !== "object") return;
  if (typeof value.type === "string") visit(value);

  for (const [key, child] of Object.entries(value)) {
    if (key === "start" || key === "end" || key === "loc") continue;
    if (Array.isArray(child)) child.forEach(item => walk(item, visit));
    else walk(child, visit);
  }
}
