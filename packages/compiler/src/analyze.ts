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
