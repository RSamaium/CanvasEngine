import type { SfcAttributeValue, SfcBlock, SfcDescriptor, SourcePosition, SourceSpan } from "./types";

interface LocatedBlock {
  block: SfcBlock;
  start: number;
  end: number;
}

export function parseSfc(source: string, id: string): SfcDescriptor {
  const script = findBlock(source, "script");
  const style = findBlock(source, "style");
  const removed = [script, style].filter((block): block is LocatedBlock => Boolean(block));
  let templateSource = source;

  for (const block of removed.sort((a, b) => b.start - a.start)) {
    templateSource = templateSource.slice(0, block.start) + templateSource.slice(block.end);
  }

  const templateContent = templateSource.trim();
  const templateStart = templateSource.indexOf(templateContent);
  const safeTemplateStart = templateStart < 0 ? 0 : templateStart;
  const templateEnd = safeTemplateStart + templateContent.length;

  return {
    id,
    source,
    template: {
      type: "template",
      content: templateContent,
      attributes: {},
      span: spanAt(templateSource, safeTemplateStart, templateEnd),
      contentSpan: spanAt(templateSource, safeTemplateStart, templateEnd),
    },
    script: script?.block ?? null,
    style: style?.block ?? null,
  };
}

function findBlock(source: string, type: "script" | "style"): LocatedBlock | null {
  const openingPattern = new RegExp(`<${type}\\b([^>]*)>`, "i");
  const opening = openingPattern.exec(source);
  if (!opening || opening.index === undefined) return null;

  const start = opening.index;
  const contentStart = start + opening[0].length;
  const closingStart = findClosingTag(source, type, contentStart);
  if (closingStart < 0) {
    const position = positionAt(source, start);
    const error = new SyntaxError(
      `[CE_SFC_UNCLOSED_BLOCK] Unclosed <${type}> block at line ${position.line}, ` +
      `column ${position.column}. Add the closing </${type}> tag.`,
    ) as SyntaxError & { code: string; hint: string; location: SourceSpan };
    error.code = "CE_SFC_UNCLOSED_BLOCK";
    error.hint = `Add the closing </${type}> tag.`;
    error.location = { start: position, end: positionAt(source, contentStart) };
    throw error;
  }

  const closingText = `</${type}>`;
  const end = closingStart + closingText.length;
  const rawContent = source.slice(contentStart, closingStart);
  const leadingWhitespace = rawContent.length - rawContent.trimStart().length;
  const trailingWhitespace = rawContent.length - rawContent.trimEnd().length;
  const trimmedStart = contentStart + leadingWhitespace;
  const trimmedEnd = Math.max(trimmedStart, closingStart - trailingWhitespace);

  return {
    start,
    end,
    block: {
      type,
      content: source.slice(trimmedStart, trimmedEnd),
      attributes: parseAttributes(opening[1] ?? ""),
      span: spanAt(source, start, end),
      contentSpan: spanAt(source, trimmedStart, trimmedEnd),
    },
  };
}

function findClosingTag(source: string, type: "script" | "style", from: number): number {
  const closing = `</${type}>`;
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = from; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (source.startsWith(closing, index)) return index;
    if (char === "/" && next === "*") {
      blockComment = true;
      index++;
    } else if (type === "script" && char === "/" && next === "/") {
      lineComment = true;
      index++;
    } else if (char === "'" || char === '"' || char === "`") {
      quote = char;
    }
  }

  return -1;
}

function parseAttributes(source: string): Record<string, SfcAttributeValue> {
  const attributes: Record<string, SfcAttributeValue> = {};
  const pattern = /([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    attributes[match[1]] = match[2] ?? match[3] ?? match[4] ?? true;
  }

  return attributes;
}

function spanAt(source: string, start: number, end: number): SourceSpan {
  return { start: positionAt(source, start), end: positionAt(source, end) };
}

function positionAt(source: string, offset: number): SourcePosition {
  const before = source.slice(0, offset);
  const lines = before.split("\n");
  return {
    offset,
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}
