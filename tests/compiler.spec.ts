import pkg from "peggy";
import fs from "fs";
import { beforeAll, describe, test, expect } from "vitest";

const { generate } = pkg;
let parser: any;

beforeAll(() => {
  const grammar = fs.readFileSync("src/compiler/grammar.pegjs", "utf8");
  parser = generate(grammar);
});

describe("Compiler", () => {
  test("should compile comment", () => {
    const input = `
      <Canvas>
        <!-- Comment -->
      </Canvas>
    `;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas)`);
  });

  test("should compile multiple comment", () => {
    const input = `
      <Canvas>
        <!-- Comment -->
        <!-- Comment -->
      </Canvas>
    `;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas)`);
  });

  test("should compile multiple line comment", () => {
    const input = `
      <Canvas>
        <!--
          Comment
          Comment
        -->
      </Canvas>
    `;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas)`);
  });

  test("should compile simple component", () => {
    const input = `<Canvas />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas)`);
  });

  test("should compile component with dynamic attribute", () => {
    const input = `<Canvas width={x} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: x })`);
  });

  test("should compile component with object attribute", () => {
    const input = `<Canvas width={ {x: 10, y: 20} } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => ({x: 10, y: 20})) })`);
  });

  test("should compile component with dynamic object attribute", () => {
    const input = `<Canvas width={ {x: x, y: 20} } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => ({x: x(), y: 20})) })`);
  });

  test("should compile component with array attribute", () => {
    const input = `<Canvas width={ [10, 20] } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => [10, 20]) })`);
  });

  test("should compile component with dynamic array attribute", () => {
    const input = `<Canvas width={ [x, 20] } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => [x(), 20]) })`);
  });

  test("should compile component with standalone dynamic attribute", () => {
    const input = `<Canvas width />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width })`);
  });

  test("should compile component with computed dynamic attribute", () => {
    const input = `<Canvas width={x * 2} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => x() * 2) })`);
  });

  test("should compile component with multiple computed dynamic attributes", () => {
    const input = `<Canvas width={x * 2 * y} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => x() * 2 * y()) })`);
  });

  test("should compile component with static numeric attribute", () => {
    const input = `<Canvas width="10" />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: 10 })`);
  });

  test("should compile component with static string attribute", () => {
    const input = `<Canvas width="val" />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: 'val' })`);
  });

  test("should compile component with children", () => {
    const input = `
            <Canvas>
                <Sprite />
                <Text />
            </Canvas>
        `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(Canvas,null,[h(Sprite),h(Text)])`.replace(/\s+/g, "")
    );
  });

  test("should compile component with multi children", () => {
    const input = `
           <Sprite />
           <Sprite />
        `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `[h(Sprite),h(Sprite)]`.replace(/\s+/g, "")
    );
  });

  test("should compile component with event handler", () => {
    const input = `<Sprite @click={fn} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Sprite, { click: fn })`);
  });

  test("should compile component with standalone event handler", () => {
    const input = `<Sprite @click />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Sprite, { click })`);
  });

  test('should compile component with inline event handler', () => {
      const input = `<Sprite @click={() => console.log('click')} />`;
      const output = parser.parse(input);
      expect(output).toBe(`h(Sprite, { click: () => console.log('click') })`);
  });

  // test("should compile component with component attribute", () => {
  //   const input = `<Canvas child={<Sprite />} />`;
  //   const output = parser.parse(input);
  //   expect(output).toBe(`h(Canvas, { child: h(Sprite) })`);
  // });
});

describe("Loop", () => {
  test("loop in canvas", () => {
    const input = `
        <Canvas>
            @for (sprite of sprites) {
                <Sprite />
            }
        </Canvas>
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(Canvas,null,loop(sprites,(sprite)=>h(Sprite)))`.replace(/\s+/g, "")
    );
  });

  test("should compile loop", () => {
    const input = `
        @for (sprite of sprites) {
            <Sprite />
        }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(sprites,(sprite)=>h(Sprite))`.replace(/\s+/g, "")
    );
  });

  test("should compile nestedloop", () => {
    const input = `
        @for (sprite of sprites) {
            @for (other of others) {
                <Sprite />
            }
        }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(sprites,(sprite)=>loop(others,(other)=>h(Sprite)))`.replace(
        /\s+/g,
        ""
      )
    );
  });
});

describe("Condition", () => {
  test("should compile condition when sprite is visible", () => {
    const input = `
            @if (sprite.visible) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(sprite.visible, () => h(Sprite))`);
  });

  test("should compile condition for multiple sprites", () => {
    const input = `
            @if (sprite) {
              <Sprite />
            }
            @if (other) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(
      `[cond(sprite, () => h(Sprite)),cond(other, () => h(Sprite))]`
    );
  });

  test("should compile nested condition when sprite is visible", () => {
    const input = `
            @if (sprite.visible) {
               @if (deep) {
                    <Sprite />
                }
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(
      `cond(sprite.visible, () => cond(deep, () => h(Sprite)))`
    );
  });

  test("should compile condition with nested sprite when sprite is visible", () => {
    const input = `
            @if (sprite.visible) {
                <Sprite />
                @if (deep) {
                    <Sprite />
                }
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(
      `cond(sprite.visible, () => [h(Sprite), cond(deep, () => h(Sprite))])`
    );
  });

  test("should compile condition with multiple sprites when sprite is visible", () => {
    const input = `
            @if (sprite.visible) {
                <Sprite />
                @if (deep) {
                    <Sprite />
                }
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(
      `cond(sprite.visible, () => [h(Sprite), cond(deep, () => h(Sprite)), h(Sprite)])`
    );
  });
});

describe("Condition in Loops", () => {
  test("should compile condition within a loop", () => { // New test for condition in a loop
    const input = `
            <Canvas>
                @for (sprite of sprites) {
                    @if (sprite.visible) {
                        <Sprite />
                    }
                }
            </Canvas>
        `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(Canvas,null,loop(sprites,(sprite)=>cond(sprite.visible,()=>h(Sprite))))`.replace(/\s+/g, "")
    );
  });

  test("should compile elements within a loop", () => { // New test for elements in a loop
    const input = `
            <Canvas>
                @for (sprite of sprites) {
                    <Sprite />
                }
            </Canvas>
        `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(Canvas,null,loop(sprites,(sprite)=>h(Sprite)))`.replace(/\s+/g, "")
    );
  });

  test("should compile multiple loops at the same level", () => { // New test for multiple loops
    const input = `
            <Canvas>
                @for (sprite of sprites) {
                    <Sprite />
                }
                @for (other of others) {
                    <Sprite />
                }
            </Canvas>
        `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(Canvas,null,[loop(sprites,(sprite)=>h(Sprite)),loop(others,(other)=>h(Sprite))])`.replace(/\s+/g, "")
    );
  });
});
