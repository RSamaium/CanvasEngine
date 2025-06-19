import pkg from "peggy";
import fs from "fs";
import { beforeAll, describe, test, expect } from "vitest";

const { generate } = pkg;
let parser: any;

beforeAll(() => {
  const grammar = fs.readFileSync("packages/compiler/grammar.pegjs", "utf8");
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

  describe("Dot notation", () => {
    test("should compile component with dot notation", () => {
      const input = `<MyComp.test />`;
      const output = parser.parse(input);
      expect(output).toBe(`h(MyComp.test)`);
    });
  
    test("object function call", () => {
      const input = `<MyComp.test() />`;
      const output = parser.parse(input);
      expect(output).toBe(`h(MyComp.test())`);
    });
  
    test("function call with return object", () => {
      const input = `<MyComp().test />`;
      const output = parser.parse(input);
      expect(output).toBe(`h(MyComp().test)`);
    });

    test("function call with return object and params", () => {
      const input = `<MyComp().test(x, y) />`;
      const output = parser.parse(input);
      expect(output).toBe(`h(MyComp().test(x, y))`);
    });

    test("function call and params with return object and", () => {
      const input = `<MyComp(x, y).test />`;
      const output = parser.parse(input);
      expect(output).toBe(`h(MyComp(x, y).test)`);
    });
  
    test("function call", () => {
      const input = `<MyComp() />`;
      const output = parser.parse(input);
      expect(output).toBe(`h(MyComp())`);
    });
  
    test("function call and params", () => {
      const input = `<MyComp(x, y) />`;
      const output = parser.parse(input);
      expect(output).toBe(`h(MyComp(x, y))`);
    });
  })

  test("should compile component with dynamic attribute", () => {
    const input = `<Canvas width={x} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: x })`);
  });

  test("should compile component with spread operator", () => {
    const input = `<Canvas ...obj />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, obj)`);
  });

  test("should compile component with spread operator object", () => {
    const input = `<Canvas ...obj.prop />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, obj.prop)`);
  });

  test("should compile component with spread operator function", () => {
    const input = `<Canvas ...fn() />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, fn())`);
  });

  test("should compile component with spread operator function and params", () => {
    const input = `<Canvas ...fn(x, y) />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, fn(x, y))`);
  });

  test("should compile component with dynamic attribute but is not a signal", () => {
    const input = `<Canvas width={20} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: 20 })`);
  });

  // TODO
  // test("should compile component with templating string", () => {
  //   const input = `<Canvas width={\`direction: \${direction}\`} />`;
  //   const output = parser.parse(input);
  //   expect(output).toBe(`h(Canvas, { width: \`direction: \${direction()}\` })`);
  // });

  // test("should compile component with templating string with @ (literal)", () => {
  //   const input = `<Canvas width={\`direction: \${@direction}\`} />`;
  //   const output = parser.parse(input);
  //   expect(output).toBe(`h(Canvas, { width: \`direction: \${direction}\` })`);
  // });

  test("should compile component with object attribute", () => {
    const input = `<Canvas width={ {x: 10, y: 20} } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: ({x: 10, y: 20}) })`);
  });

  test("should compile component with complex object attribute", () => {
    const input = `<Sprite 
        sheet={{
            definition,
            playing: "stand",
            params: {
                direction: "right"
            },
            onFinish
        }}
    />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Sprite, { sheet: { definition, playing: "stand", params: { direction: "right" }, onFinish } })`);
  });

  test("should compile component with deep object attribute", () => {
    const input = `<Canvas width={deep.value} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => deep().value()) })`);
  });

  test("should compile component with deep object attribute but not transform to signal", () => {
    const input = `<Canvas width={@deep.value} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => deep.value()) })`);
  });

  test("should compile component with deep object attribute but not all transform to signal", () => {
    const input = `<Canvas width={@deep.@value} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: deep.value })`);
  });

  test("should compile component with dynamic object attribute", () => {
    const input = `<Canvas width={ {x: x, y: 20} } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => ({x: x(), y: 20})) })`);
  });

  test("should compile component with array attribute", () => {
    const input = `<Canvas width={ [10, 20] } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: [10, 20] })`);
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

  test("should compile component with static string attribute", () => {
    const input = `<Canvas width="val" />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: 'val' })`);
  });

  test("should compile component with static string attribute with dash", () => {
    const input = `<Canvas max-width="val" />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { 'max-width': 'val' })`);
  });

  test("should compile component with static attribute (with number)", () => {
    const input = `<Canvas width="10" />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: '10' })`);
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

  test("should compile component with multiple children", () => {
    const input = `<Container>
        <Container></Container>
        <Container></Container>
    </Container>
        `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(Container,null,[h(Container),h(Container)])`.replace(/\s+/g, "")
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
    const input = `<Sprite click={fn} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Sprite, { click: fn })`);
  });

  test("should compile component with standalone event handler", () => {
    const input = `<Sprite click />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Sprite, { click })`);
  });

  test('should compile component with inline event handler', () => {
      const input = `<Sprite click={() => console.log('click')} />`;
      const output = parser.parse(input);
      expect(output).toBe(`h(Sprite, { click: () => console.log('click') })`);
  });

  test("should compile component with component attribute", () => {
    const input = `<Canvas child={<Sprite />} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { child: h(Sprite) })`);
  });

  test("should compile component with function returns component attribute", () => {
    const input = `<Canvas child={() => <Sprite />} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { child: () => h(Sprite) })`);
  });

  test("should compile component with function (with params) returns component attribute", () => {
    const input = `<Canvas child={(x, y) => <Sprite />} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { child: (x, y) => h(Sprite) })`);
  });

  test("should compile component with destructuring function (with params)", () => {
    const input = `<Canvas child={({ x, y }) => <Sprite />} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { child: ({x, y}) => h(Sprite) })`);
  });

  test("should compile component with function returns component attribute and data", () => {
    const input = `<Canvas child={() => <Text text="Hello" />} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { child: () => h(Text, { text: 'Hello' }) })`);
  });

  test("should compile component with function returns component attribute and child", () => {
    const input = `<Canvas child={() => <Container>
        <Text text="Hello" />
    </Container>} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { child: () => h(Container, null, h(Text, { text: 'Hello' })) })`);
  });

  test("should compile component with function returns component attribute and children", () => {
    const input = `<Canvas child={() => <Container>
        <Text text="Hello 1" />
        <Text text="Hello 2" />
    </Container>} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { child: () => h(Container, null, [h(Text, { text: 'Hello 1' }), h(Text, { text: 'Hello 2' })]) })`);
  });
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
      `h(Canvas,null,loop(sprites,sprite=>h(Sprite)))`.replace(/\s+/g, "")
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
      `loop(sprites,sprite=>h(Sprite))`.replace(/\s+/g, "")
    );
  });

  test("should compile loop with object", () => {
    const input = `
        @for (sprite of sprites.items) {
            <Sprite />
        }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(sprites.items,sprite=>h(Sprite))`.replace(/\s+/g, "")
    );
  });

  test("should compile loop with deep object", () => {
    const input = `
        @for (sprite of sprites.items.items) {
            <Sprite />
        }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(sprites.items.items,sprite=>h(Sprite))`.replace(/\s+/g, "")
    );
  });

  test("should compile loop with function", () => {
    const input = `
        @for (sprite of sprites()) {
            <Sprite />
        }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(sprites(),sprite=>h(Sprite))`.replace(/\s+/g, "")
    );
  });

  test("should compile loop with function and params", () => {
    const input = `
        @for (sprite of sprites(x, y)) {
            <Sprite />
        }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(sprites(x,y),sprite=>h(Sprite))`.replace(/\s+/g, "")
    );
  });

  test("should compile loop with object and function and params", () => {
    const input = `
        @for (sprite of sprites.items(x, y)) {
            <Sprite />
        }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(sprites.items(x,y),sprite=>h(Sprite))`.replace(/\s+/g, "")
    );
  });

  test("should compile loop with destructuring", () => {
    const input = `
        @for ((sprite, index) of sprites) {
            <Sprite key={index} />
        }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(sprites,(sprite,index)=>h(Sprite, { key: index }))`.replace(/\s+/g, "")
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
      `loop(sprites,sprite=>loop(others,other=>h(Sprite)))`.replace(
        /\s+/g,
        ""
      )
    );
  });
});

describe("Condition", () => {
  test("should compile condition", () => {
    const input = `
            @if (sprite) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(sprite, () => h(Sprite))`);
  });

  test("should compile negative condition", () => {
    const input = `
            @if (!sprite) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => !sprite()), () => h(Sprite))`);
  });

  test("should compile negative condition with multiple condition", () => {
    const input = `
            @if (!sprite && other) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => !sprite() && other()), () => h(Sprite))`);
  });

  test("should compile negative condition with multiple condition (or)", () => {
    const input = `
            @if (!sprite || other) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => !sprite() || other()), () => h(Sprite))`);
  });

  test("should compile condition when sprite is visible", () => {
    const input = `
            @if (sprite.visible) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(sprite.visible, () => h(Sprite))`);
  });

  test("should compile condition when function value", () => {
    const input = `
            @if (val()) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(val(), () => h(Sprite))`);
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
      `h(Canvas,null,loop(sprites,sprite=>cond(sprite.visible,()=>h(Sprite))))`.replace(/\s+/g, "")
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
      `h(Canvas,null,loop(sprites,sprite=>h(Sprite)))`.replace(/\s+/g, "")
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
      `h(Canvas,null,[loop(sprites,sprite=>h(Sprite)),loop(others,other=>h(Sprite))])`.replace(/\s+/g, "")
    );
  });

});

describe('Svg', () => {
  test('should compile svg', () => {
    const input = `<svg>
      <path d="M 100 350 l 150 -300" stroke="red" stroke-width="4"/>
    </svg>`;
    const output = parser.parse(input);
    expect(output).toBe('h(Svg, { content: `<svg><path d="M 100 350 l 150 -300" stroke="red" stroke-width="4"/></svg>` })');
  });

  test('should compile svg with canvas', () => {
    const input = `<Canvas antialias={true}>
    <svg height="400" width="450" xmlns="http://www.w3.org/2000/svg"></svg></Canvas>`;
    const output = parser.parse(input);
    expect(output).toBe('h(Canvas, { antialias: true }, h(Svg, { content: `<svg height="400" width="450" xmlns="http://www.w3.org/2000/svg"></svg>` }))');
  });
});

describe('DOM', () => {
  test('should compile input DOM', () => {
    const input = `<input type="text" />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "input", attrs: { type: \'text\' } })');
  });

  test('should compile div DOM', () => {
    const input = `<div class="container" />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "div", attrs: { class: \'container\' } })');
  });

  test('should compile button DOM', () => {
    const input = `<button type="submit" />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "button", attrs: { type: \'submit\' } })');
  });

  test('should compile button DOM', () => {
    const input = `<button>Text</button>`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "button", textContent: \'Text\' })');
  });

  test('should compile textarea DOM with dynamic attributes', () => {
    const input = `<textarea rows={rows} cols={cols} />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "textarea", attrs: { rows: rows, cols: cols } })');
  });

  test('should not transform Canvas to DOM', () => {
    const input = `<Canvas width={800} />`;
    const output = parser.parse(input);
    expect(output).toBe('h(Canvas, { width: 800 })');
  });

  test('should not transform Sprite to DOM', () => {
    const input = `<Sprite image="test.png" />`;
    const output = parser.parse(input);
    expect(output).toBe('h(Sprite, { image: \'test.png\' })');
  });

  // Tests avec imbrications DOM
  test('should compile nested DOM elements', () => {
    const input = `<div class="container">
      <p>Hello World</p>
    </div>`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "div", attrs: { class: \'container\' } }, h(DOMElement, { element: "p", textContent: \'Hello World\' }))');
  });

  test('should compile deeply nested DOM elements', () => {
    const input = `<div class="wrapper">
      <section>
        <h1>Title</h1>
        <p>Content</p>
      </section>
    </div>`;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "div", attrs: { class: 'wrapper' } }, h(DOMElement, { element: "section" }, [h(DOMElement, { element: "h1", textContent: 'Title' }), h(DOMElement, { element: "p", textContent: 'Content' })]))`.replace(/\s+/g, "")
    );
  });

  test('should compile DOM with multiple children', () => {
    const input = `<ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>`;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "ul" }, [h(DOMElement, { element: "li", textContent: 'Item 1' }), h(DOMElement, { element: "li", textContent: 'Item 2' }), h(DOMElement, { element: "li", textContent: 'Item 3' })])`.replace(/\s+/g, "")
    );
  });

  test('should compile mixed DOM and framework components', () => {
    const input = `<div class="game-container">
      <Canvas width={800} height={600} />
      <div class="ui">
        <button>Start Game</button>
      </div>
    </div>`;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "div", attrs: { class: 'game-container' } }, [h(Canvas, { width: 800, height: 600 }), h(DOMElement, { element: "div", attrs: { class: 'ui' } }, h(DOMElement, { element: "button", textContent: 'Start Game' }))])`.replace(/\s+/g, "")
    );
  });

  test('should compile DOM with attributes and text content', () => {
    const input = `<button class="btn primary" type="submit">Submit Form</button>`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "button", attrs: { class: \'btn primary\', type: \'submit\' }, textContent: \'Submit Form\' })');
  });
});

