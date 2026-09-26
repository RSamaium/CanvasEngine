export interface SourcePosition {
  offset: number;
  line: number;
  column: number;
}

export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

export type SfcAttributeValue = string | true;

export interface SfcBlock {
  type: "template" | "script" | "style";
  content: string;
  attributes: Record<string, SfcAttributeValue>;
  span: SourceSpan;
  contentSpan: SourceSpan;
}

export interface SfcDescriptor {
  id: string;
  source: string;
  template: SfcBlock;
  script: SfcBlock | null;
  style: SfcBlock | null;
}

export interface CompilerDiagnostic {
  code: string;
  message: string;
  location?: SourceSpan;
  hint?: string;
}

export interface CompileMetadata {
  runtimeHelpers: string[];
  primitiveComponents: string[];
}

/** Peggy location of a template node, with 1-based lines and columns. */
export interface TemplateLocation {
  source?: string;
  start: SourcePosition;
  end: SourcePosition;
}

/** Tree returned by the template grammar (`grammar2.pegjs`). */
export interface TemplateRoot {
  type: "Root";
  /** Top-level nodes, comments included. */
  children: TemplateNode[];
}

export type TemplateNode = ElementNode | IfNode | ForNode | SvgNode | CommentNode;

/**
 * An element tag. `form` records how its content was written, which decides
 * the generated code:
 * - `selfClosing`: `<Tag />`
 * - `void`: an HTML void element without closing tag, `<img>`
 * - `text`: only text and `{expression}` parts, `<Text>Hi {name}</Text>`
 * - `content`: child nodes, and text parts for DOM elements
 */
export interface ElementNode {
  type: "Element";
  form: "selfClosing" | "void" | "text" | "content";
  tag: string;
  /** Whether the tag is an HTML element rendered with `DOMElement`. */
  dom: boolean;
  attributes: AttributeNode[];
  /** Content of a `text` element. */
  text?: TextNode;
  /** Content of a `content` element; may hold comments, and text for DOM elements. */
  children?: Array<TemplateNode | TextNode>;
  location: TemplateLocation;
}

export interface IfNode {
  type: "If";
  /** Raw condition, without the parentheses. */
  condition: string;
  children: TemplateNode[];
  elseIfs: Array<{ condition: string; children: TemplateNode[] }>;
  /** `@else` branch, or null when there is none. */
  else: TemplateNode[] | null;
  location: TemplateLocation;
}

export interface ForNode {
  type: "For";
  /** Loop variable: `item`, or a normalized tuple such as `(item, index)`. */
  binding: string;
  iterable: string;
  track: string | null;
  children: TemplateNode[];
  location: TemplateLocation;
}

export interface SvgNode {
  type: "Svg";
  /** Raw attributes of the `<svg>` tag. */
  attributes: string;
  /** Raw markup between `<svg>` and `</svg>`. */
  content: string;
  location: TemplateLocation;
}

export interface CommentNode {
  type: "Comment";
}

export interface TextNode {
  type: "Text";
  parts: Array<TextPartNode | InterpolationNode>;
  location: TemplateLocation;
}

export interface TextPartNode {
  type: "TextPart";
  /** Raw text, whitespace included. */
  value: string;
}

export interface InterpolationNode {
  type: "Interpolation";
  value: ValueNode;
  location: TemplateLocation;
}

export type AttributeNode =
  | StaticAttributeNode
  | DynamicAttributeNode
  | ShorthandAttributeNode
  | SpreadAttributeNode;

/** `name="value"` */
export interface StaticAttributeNode {
  type: "StaticAttribute";
  name: string;
  value: string;
  location: TemplateLocation;
}

/** `name={value}` */
export interface DynamicAttributeNode {
  type: "DynamicAttribute";
  name: string;
  value: ValueNode;
  location: TemplateLocation;
}

/** `name` alone, which passes the variable of the same name. */
export interface ShorthandAttributeNode {
  type: "ShorthandAttribute";
  name: string;
  location: TemplateLocation;
}

/** `{...expression}`, validated as JavaScript, or the legacy `...expression`. */
export interface SpreadAttributeNode {
  type: "SpreadAttribute";
  code: string;
  validate: boolean;
  location: TemplateLocation;
}

/** Value of a `{...}` attribute or text interpolation. */
export type ValueNode =
  | ExpressionNode
  | ObjectLiteralNode
  | ArrowElementNode
  | TemplateNode;

/** A JavaScript expression kept as written (trimmed). */
export interface ExpressionNode {
  type: "Expression";
  code: string;
}

/** An object literal whose values may be elements: `{ a: 1, icon: <Sprite /> }`. */
export interface ObjectLiteralNode {
  type: "ObjectLiteral";
  properties: Array<{ key: string; value: ValueNode | null }>;
}

/** An arrow function returning an element: `(item) => <Text text={item} />`. */
export interface ArrowElementNode {
  type: "ArrowElement";
  /** Normalized parameters, without parentheses, or null. */
  params: string | null;
  body: TemplateNode;
}

export interface TemplateProgram {
  type: "TemplateProgram";
  source: string;
  /** Tree returned by the template grammar. */
  template: TemplateRoot;
  expression: string;
  ast: any;
  span: SourceSpan;
}

export interface CompileResult {
  code: string;
  map: any;
  diagnostics: CompilerDiagnostic[];
  metadata: CompileMetadata;
}
