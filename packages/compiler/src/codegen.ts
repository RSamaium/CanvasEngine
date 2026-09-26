import type {
  AttributeNode,
  ElementNode,
  ForNode,
  IfNode,
  SvgNode,
  TemplateLocation,
  TemplateNode,
  TemplateRoot,
  TextNode,
  ValueNode,
} from "./types";

export interface CodegenOptions {
  /** Throws when a `{...}` attribute is not a valid JavaScript expression. */
  validateExpression?: (code: string) => void;
  /** Whether an expression calls a function, which makes it reactive. */
  hasFunctionCall?: (code: string) => boolean;
}

const EVENT_ATTRIBUTES = new Set([
  "click", "tap", "pointertap", "pointerdown", "pointerup", "pointermove",
  "pointerover", "pointerout", "pointerupoutside", "mousedown", "mouseup",
  "mousemove", "mouseover", "mouseout", "touchstart", "touchend", "touchmove",
  "touchcancel", "rightclick", "keydown", "keyup", "keypress",
]);

// Props kept on a DOMElement itself instead of its HTML `attrs`
const DISPLAY_OBJECT_ATTRIBUTES = new Set([
  "x", "y", "scale", "anchor", "skew", "tint", "rotation", "angle",
  "zIndex", "roundPixels", "cursor", "visible", "alpha", "pivot", "filters", "maskOf",
  "blendMode", "filterArea", "minWidth", "minHeight", "maxWidth", "maxHeight",
  "aspectRatio", "flexGrow", "flexShrink", "flexBasis", "rowGap", "columnGap",
  "positionType", "top", "right", "bottom", "left", "objectFit", "objectPosition",
  "transformOrigin", "flexDirection", "justifyContent", "alignItems", "alignContent",
  "alignSelf", "margin", "padding", "border", "gap", "blur", "shadow", "outline",
  "clip", "occlusion",
]);

/**
 * Generates the JavaScript expression of a template from the tree returned by
 * the template grammar. The result calls the runtime helpers `h`, `cond`,
 * `loop` and `computed`.
 *
 * @param root - Tree returned by the grammar for the whole template.
 * @param options - Expression validation and function call detection.
 * @returns The template expression, or null for a template made of a single comment.
 *
 * @example
 * generateTemplateCode(parser.parse(`<Text text={label} />`))
 * // "h(Text, { text: label })"
 */