describe('DOM with special attributes', () => {
  test('should compile DOM with special attributes', () => {
    const input = `<input type="password" x={100} y={100} />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "input", attrs: { type: \'password\' }, x: 100, y: 100 })');
  });
});

describe('DOM with Control Structures', () => {
  test('should compile @for loop with DOM elements', () => {
    const input = `
      @for (item of items) {
        <li>{item.name}</li>
      }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(items, item => h(DOMElement, { element: "li", textContent: computed(() => item().name()) }))`.replace(/\s+/g, "")
    );
  });

  test('Use literal text content', () => {
    const input = `
      <p>{@text}</p>
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "p", textContent: text })`.replace(/\s+/g, "")
    );
  })

  test('should compile @for loop with nested DOM structure', () => {
    const input = `
      <ul class="menu">
        @for (item of menuItems) {
          <li class="menu-item">
            <a href={item.url}>{item.title}</a>
          </li>
        }
      </ul>
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "ul", attrs: { class: 'menu' } }, loop(menuItems, item => h(DOMElement, { element: "li", attrs: { class: 'menu-item' } }, h(DOMElement, { element: "a", attrs: { href: computed(() => item().url()) }, textContent: computed(() => item().title()) }))))`.replace(/\s+/g, "")
    );
  });

  test('should compile @if condition with DOM elements', () => {
    const input = `
      @if (showMessage) {
        <div class="alert">
          <p>Important message!</p>
        </div>
      }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `cond(showMessage, () => h(DOMElement, { element: "div", attrs: { class: 'alert' } }, h(DOMElement, { element: "p", textContent: 'Important message!' })))`.replace(/\s+/g, "")
    );
  });

  test('should compile @if condition with simple DOM element', () => {
    const input = `
      @if (isVisible) {
        <button>Click me</button>
      }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `cond(isVisible, () => h(DOMElement, { element: "button", textContent: 'Click me' }))`.replace(/\s+/g, "")
    );
  });

  test('should compile nested @for and @if with DOM', () => {
    const input = `
      <div class="container">
        @for (section of sections) {
          @if (section.visible) {
            <section class="content">
              <h2>{section.title}</h2>
              <div class="items">
                @for (item of section.items) {
                  <div class="item">{item.name}</div>
                }
              </div>
            </section>
          }
        }
      </div>
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "div", attrs: { class: 'container' } }, loop(sections, section => cond(section.visible, () => h(DOMElement, { element: "section", attrs: { class: 'content' } }, [h(DOMElement, { element: "h2", textContent: computed(() => section().title()) }), h(DOMElement, { element: "div", attrs: { class: 'items' } }, loop(section.items, item => h(DOMElement, { element: "div", attrs: { class: 'item' }, textContent: computed(() => item().name()) })))]))))`.replace(/\s+/g, "")
    );
  });

  test('should compile @for with DOM table structure', () => {
    const input = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          @for (user of users) {
            <tr>
              <td>{user.name}</td>
              <td>{user.age}</td>
            </tr>
          }
        </tbody>
      </table>
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "table" }, [h(DOMElement, { element: "thead" }, h(DOMElement, { element: "tr" }, [h(DOMElement, { element: "th", textContent: 'Name' }), h(DOMElement, { element: "th", textContent: 'Age' })])), h(DOMElement, { element: "tbody" }, loop(users, user => h(DOMElement, { element: "tr" }, [h(DOMElement, { element: "td", textContent: computed(() => user().name()) }), h(DOMElement, { element: "td", textContent: computed(() => user().age()) })])))])`.replace(/\s+/g, "")
    );
  });

  test('should compile @if with multiple DOM conditions', () => {
    const input = `
      <div class="status">
        @if (isLoading) {
          <div class="spinner">Loading...</div>
        }
        @if (hasError) {
          <div class="error">Error occurred!</div>
        }
        @if (isSuccess) {
          <div class="success">Success!</div>
        }
      </div>
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "div", attrs: { class: 'status' } }, [cond(isLoading, () => h(DOMElement, { element: "div", attrs: { class: 'spinner' }, textContent: 'Loading...' })), cond(hasError, () => h(DOMElement, { element: "div", attrs: { class: 'error' }, textContent: 'Error occurred!' })), cond(isSuccess, () => h(DOMElement, { element: "div", attrs: { class: 'success' }, textContent: 'Success!' }))])`.replace(/\s+/g, "")
    );
  });

  test('should compile mixed Canvas and DOM with control structures', () => {
    const input = `
      <div class="game-wrapper">
        <Canvas width={800} height={600}>
          @for (sprite of sprites) {
            <Sprite x={sprite.x} y={sprite.y} />
          }
        </Canvas>
        <div class="ui-overlay">
          @if (showScore) {
            <div class="score">Score: {score}</div>
          }
          @if (showMenu) {
            <div class="menu">
              @for (option of menuOptions) {
                <button class="menu-btn">{option.label}</button>
              }
            </div>
          }
        </div>
      </div>
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "div", attrs: { class: 'game-wrapper' } }, [h(Canvas, { width: 800, height: 600 }, loop(sprites, sprite => h(Sprite, { x: computed(() => sprite().x()), y: computed(() => sprite().y()) }))), h(DOMElement, { element: "div", attrs: { class: 'ui-overlay' } }, [cond(showScore, () => h(DOMElement, { element: "div", attrs: { class: 'score' }, textContent: computed(() => 'Score: ' + computed(() => score())) })), cond(showMenu, () => h(DOMElement, { element: "div", attrs: { class: 'menu' } }, loop(menuOptions, option => h(DOMElement, { element: "button", attrs: { class: 'menu-btn' }, textContent: computed(() => option().label()) }))))])])`.replace(/\s+/g, "")
    );
  });
});