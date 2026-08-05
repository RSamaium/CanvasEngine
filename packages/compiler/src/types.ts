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

export interface TemplateProgram {
  type: "TemplateProgram";
  source: string;
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