export function generateTemplateCode(root: TemplateRoot, options: CodegenOptions = {}): string | null {
  const hasFunctionCall = (value: string) =>
    options.hasFunctionCall
      ? options.hasFunctionCall(value)
      : /[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(value);

  const validateAttributeExpression = (
    attributeName: string,
    value: string,
    location: TemplateLocation,
  ) => {
    if (!options.validateExpression) return;
    try {
      options.validateExpression(value);
    } catch {
      throw templateError(
        "CE_TEMPLATE_INVALID_EXPRESSION",
        `Invalid expression for attribute '${attributeName}'.`,
        location,
        `Check the JavaScript expression inside ${attributeName}={...}.`,
      );
    }
  };

  const node = (child: TemplateNode | TextNode): string | null => {
    switch (child.type) {
      case "Element": return element(child);
      case "If": return ifBlock(child);
      case "For": return forLoop(child);
      case "Svg": return svg(child);
      case "Text": return textContent(child);
      case "Comment": return null;
    }
  };

  /** Child nodes as a single child, an array of children, or null. */
  const content = (children: Array<TemplateNode | TextNode>): string | null => {
    const codes = children.map(node).filter(code => code !== null);
    if (codes.length === 0) return null;
    if (codes.length === 1) return codes[0];
    return `[${codes.join(", ")}]`;
  };

  const value = (valueNode: ValueNode): string | null => {
    switch (valueNode.type) {
      case "Expression":
        return valueNode.code;
      case "ObjectLiteral":
        return `{ ${valueNode.properties
          .map(({ key, value: propertyValue }) =>
            propertyValue ? `${key}: ${value(propertyValue)}` : key
          )
          .join(", ")} }`;
      case "ArrowElement":
        return `${valueNode.params ? `(${valueNode.params}) =>` : "() =>"} ${node(valueNode.body)}`;
      default:
        return node(valueNode);
    }
  };

  const element = (elementNode: ElementNode): string => {
    const { tag, form } = elementNode;
    const attributes = elementNode.attributes.map(attribute);
    const text = form === "text" ? textContent(elementNode.text!) : undefined;
    const children = form === "content" ? content(elementNode.children!) : null;

    if (elementNode.dom) {
      return domElement(tag, attributes, { text, hasText: form === "text", children });
    }

    if (form === "text") {
      const attrsString = formatAttributes(attributes);
      return attrsString ? `h(${tag}, ${attrsString}, ${text})` : `h(${tag}, null, ${text})`;
    }

    const attrsString = tag === "DOMContainer"
      ? formatDOMContainerAttributes(attributes)
      : formatAttributes(attributes);
    if (attrsString && children) return `h(${tag}, ${attrsString}, ${children})`;
    if (attrsString) return `h(${tag}, ${attrsString})`;
    if (children) return `h(${tag}, null, ${children})`;
    return `h(${tag})`;
  };

  const attribute = (attributeNode: AttributeNode): string => {
    switch (attributeNode.type) {
      case "StaticAttribute":
        return `${formatAttributeName(attributeNode.name)}: ${quoteSingleString(attributeNode.value)}`;
      case "ShorthandAttribute":
        return formatAttributeName(attributeNode.name);
      case "SpreadAttribute":
        if (attributeNode.validate) {
          validateAttributeExpression("spread", attributeNode.code, attributeNode.location);
        }
        return `...${attributeNode.code}`;
      case "DynamicAttribute":
        return dynamicAttribute(
          attributeNode.name,
          value(attributeNode.value) as string,
          attributeNode.location,
        );
    }
  };

  /** `name={value}`, wrapped in `computed` when the value is reactive. */
  const dynamicAttribute = (attributeName: string, attributeValue: string, location: TemplateLocation): string => {
    validateAttributeExpression(attributeName, attributeValue, location);

    const formattedName = formatAttributeName(attributeName);

    if (EVENT_ATTRIBUTES.has(attributeName)) {
      return `${formattedName}: ${attributeValue}`;
    }

    // If it's a template string, keep it as-is
    if (attributeValue.trim().startsWith("`") && attributeValue.trim().endsWith("`")) {
      return formattedName + ": " + attributeValue;
    }

    const trimmedValue = attributeValue.trim();
    if (
      (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
      (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
    ) {
      return `${formattedName}: ${attributeValue}`;
    }

    const isObjectLiteral = trimmedValue.startsWith("{") && trimmedValue.endsWith("}");
    const isArrayLiteral = trimmedValue.startsWith("[") && trimmedValue.endsWith("]");

    // Handle component and standalone function values without making event-like callbacks reactive.
    if (attributeValue.startsWith("h(") || (!isObjectLiteral && attributeValue.includes("=>"))) {
      return `${formattedName}: ${attributeValue}`;
    }

    if (trimmedValue.match(/^[a-zA-Z_]\w*$/)) {
      return `${formattedName}: ${attributeValue}`;
    }

    if (/^\d+(\.\d+)?$/.test(trimmedValue) || ["true", "false", "null"].includes(trimmedValue)) {
      return `${formattedName}: ${attributeValue}`;
    }

    if (isSimpleAccessor(trimmedValue)) {
      return `${formattedName}: ${attributeValue}`;
    }

    const isTernaryExpression = trimmedValue.includes("?") && trimmedValue.includes(":");
    if (isObjectLiteral) {
      const formattedObject = formatObjectLiteralSpacing(attributeValue);
      if (hasFunctionCall(trimmedValue)) {
        return `${formattedName}: computed(() => (${formattedObject}))`;
      }
      return `${formattedName}: ${formattedObject}`;
    }
    if (isArrayLiteral) {
      if (hasFunctionCall(trimmedValue)) {
        return `${formattedName}: computed(() => ${attributeValue})`;
      }
      return `${formattedName}: ${attributeValue}`;
    }

    if (isTernaryExpression) {
      return `${formattedName}: computed(() => ${attributeValue})`;
    }

    if (hasFunctionCall(trimmedValue)) {
      return `${formattedName}: computed(() => ${attributeValue})`;
    }

    if (!hasIdentifier(trimmedValue)) {
      return `${formattedName}: ${attributeValue}`;
    }

    const computedValue = transformBareIdentifiersToSignals(attributeValue);
    return `${formattedName}: computed(() => ${computedValue})`;
  };

  /**
   * Text and `{expression}` parts of an element, concatenated. The result is
   * wrapped in `computed` when a part calls a function.
   */
  const textContent = (textNode: TextNode): string | null => {
    const parts = textNode.parts.map(part => {
      if (part.type === "TextPart") {
        if (!part.value.trim()) return null;
        return quoteSingleString(part.value);
      }
      const trimmedExpr = (value(part.value) as string).trim();
      if (!trimmedExpr) {
        return trimmedExpr;
      }
      if (hasFunctionCall(trimmedExpr)) {
        return `computed(() => ${trimmedExpr})`;
      }
      return trimmedExpr;
    });

    const validParts = parts.filter(part => part !== null) as string[];
    if (validParts.length === 0) return null;
    if (validParts.length === 1) return validParts[0];

    // Multiple parts - need to concatenate
    const normalizedParts = validParts.map(part => {
      if (part.startsWith("computed(() => ") && part.endsWith(")")) {
        return part.slice("computed(() => ".length, -1);
      }
      return part;
    });
    const hasSignals = normalizedParts.some(part => part && part.includes("()"));
    if (hasSignals) {
      return `computed(() => ${normalizedParts.join(" + ")})`;
    }
    return normalizedParts.join(" + ");
  };

  const ifBlock = (ifNode: IfNode): string => {
    let result = `cond(${formatCondition(ifNode.condition)}, () => ${content(ifNode.children)}`;
    for (const elseIf of ifNode.elseIfs) {
      result += `, [${formatCondition(elseIf.condition)}, () => ${content(elseIf.children)}]`;
    }
    const elseContent = ifNode.else ? content(ifNode.else) : null;
    if (elseContent) {
      result += `, () => ${elseContent}`;
    }
    return result + ")";
  };

  const formatCondition = (condition: string): string => {
    if (!condition) return condition;
    const hasOperator = /[!<>=&|]/.test(condition);
    if (hasOperator || hasFunctionCall(condition)) {
      return `computed(() => ${condition})`;
    }
    return condition;
  };

  const forLoop = (forNode: ForNode): string => {
    const iterable = hasFunctionCall(forNode.iterable)
      ? `computed(() => ${forNode.iterable})`
      : forNode.iterable;
    const children = content(forNode.children);
    const trackOption = forNode.track ? `, { track: ${forNode.binding} => ${forNode.track} }` : "";
    return `loop(${iterable}, ${forNode.binding} => ${children}${trackOption})`;
  };

  const svg = (svgNode: SvgNode): string => {
    // Clean up the content by removing extra whitespace and newlines
    const cleanContent = svgNode.content.replace(/\s+/g, " ").trim();
    const rawContent = `<svg${svgNode.attributes ? " " + svgNode.attributes : ""}>${cleanContent}</svg>`;
    return `h(Svg, { content: \`${escapeTemplateLiteral(rawContent)}\` })`;
  };

  return root.children.length === 1
    ? node(root.children[0])
    : `[${root.children.map(node).join(",")}]`;
}

/**
 * Builds a `DOMElement` call. HTML attributes go to `attrs`, display object
 * props stay on the element.
 */
function domElement(
  tagName: string,
  attributes: string[],
  { text, hasText, children }: { text?: string | null; hasText: boolean; children: string | null },
): string {
  const { domAttrs, displayObjectAttrs } = splitAttributes(attributes);
  const parts = [`element: "${tagName}"`];
  if (domAttrs.length > 0) {
    parts.push(`attrs: { ${domAttrs.join(", ")} }`);
  }
  if (hasText) {
    parts.push(`textContent: ${text}`);
  }
  parts.push(...displayObjectAttrs);

  const props = `{ ${parts.join(", ")} }`;
  return children ? `h(DOMElement, ${props}, ${children})` : `h(DOMElement, ${props})`;
}

function templateError(code: string, message: string, location: TemplateLocation, hint: string) {
  const error: any = new Error(message);
  error.name = "CanvasEngineTemplateError";
  error.code = code;
  error.location = location;
  error.hint = hint;
  return error;
}

/** Quotes an attribute name that is not a valid JavaScript identifier. */
function formatAttributeName(name: string): string {
  return /[^a-zA-Z0-9_$]/.test(name) ? `'${name}'` : name;
}

function formatAttributes(attributes: string[]): string | null {
  if (attributes.length === 0) {
    return null;
  }

  // Check if there's exactly one attribute and it's a spread attribute
  if (attributes.length === 1 && attributes[0].startsWith("...")) {
    // Return the identifier directly, removing the '...'
    return attributes[0].substring(3);
  }

  // Otherwise, an object literal: `key: value`, shorthand `name` or `...spread`
  return `{ ${attributes.join(", ")} }`;
}

function splitAttributes(attributes: string[]) {
  const domAttrs: string[] = [];
  const displayObjectAttrs: string[] = [];
  const classValues: string[] = [];
  let classInsertIndex: number | null = null;

  attributes.forEach(attr => {
    // Handle spread attributes
    if (attr.startsWith("...")) {
      displayObjectAttrs.push(attr);
      return;
    }

    // Extract attribute name and value (if present)
    let attrName: string;
    let attrValue: string | undefined;
    if (attr.includes(":")) {
      const colonIndex = attr.indexOf(":");
      attrName = attr.slice(0, colonIndex).trim().replace(/['"]/g, "");
      attrValue = attr.slice(colonIndex + 1).trim();
    } else {
      // Standalone attribute
      attrName = attr.replace(/['"]/g, "");
    }

    // Check if it's a DisplayObject attribute
    if (DISPLAY_OBJECT_ATTRIBUTES.has(attrName)) {
      displayObjectAttrs.push(attr);
      return;
    }

    if (attrName === "class" && attrValue !== undefined) {
      classValues.push(attrValue);
      if (classInsertIndex === null) {
        classInsertIndex = domAttrs.length;
      }
      return;
    }

    domAttrs.push(attr);
  });

  if (classValues.length > 0) {
    const mergedClass = classValues.length === 1
      ? `class: ${classValues[0]}`
      : `class: [${classValues.join(", ")}]`;
    if (classInsertIndex === null) {
      domAttrs.push(mergedClass);
    } else {
      domAttrs.splice(classInsertIndex, 0, mergedClass);
    }
  }

  return { domAttrs, displayObjectAttrs };
}

function formatDOMContainerAttributes(attributes: string[]): string | null {
  if (attributes.length === 0) {
    return null;
  }

  const propsEntries: Array<string | null> = [];
  const domAttrs: string[] = [];
  const classValues: string[] = [];
  let classInsertIndex: number | null = null;
  let attrsInsertIndex: number | null = null;
  let attrsIndex: number | null = null;
  let attrsValue: string | null = null;

  attributes.forEach(attr => {
    if (attr.startsWith("...")) {
      propsEntries.push(attr);
      return;
    }

    let attrName: string;
    let attrValue: string | undefined;
    if (attr.includes(":")) {
      const colonIndex = attr.indexOf(":");
      attrName = attr.slice(0, colonIndex).trim().replace(/['"]/g, "");
      attrValue = attr.slice(colonIndex + 1).trim();
    } else {
      attrName = attr.replace(/['"]/g, "");
    }

    if (attrName === "class" && attrValue !== undefined) {
      classValues.push(attrValue);
      if (classInsertIndex === null) {
        classInsertIndex = domAttrs.length;
      }
      if (attrsInsertIndex === null) {
        attrsInsertIndex = propsEntries.length;
      }
      return;
    }

    if (attrName === "style") {
      domAttrs.push(attr);
      if (attrsInsertIndex === null) {
        attrsInsertIndex = propsEntries.length;
      }
      return;
    }

    if (attrName === "attrs" && attrValue !== undefined) {
      attrsValue = attrValue;
      attrsIndex = propsEntries.length;
      propsEntries.push(null);
      return;
    }

    propsEntries.push(attr);
  });

  if (classValues.length > 0) {
    const mergedClass = classValues.length === 1
      ? `class: ${classValues[0]}`
      : `class: [${classValues.join(", ")}]`;
    if (classInsertIndex === null) {
      domAttrs.push(mergedClass);
    } else {
      domAttrs.splice(classInsertIndex, 0, mergedClass);
    }
  }

  let attrsEntry: string | null = null;
  if (attrsValue && domAttrs.length > 0) {
    attrsEntry = `attrs: { ...${attrsValue}, ${domAttrs.join(", ")} }`;
  } else if (attrsValue) {
    attrsEntry = `attrs: ${attrsValue}`;
  } else if (domAttrs.length > 0) {
    attrsEntry = `attrs: { ${domAttrs.join(", ")} }`;
  }

  if (attrsEntry) {
    if (attrsIndex !== null) {
      propsEntries[attrsIndex] = attrsEntry;
    } else if (attrsInsertIndex !== null) {
      propsEntries.splice(attrsInsertIndex, 0, attrsEntry);
    } else {
      propsEntries.unshift(attrsEntry);
    }
  }

  const filteredEntries = propsEntries.filter(entry => entry !== null) as string[];
  if (filteredEntries.length === 0) {
    return null;
  }

  if (filteredEntries.length === 1 && filteredEntries[0].startsWith("...")) {
    return filteredEntries[0].substring(3);
  }

  return `{ ${filteredEntries.join(", ")} }`;
}

function hasIdentifier(value: string): boolean {
  return /[a-zA-Z_]/.test(value);
}

function isSimpleAccessor(value: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(value.trim());
}

function formatObjectLiteralSpacing(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return value;
  }
  const inner = trimmed.slice(1, -1).trim();
  return `{ ${inner} }`;
}

function quoteSingleString(value: string): string {
  return `'${value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")}'`;
}

/**
 * Escapes raw text embedded in a generated template literal, so backticks and
 * `${` in the source stay literal.
 */
function escapeTemplateLiteral(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

function collectMemberRoots(value: string): Set<string> {
  const roots = new Set<string>();
  const memberRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\./g;
  let match: RegExpExecArray | null;

  while ((match = memberRegex.exec(value)) !== null) {
    roots.add(match[1]);
  }

  return roots;
}

function transformBareIdentifiersToSignals(value: string): string {
  const memberRoots = collectMemberRoots(value);

  return value.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match, name, offset) => {
    if (["true", "false", "null"].includes(name)) {
      return match;
    }

    const beforeMatch = value.substring(0, offset);
    const singleQuotesBefore = (beforeMatch.match(/'/g) || []).length;
    const doubleQuotesBefore = (beforeMatch.match(/"/g) || []).length;
    if (singleQuotesBefore % 2 === 1 || doubleQuotesBefore % 2 === 1) {
      return match;
    }

    const charBefore = offset > 0 ? value[offset - 1] : "";
    const charAfter = offset + match.length < value.length ? value[offset + match.length] : "";

    if (charBefore === "." || charAfter === ".") {
      return match;
    }

    if (memberRoots.has(name)) {
      return match;
    }

    const afterSlice = value.slice(offset + match.length);
    if (/^\s*\(/.test(afterSlice)) {
      return match;
    }

    return `${name}()`;
  });
}
