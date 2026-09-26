import { describe, expect, test } from "vitest";
import canvasengine from "../index";

function compile(template: string): string {
  const result = (canvasengine({ hmr: false }) as any).transform(template, "/app/tolerance.ce");
  return result.code;
}

describe("CanvasEngine template syntax tolerance", () => {
  test("accepts single-quoted and empty static attributes", () => {
    expect(compile(`<Container><Text text='hello' /><Text text="" /></Container>`))
      .toContain("[h(Text, { text: 'hello' }), h(Text, { text: '' })]");
  });

  test("keeps literal @ characters in text", () => {
    expect(compile(`<p>contact@example.com</p>`))
      .toContain("textContent: 'contact@example.com'");
  });

  test("accepts JSX-style spreads with arbitrary JavaScript expressions", () => {
    expect(compile(`<Container {...props} />`)).toContain("h(Container, props)");
    expect(compile(`<Container {...getProps()?.value} />`))
      .toContain("h(Container, getProps()?.value)");
  });

  test("ignores HTML and JSX comments between children and conditional branches", () => {
    const code = compile(`<Container>
      {/* child note */}
      @if (show) { <Text /> }
      <!-- branch note -->
      @else { <Sprite /> }
    </Container>`);

    expect(code).toContain("cond(show, () => h(Text), () => h(Sprite))");
  });

  test("accepts _, $ and : within attribute names", () => {
    const code = compile(`<Text aria_label="label" data$value="value" xlink:href="icon" />`);

    expect(code).toContain("aria_label: 'label'");
    expect(code).toContain("data$value: 'value'");
    expect(code).toContain("'xlink:href': 'icon'");
  });

  test("matches closing DOM tags case-insensitively", () => {
    expect(compile(`<DIV></div>`)).toContain('element: "DIV"');
  });

  test("treats PascalCase tags named like HTML elements as components", () => {
    expect(compile(`<Video src="a.mp4" />`)).toContain("h(Video, { src: 'a.mp4' })");
    expect(compile(`<Header title="Menu" />`)).toContain("h(Header, { title: 'Menu' })");
    expect(compile(`<Map width={100}></Map>`)).toContain("h(Map, { width: 100 })");
    expect(compile(`<Input value="a" />`)).toContain("h(Input, { value: 'a' })");
  });

  test("keeps lowercase and uppercase HTML tags as DOM elements", () => {
    expect(compile(`<video src="a.mp4" />`)).toContain('h(DOMElement, { element: "video"');
    expect(compile(`<IMG src="a.png">`)).toContain('h(DOMElement, { element: "IMG"');
  });
});
