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
});
