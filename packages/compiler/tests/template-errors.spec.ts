import { describe, expect, test } from "vitest";
import canvasengine from "../index";

function compileInvalid(template: string, id = "/app/app.ce"): Error {
  const plugin = canvasengine({ hmr: false }) as any;

  try {
    plugin.transform(template, id);
  } catch (error) {
    return error as Error;
  }

  throw new Error("Expected template compilation to fail");
}

describe("CanvasEngine template diagnostics", () => {
  test("reports a malformed @for header instead of an unclosed parent", () => {
    const error = compileInvalid(`<Container>
  @for (item items) {
    <Text text={item} />
  }
</Container>`);

    expect(error.message).toContain("Error parsing template in /app/app.ce");
    expect(error.message).toContain("[CE_TEMPLATE_INVALID_FOR] Invalid @for directive.");
    expect(error.message).toContain("2 |   @for (item items) {");
    expect(error.message).toContain("|   ^");
    expect(error.message).toContain('Hint: Expected "@for (item of items) { ... }".');
  });

  test("reports an empty @if condition", () => {
    const error = compileInvalid(`<Container>
  @if () {
    <Text />
  }
</Container>`);

    expect(error.message).toContain("[CE_TEMPLATE_INVALID_IF] Invalid @if directive.");
    expect(error.message).toContain("2 |   @if () {");
    expect(error.message).toContain('Hint: Expected "@if (condition) { ... }" with a non-empty condition.');
  });

  test("reports mismatched closing tags at the closing tag", () => {
    const error = compileInvalid(`<Container>
  <Text />
</Canvas>`);

    expect(error.message).toContain("[CE_TEMPLATE_MISMATCHED_TAG] Mismatched tag: opened <Container> but closed </Canvas>.");
    expect(error.message).toContain("3 | </Canvas>");
    expect(error.message).toContain("Hint: Replace </Canvas> with </Container>.");
  });

  test("reports an unclosed attribute expression", () => {
    const error = compileInvalid(`<Container>
  <Text color={selected() />
</Container>`);

    expect(error.message).toContain("[CE_TEMPLATE_UNCLOSED_EXPRESSION] Unclosed expression for attribute 'color'.");
    expect(error.message).toContain("2 |   <Text color={selected() />");
    expect(error.message).toContain("Hint: Add the missing closing brace before the end of the attribute.");
  });

  test("reports an unclosed quoted attribute", () => {
    const error = compileInvalid(`<Text text="missing />`);

    expect(error.message).toContain("[CE_TEMPLATE_UNCLOSED_QUOTE] Unclosed quoted value for attribute 'text'.");
    expect(error.message).toContain('1 | <Text text="missing />');
    expect(error.message).toContain("Hint: Add the missing closing quote before the end of the attribute.");
  });

  test("reports invalid JavaScript in a dynamic attribute", () => {
    const error = compileInvalid(`<Text color={selected() ? "#fff" :} />`);

    expect(error.message).toContain("[CE_TEMPLATE_INVALID_EXPRESSION] Invalid expression for attribute 'color'.");
    expect(error.message).toContain('1 | <Text color={selected() ? "#fff" :} />');
    expect(error.message).toContain("Hint: Check the JavaScript expression inside color={...}.");
  });

  test("reports an unclosed tag at its opening tag", () => {
    const error = compileInvalid(`<Container>
  <Text />`);

    expect(error.message).toContain("[CE_TEMPLATE_UNCLOSED_TAG] Unclosed tag <Container>.");
    expect(error.message).toContain("1 | <Container>");
    expect(error.message).toContain("Hint: Add the missing </Container> closing tag.");
  });

  test("reports a complex bare spread and suggests JSX-style braces", () => {
    const error = compileInvalid(`<Container ...getProps()?.value />`);

    expect(error.message).toContain("[CE_TEMPLATE_INVALID_SPREAD] Invalid spread attribute.");
    expect(error.message).toContain("(line 1, column 12)");
    expect(error.message).toContain("1 | <Container ...getProps()?.value />");
    expect(error.message).toContain("Hint: Wrap the spread expression in braces: {...getProps()?.value}.");
  });

  test("reports an unquoted attribute with string and binding alternatives", () => {
    const error = compileInvalid(`<Text size=14 />`);

    expect(error.message).toContain("[CE_TEMPLATE_UNQUOTED_ATTRIBUTE] Attribute 'size' must be quoted or bound.");
    expect(error.message).toContain("(line 1, column 7)");
    expect(error.message).toContain("1 | <Text size=14 />");
    expect(error.message).toContain('Hint: Use size="14" for text or size={14} for a JavaScript value.');
  });

  test("reports an orphan @else directive", () => {
    const error = compileInvalid(`@else { <Text /> }`);

    expect(error.message).toContain("[CE_TEMPLATE_ORPHAN_ELSE] @else has no matching @if.");
    expect(error.message).toContain("(line 1, column 1)");
    expect(error.message).toContain("1 | @else { <Text /> }");
    expect(error.message).toContain("Hint: Place @else immediately after an @if or @else if block.");
  });

  test("reports Vue-style binding prefixes", () => {
    const error = compileInvalid(`<Text :text="label" />`);

    expect(error.message).toContain("[CE_TEMPLATE_UNSUPPORTED_BINDING_PREFIX] Vue-style ':text' binding is not supported.");
    expect(error.message).toContain("(line 1, column 7)");
    expect(error.message).toContain('1 | <Text :text="label" />');
    expect(error.message).toContain("Hint: Use text={label} for a JavaScript binding.");
  });

  test("reports unsupported JSX fragments", () => {
    const error = compileInvalid(`<><Text /><Sprite /></>`);

    expect(error.message).toContain("[CE_TEMPLATE_UNSUPPORTED_FRAGMENT] JSX fragments are not supported.");
    expect(error.message).toContain("(line 1, column 1)");
    expect(error.message).toContain("1 | <><Text /><Sprite /></>");
    expect(error.message).toContain("Hint: Use sibling root elements directly or wrap them in <Container>.");
  });
});
