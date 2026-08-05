import { parse } from "acorn";
import { expressionHasCall } from "./analyze";
import type { SourcePosition, TemplateProgram } from "./types";

export function parseTemplate(source: string, parser: any): TemplateProgram {
  const expression = parser.parse(source, {
    validateExpression(value: string) {
      parseExpression(value);
    },
    hasFunctionCall: expressionHasCall,
  });

  return {
    type: "TemplateProgram",
    source,
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
