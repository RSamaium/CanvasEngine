import { parse } from "acorn";
import { expressionHasCall } from "./analyze";
import { generateTemplateCode } from "./codegen";
import type { SourcePosition, TemplateProgram, TemplateRoot } from "./types";

/**
 * Compiles a template in two passes: the grammar reads it into a tree, then
 * the code generator turns the tree into a JavaScript expression.
 *
 * @param source - Template part of a `.ce` file.
 * @param parser - Parser generated from `grammar2.pegjs`.
 * @returns The template tree, the generated expression and its ESTree AST.
 */
export function parseTemplate(source: string, parser: any): TemplateProgram {
  const template: TemplateRoot = parser.parse(source);
  const expression = generateTemplateCode(template, {
    validateExpression(value: string) {
      parseExpression(value);
    },
    hasFunctionCall: expressionHasCall,
  }) as string;

  return {
    type: "TemplateProgram",
    source,
    template,
    expression,
    ast: parseExpression(expression),
    span: {
      start: positionAt(source, 0),
      end: positionAt(source, source.length),
    },
  };
}

function parseExpression(expression: string): any {
  return parse(`(${expression})`, {
    sourceType: "module",
    ecmaVersion: 2020,
  });
}

function positionAt(source: string, offset: number): SourcePosition {
  const lines = source.slice(0, offset).split("\n");
  return {
    offset,
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}
