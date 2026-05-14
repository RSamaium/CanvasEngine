import pkg from "peggy";
import fs from "fs";
import { beforeAll, describe, test, expect } from "vitest";

const { generate } = pkg;
let parser: any;

beforeAll(() => {
  const grammar = fs.readFileSync("packages/compiler/grammar2.pegjs", "utf8");
  parser = generate(grammar);
});

// Helper functions to test scoping logic directly
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive number and map to letters only (a-z)
  // Use modulo to map to 26 letters, then convert to character
  const positiveHash = Math.abs(hash);
  let result = '';
  for (let i = 0; i < 8; i++) {
    const letterIndex = (positiveHash + i * 31) % 26; // 31 is a prime to spread values
    result += String.fromCharCode(97 + letterIndex); // 97 is 'a'
  }
  return result;
}

function scopeCSS(css: string, scopeClass: string): string {
  const scopeSelector = `.${scopeClass}`;

  // Process CSS by finding rule blocks while skipping @rules
  let result = '';
  let i = 0;
  let depth = 0;
  let inRule = false;
  let selectorBuffer = '';

  while (i < css.length) {
    const char = css[i];

    if (char === '@' && !inRule && selectorBuffer === '') {
      // Found @rule - copy it as-is until matching closing brace
      const atRuleStart = i;
      i++; // Skip '@'

      // Find the opening brace
      while (i < css.length && css[i] !== '{') {
        i++;
      }

      if (i < css.length) {
        // Found opening brace, now find matching closing brace
        depth = 1;
        i++; // Skip '{'

        while (i < css.length && depth > 0) {
          if (css[i] === '{') depth++;
          else if (css[i] === '}') depth--;
          i++;
        }

        // Copy entire @rule as-is
        result += css.substring(atRuleStart, i);
      }
      continue;
    }

    if (char === '{' && !inRule) {
      // Start of a rule block - scope the selector we just collected
      const selectorText = selectorBuffer.trim();

      if (selectorText) {
        // Split selectors by comma and scope each one
        const scopedSelectors = selectorText
          .split(',')
          .map(sel => {
            const trimmed = sel.trim();
            return trimmed ? `${scopeSelector} ${trimmed}` : trimmed;
          })
          .join(', ');

        result += scopedSelectors;
      }
      result += ' {';
      inRule = true;
      depth = 1;
      selectorBuffer = '';
    } else if (char === '{' && inRule) {
      // Nested brace
      result += char;
      depth++;
    } else if (char === '}' && inRule) {
      result += char;
      depth--;
      if (depth === 0) {
        inRule = false;
      }
    } else if (!inRule) {
      // Collecting selector
      selectorBuffer += char;
    } else {
      // Inside rule block
      result += char;
      if (char === '{') depth++;
    }

    i++;
  }

  // Add any remaining selector (shouldn't happen in valid CSS, but handle it)
  if (selectorBuffer.trim()) {
    const scopedSelectors = selectorBuffer.trim()
      .split(',')
      .map(sel => {
        const trimmed = sel.trim();
        return trimmed ? `${scopeSelector} ${trimmed}` : trimmed;
      })
      .join(', ');
    result += scopedSelectors;
  }

  return result;
}

function splitCallArguments(argsText: string): string[] {
  const args: string[] = [];
  let current = "";
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = 0; i < argsText.length; i++) {
    const char = argsText[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaped = true;
      continue;
    }

    if (inSingle) {
      current += char;
      if (char === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      current += char;
      if (char === '"') inDouble = false;
      continue;
    }

    if (inTemplate) {
      current += char;
      if (char === "`") inTemplate = false;
      continue;
    }

    if (char === "'") {
      inSingle = true;
      current += char;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      current += char;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      current += char;
      continue;
    }

    if (char === "(" || char === "{" || char === "[") {
      depth++;
      current += char;
      continue;
    }

    if (char === ")" || char === "}" || char === "]") {
      depth--;
      current += char;
      continue;
    }

    if (char === "," && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function addScopeClassToDOMContainer(parsedTemplate: string, scopeClass: string): string {
  let result = "";
  let cursor = 0;

  while (cursor < parsedTemplate.length) {
    const start = parsedTemplate.indexOf("h(DOMContainer", cursor);
    if (start === -1) {
      result += parsedTemplate.slice(cursor);
      break;
    }

    result += parsedTemplate.slice(cursor, start);
    const openParen = parsedTemplate.indexOf("(", start);
    if (openParen === -1) {
      result += parsedTemplate.slice(start);
      break;
    }

    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let escaped = false;
    let end = -1;

    for (let i = openParen; i < parsedTemplate.length; i++) {
      const char = parsedTemplate[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (inSingle) {
        if (char === "'") inSingle = false;
        continue;
      }

      if (inDouble) {
        if (char === '"') inDouble = false;
        continue;
      }

      if (inTemplate) {
        if (char === "`") inTemplate = false;
        continue;
      }

      if (char === "'") {
        inSingle = true;
        continue;
      }

      if (char === '"') {
        inDouble = true;
        continue;
      }

      if (char === "`") {
        inTemplate = true;
        continue;
      }

      if (char === "(") depth++;
      if (char === ")") depth--;

      if (depth === 0) {
        end = i + 1;
        break;
      }
    }

    if (end === -1) {
      result += parsedTemplate.slice(start);
      break;
    }

    const callText = parsedTemplate.slice(start, end);
    const argsText = parsedTemplate.slice(openParen + 1, end - 1);
    const args = splitCallArguments(argsText);

    if (args[0]?.trim() !== "DOMContainer") {
      result += callText;
      cursor = end;
      continue;
    }

    if (args.length === 1) {
      args.push(`{ _scopeClass: '${scopeClass}' }`);
    } else {
      const props = args[1].trim();
      if (props === "null" || props === "undefined") {
        args[1] = `{ _scopeClass: '${scopeClass}' }`;
      } else if (props.startsWith("{")) {
        args[1] = props.replace(/^\{\s*/, `{ _scopeClass: '${scopeClass}', `);
      } else {
        args[1] = `{ _scopeClass: '${scopeClass}', ...${props} }`;
      }
    }

    result += `h(${args.join(", ")})`;
    cursor = end;
  }

  return result;
}

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

  test("should compile if/else condition", () => {
    const input = `
            @if (sprite) {
                <Sprite />
            }
            @else {
                <Text text="No sprite" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(sprite, () => h(Sprite), () => h(Text, { text: 'No sprite' }))`);
  });

  test("should compile if/else if condition", () => {
    const input = `
            @if (score() >= 90) {
                <Text text="A+" />
            }
            @else if (score() >= 80) {
                <Text text="A" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => score() >= 90), () => h(Text, { text: 'A+' }), [computed(() => score() >= 80), () => h(Text, { text: 'A' })])`);
  });

  test("should compile if/else if/else condition", () => {
    const input = `
            @if (score() >= 90) {
                <Text text="A+" />
            }
            @else if (score() >= 80) {
                <Text text="A" />
            }
            @else {
                <Text text="F" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => score() >= 90), () => h(Text, { text: 'A+' }), [computed(() => score() >= 80), () => h(Text, { text: 'A' })], () => h(Text, { text: 'F' }))`);
  });

  test("should compile if/else if/else condition within canvas", () => {
    const input = `<Canvas>
  <Container>
    @if (score() >= 90) {
        <Text text="Grade: A+" x={100} y={100} color="gold" size={24} />
        <Text text="Excellent work!" x={100} y={130} color="gold" size={16} />
    }
  </Container>
</Canvas>
        `;

    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, null, h(Container, null, cond(computed(() => score() >= 90), () => [h(Text, { text: 'Grade: A+', x: 100, y: 100, color: 'gold', size: 24 }), h(Text, { text: 'Excellent work!', x: 100, y: 130, color: 'gold', size: 16 })])))`);
  });

  test("should compile multiple else if conditions", () => {
    const input = `
            @if (score() >= 90) {
                <Text text="A+" />
            }
            @else if (score() >= 80) {
                <Text text="A" />
            }
            @else if (score() >= 70) {
                <Text text="B" />
            }
            @else if (score() >= 60) {
                <Text text="C" />
            }
            @else {
                <Text text="F" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => score() >= 90), () => h(Text, { text: 'A+' }), [computed(() => score() >= 80), () => h(Text, { text: 'A' })], [computed(() => score() >= 70), () => h(Text, { text: 'B' })], [computed(() => score() >= 60), () => h(Text, { text: 'C' })], () => h(Text, { text: 'F' }))`);
  });

  test("should compile if/else with multiple elements", () => {
    const input = `
            @if (user().role() === 'admin') {
                <Text text="Admin Panel" />
                <Text text="Settings" />
            }
            @else {
                <Text text="Please log in" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => user().role() === 'admin'), () => [h(Text, { text: 'Admin Panel' }), h(Text, { text: 'Settings' })], () => h(Text, { text: 'Please log in' }))`);
  });

  test("should compile nested if/else conditions", () => {
    const input = `
            @if (user) {
                @if (user.isActive) {
                    <Text text="Active user" />
                }
                @else {
                    <Text text="Inactive user" />
                }
            }
            @else {
                <Text text="No user" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(user, () => cond(user.isActive, () => h(Text, { text: 'Active user' }), () => h(Text, { text: 'Inactive user' })), () => h(Text, { text: 'No user' }))`);
  });

  test("should compile if/else if with simple conditions", () => {
    const input = `
            @if (theme() === 'dark') {
                <Text text="Dark mode" />
            }
            @else if (theme() === 'light') {
                <Text text="Light mode" />
            }
            @else {
                <Text text="Auto mode" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => theme() === 'dark'), () => h(Text, { text: 'Dark mode' }), [computed(() => theme() === 'light'), () => h(Text, { text: 'Light mode' })], () => h(Text, { text: 'Auto mode' }))`);
  });

  test("should compile if/else with function conditions", () => {
    const input = `
            @if (isVisible()) {
                <Sprite />
            }
            @else {
                <Text text="Hidden" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => isVisible()), () => h(Sprite), () => h(Text, { text: 'Hidden' }))`);
  });

  test("should compile if/else if with object property conditions", () => {
    const input = `
            @if (sprite.visible) {
                <Sprite />
            }
            @else if (sprite.loading) {
                <Text text="Loading..." />
            }
            @else {
                <Text text="Not available" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(sprite.visible, () => h(Sprite), [sprite.loading, () => h(Text, { text: 'Loading...' })], () => h(Text, { text: 'Not available' }))`);
  });

  test("should compile condition with function call and @ literal argument", () => {
    const input = `
            @if (isSelected(item.id)) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => isSelected(item.id)), () => h(Sprite))`);
  });

  test("should compile condition with function call and @ literal in dot notation", () => {
    const input = `
            @if (isSelected(item.id)) {
                <Sprite />
            }
            @else {
                <Text text="Not selected" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => isSelected(item.id)), () => h(Sprite), () => h(Text, { text: 'Not selected' }))`);
  });

  test("should compile condition with function call and mixed @ literal and signal", () => {
    const input = `
            @if (isSelected(item.id())) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => isSelected(item.id())), () => h(Sprite))`);
  });

  test("should compile condition with function call and @ literal property", () => {
    const input = `
            @if (check(value)) {
                <Text text="Checked" />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => check(value)), () => h(Text, { text: 'Checked' }))`);
  });

  test("should compile condition with function call and multiple @ literal arguments", () => {
    const input = `
            @if (compare(item.id, other.id)) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => compare(item.id, other.id)), () => h(Sprite))`);
  });

  test("should compile condition with comparison and @ literal dot notation", () => {
    const input = `
            @if (isSelected() == item.id) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => isSelected() == item.id), () => h(Sprite))`);
  });

  test("should compile condition with comparison and mixed @ literal and signal", () => {
    const input = `
            @if (isSelected() == item().id()) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => isSelected() == item().id()), () => h(Sprite))`);
  });

  test("should compile condition with comparison and signal and @ literal", () => {
    const input = `
            @if (isSelected() == item().id) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => isSelected() == item().id), () => h(Sprite))`);
  });

  test("should compile component with templating string", () => {
    const input = `<Canvas width={\`direction: \${direction()}\`} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: \`direction: \${direction()}\` })`);
  });

  test("should compile component with templating string with @ (literal)", () => {
    const input = `<Canvas width={\`direction: \${direction}\`} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: \`direction: \${direction}\` })`);
  });

  test("should compile template string without transforming identifiers", () => {
    const input = `<Canvas width={\`hello \${name}\`} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: \`hello \${name}\` })`);
  });

  test("should compile component with object attribute", () => {
    const input = `<Canvas width={ {x: 10, y: 20} } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: { x: 10, y: 20 } })`);
  });

  test("should format compact object attribute spacing", () => {
    const input = `<Canvas width={{x:10,y:20}} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: { x: 10, y: 20 } })`);
  });

  test('should compile component with object attribute', () => {
    const input = `
    <Container obj={{positive: stat.delta > 0, negative: stat.delta < 0}}></Container>
    `;
    const output = parser.parse(input);
   expect(output).toBe(`h(Container, { obj: { positive: stat.delta > 0, negative: stat.delta < 0 } })`);
  });

  test('should compile component with object attribute', () => {
    const input = `
    <Container obj={{positive: positive(), negative: stat.delta < 0}}></Container>
    `;
    const output = parser.parse(input);
   expect(output).toBe(`h(Container, { obj: computed(() => ({ positive: positive(), negative: stat.delta < 0 })) })`);
  });

  test('should compile object attribute with function and nested value', () => {
    const input = `<Container obj={{ foo: bar(), nested: baz }} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Container, { obj: computed(() => ({ foo: bar(), nested: baz })) })`);
  });

  test('should compile object attribute with spread and function', () => {
    const input = `<Container obj={{ ...base, count: total() }} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Container, { obj: computed(() => ({ ...base, count: total() })) })`);
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
    const input = `<Canvas width={deep().value()} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => deep().value()) })`);
  });

  test('should compile component with deep object attribute', () => {
    const input = `<Button 
      style={{
        backgroundColor: {
          normal: "#6c757d",
          hover: "#5a6268",
          pressed: "#545b62"
        },
        text: {
          fontSize: 16,
          color: "#ffffff"
        }
      }}
    />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Button, { style: { backgroundColor: { normal: "#6c757d", hover: "#5a6268", pressed: "#545b62" }, text: { fontSize: 16, color: "#ffffff" } } })`);
  });

  test('should compile component with deep object attribute and shorthand', () => {
    const input = `<Canvas>
  <Container>
    <Sprite x y sheet={{
      definition,
      playing: animationPlaying,
      params: {
          direction
      }
    }}
    controls />
  </Container>
</Canvas>
`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, null, h(Container, null, h(Sprite, { x, y, sheet: { definition, playing: animationPlaying, params: { direction } }, controls })))`);
  });

  test("should compile component with deep object attribute but not transform to signal", () => {
    const input = `<Canvas width={deep.value()} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => deep.value()) })`);
  });

  test("should compile component with deep object attribute but not all transform to signal", () => {
    const input = `<Canvas width={deep.value} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: deep.value })`);
  });

  test("should compile component with dynamic object attribute", () => {
    const input = `<Canvas width={ {x: x, y: 20} } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: { x: x, y: 20 } })`);
  });

  test("should compile component with array attribute", () => {
    const input = `<Canvas width={ [10, 20] } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: [10, 20] })`);
  });

  test("should compile component with dynamic array attribute", () => {
    const input = `<Canvas width={ [x, 20] } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: [x, 20] })`);
  });

  test("should compile component with array attribute containing function", () => {
    const input = `<Canvas width={ [x(), 20] } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: computed(() => [x(), 20]) })`);
  });

  test("should compile component with array attribute containing expression without computed", () => {
    const input = `<Canvas width={ [x + 1, y] } />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Canvas, { width: [x + 1, y] })`);
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

  test('should compile component with event handler function call without computed', () => {
    const input = `<Sprite click={selected()} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Sprite, { click: selected() })`);
  });

  test('should compile component with complex event handler expression without computed', () => {
    const input = `<Sprite click={selected() ? onA : onB} />`;
    const output = parser.parse(input);
    expect(output).toBe(`h(Sprite, { click: selected() ? onA : onB })`);
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

  test("should compile component with dynamic text content and multiple literals", () => {
    const input = `<button tabindex={item.id}>{item.label}</button>`;
    const output = parser.parse(input);
    expect(output).toBe(`h(DOMElement, { element: "button", attrs: { tabindex: item.id }, textContent: item.label })`);
  });

  test("should compile component with dynamic signal text content", () => {
    const input = `<button>{item().label()}</button>`;
    const output = parser.parse(input);
    expect(output).toBe(`h(DOMElement, { element: "button", textContent: computed(() => item().label()) })`);
  });

  test("should compile text content with mixed expression and function", () => {
    const input = `<p>{a + b()}</p>`;
    const output = parser.parse(input);
    expect(output).toBe(`h(DOMElement, { element: "p", textContent: computed(() => a + b()) })`);
  });

  test("should compile text content with multiple function calls", () => {
    const input = `<p>{a() + b()}</p>`;
    const output = parser.parse(input);
    expect(output).toBe(`h(DOMElement, { element: "p", textContent: computed(() => a() + b()) })`);
  });

  test("should compile text content with dot notation without computed", () => {
    const input = `<p>{user.name}</p>`;
    const output = parser.parse(input);
    expect(output).toBe(`h(DOMElement, { element: "p", textContent: user.name })`);
  });

  test("should compile mixed text with signal without nested computed", () => {
    const input = `<p>Gold: {gold()}</p>`;
    const output = parser.parse(input);
    expect(output).toBe(`h(DOMElement, { element: "p", textContent: computed(() => 'Gold: ' + gold()) })`);
  });

  test("should compile mixed text and void element content", () => {
    const input = `<p>{gold()} <br> G</p>`;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "p" }, [computed(() => gold()), h(DOMElement, { element: "br" }), ' G'])`.replace(/\s+/g, "")
    );
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
            @if (!sprite()) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => !sprite()), () => h(Sprite))`);
  });

  test("should compile negative condition with multiple condition", () => {
    const input = `
            @if (!sprite() && other()) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => !sprite() && other()), () => h(Sprite))`);
  });

  test("should compile negative condition with multiple condition (or)", () => {
    const input = `
            @if (!sprite() || other()) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => !sprite() || other()), () => h(Sprite))`);
  });

  test("should compile condition with nested parentheses", () => {
    const input = `
            @if ((a && b()) || c) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => (a && b()) || c), () => h(Sprite))`);
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

  test("should compile condition when function value as computed", () => {
    const input = `
            @if (val()) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => val()), () => h(Sprite))`);
  });

  test("should compile condition with function call as computed", () => {
    const input = `
            @if (isVisible()) {
                <Sprite />
            }
        `;
    const output = parser.parse(input);
    expect(output).toBe(`cond(computed(() => isVisible()), () => h(Sprite))`);
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

  test("should compile if/else within canvas", () => {
    const input = `
            <Canvas>
                @if (showSprite) {
                    <Sprite />
                }
                @else {
                    <Text text="No sprite" />
                }
            </Canvas>
        `;
    const output = parser.parse(input);
    expect(output).toBe(
      `h(Canvas, null, cond(showSprite, () => h(Sprite), () => h(Text, { text: 'No sprite' })))`
    );
  });

  test("should compile if/else if/else within loop", () => {
    const input = `
            @for (item of items) {
                @if (item().type() === 'sprite') {
                    <Sprite />
                }
                @else if (item().type() === 'text') {
                    <Text />
                }
                @else {
                    <Container />
                }
            }
        `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(items,item=>cond(computed(()=>item().type()==='sprite'),()=>h(Sprite),[computed(()=>item().type()==='text'),()=>h(Text)],()=>h(Container)))`.replace(/\s+/g, "")
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

  test('should merge static and dynamic class attributes', () => {
    const input = `<div class="container" class={className} />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "div", attrs: { class: [\'container\', className] } })');
  });

  test('should merge static and object class attributes', () => {
    const input = `<div class="container" class={{ active: true }} />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "div", attrs: { class: [\'container\', { active: true }] } })');
  });

  test('reactive class attributes', () => {
    const input = `<div class={{ active: active() }} />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "div", attrs: { class: computed(() => ({ active: active() })) } })');
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

  test('should compile DOM with data-disabled expression', () => {
    const input = `<button data-disabled={!skill || !skill.usable} />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "button", attrs: { \'data-disabled\': computed(() => !skill || !skill.usable) } })');
  });

  test('should compile DOM with conditional tabindex and click attributes', () => {
    const input = `<button tabindex={skill ? index : -1} click={skill ? onSelectSkill(index) : undefined} />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "button", attrs: { tabindex: computed(() => skill ? index : -1), click: skill ? onSelectSkill(index) : undefined } })');
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

  test('should compile DOMContainer with class and style attributes', () => {
    const input = `<DOMContainer class="panel" style="color: red;" x={10} />`;
    const output = parser.parse(input);
    expect(output).toBe(
      'h(DOMContainer, { attrs: { class: \'panel\', style: \'color: red;\' }, x: 10 })'
    );
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

  test('should compile DOM with sprite effect special attributes', () => {
    const input = `<input type="password" outline={outline} clip={clip} occlusion={occlusion} />`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "input", attrs: { type: \'password\' }, outline: outline, clip: clip, occlusion: occlusion })');
  });

  test('should compile DOM with text object', () => {
    const input = `<p>{{ object().x() }}</p>`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "p", textContent: computed(() => object().x()) })');
  });

  test('should compile DOM with text object with method call', () => {
    const input = `<p>{{ object.x() }}</p>`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "p", textContent: computed(() => object.x()) })');
  });

  test('should compile DOM with text object with literal ', () => {
    const input = `<p>{{ object.x }}</p>`;
    const output = parser.parse(input);
    expect(output).toBe('h(DOMElement, { element: "p", textContent: object.x })');
  });
});

describe('DOM with Control Structures', () => {
  test('should compile @for loop with DOM elements', () => {
    const input = `
      @for (item of items) {
        <li>{item().name()}</li>
      }
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `loop(items, item => h(DOMElement, { element: "li", textContent: computed(() => item().name()) }))`.replace(/\s+/g, "")
    );
  });

  test('Use literal text content', () => {
    const input = `
      <p>{text}</p>
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
            <a href={item().url()}>{item().title()}</a>
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
              <h2>{section().title()}</h2>
              <div class="items">
                @for (item of section.items) {
                  <div class="item">{item().name()}</div>
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
              <td>{user().name()}</td>
              <td>{user().age()}</td>
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
            <Sprite x={sprite().x()} y={sprite().y()} />
          }
        </Canvas>
        <div class="ui-overlay">
          @if (showScore) {
            <div class="score">Score: {score()}</div>
          }
          @if (showMenu) {
            <div class="menu">
              @for (option of menuOptions) {
                <button class="menu-btn">{option().label()}</button>
              }
            </div>
          }
        </div>
      </div>
    `;
    const output = parser.parse(input);
    expect(output.replace(/\s+/g, "")).toBe(
      `h(DOMElement, { element: "div", attrs: { class: 'game-wrapper' } }, [h(Canvas, { width: 800, height: 600 }, loop(sprites, sprite => h(Sprite, { x: computed(() => sprite().x()), y: computed(() => sprite().y()) }))), h(DOMElement, { element: "div", attrs: { class: 'ui-overlay' } }, [cond(showScore, () => h(DOMElement, { element: "div", attrs: { class: 'score' }, textContent: computed(() => 'Score: ' + score()) })), cond(showMenu, () => h(DOMElement, { element: "div", attrs: { class: 'menu' } }, loop(menuOptions, option => h(DOMElement, { element: "button", attrs: { class: 'menu-btn' }, textContent: computed(() => option().label()) }))))])])`.replace(/\s+/g, "")
    );
  });
});

describe('Style scoping', () => {
  test('should scope CSS selectors correctly', () => {
    const css = `button {
  color: red;
}
div {
  padding: 10px;
}`;

    const scopeClass = 'abc12345';
    const scoped = scopeCSS(css, scopeClass);

    // Should prefix selectors with scope class
    expect(scoped).toContain(`.${scopeClass} button`);
    expect(scoped).toContain(`.${scopeClass} div`);
    expect(scoped).toContain('color: red');
    expect(scoped).toContain('padding: 10px');
  });

  test('should preserve @rules in scoped CSS', () => {
    const css = `@media (max-width: 600px) {
  button {
    font-size: 14px;
  }
}
button {
  color: red;
}`;

    const scopeClass = 'abc12345';
    const scoped = scopeCSS(css, scopeClass);

    // @media should not be scoped
    expect(scoped).toContain('@media');
    // button inside @media should not be scoped
    expect(scoped).toMatch(/@media[^{]*\{[^}]*button[^}]*\{/);
    // Regular button should be scoped
    expect(scoped).toContain(`.${scopeClass} button`);
  });

  test('should add _scopeClass to DOMContainer in parsed template', () => {
    const parsedTemplate = 'h(Canvas, null, h(DOMContainer))';
    const scopeClass = 'abc12345';
    const result = addScopeClassToDOMContainer(parsedTemplate, scopeClass);

    expect(result).toContain('_scopeClass');
    expect(result).toMatch(/h\(DOMContainer,\s*\{\s*_scopeClass:\s*'abc12345'/);
  });

  test('should add _scopeClass to DOMContainer with existing props', () => {
    const parsedTemplate = 'h(Canvas, null, h(DOMContainer, { class: "my-class", x: 100 }))';
    const scopeClass = 'abc12345';
    const result = addScopeClassToDOMContainer(parsedTemplate, scopeClass);

    expect(result).toContain('_scopeClass');
    expect(result).toContain('class: "my-class"');
    expect(result).toContain('x: 100');
    // _scopeClass should be first in the props object
    expect(result).toMatch(/\{\s*_scopeClass:\s*'abc12345',\s*class:/);
  });

  test('should add _scopeClass to DOMContainer with attrs object', () => {
    const parsedTemplate = 'h(Canvas, null, h(DOMContainer, { attrs: { class: "container" } }))';
    const scopeClass = 'abc12345';
    const result = addScopeClassToDOMContainer(parsedTemplate, scopeClass);

    expect(result).toContain('_scopeClass');
    expect(result).toContain('attrs: { class: "container" }');
    expect(result).toMatch(/\{\s*_scopeClass:\s*'abc12345',\s*attrs:/);
  });

  test('should add _scopeClass to DOMContainer with null props', () => {
    const parsedTemplate = 'h(Canvas, null, h(DOMContainer, null, h(Text)))';
    const scopeClass = 'abc12345';
    const result = addScopeClassToDOMContainer(parsedTemplate, scopeClass);

    expect(result).toContain('_scopeClass');
    expect(result).toMatch(/h\(DOMContainer,\s*\{\s*_scopeClass:\s*'abc12345'\s*\},\s*h\(Text\)/);
  });

  test('should handle multiple DOMContainer with same scope class', () => {
    const parsedTemplate = 'h(Canvas, null, [h(DOMContainer), h(DOMContainer, { class: "test" })])';
    const scopeClass = 'abc12345';
    const result = addScopeClassToDOMContainer(parsedTemplate, scopeClass);

    // Both should have _scopeClass
    const matches = result.match(/_scopeClass/g);
    expect(matches?.length).toBe(2);
    // Both should have the same scope class value
    expect(result.match(/_scopeClass:\s*'abc12345'/g)?.length).toBe(2);
  });

  test('should generate 8-character hash with letters only', () => {
    const hash1 = generateHash('/test/my-component.ce');
    const hash2 = generateHash('/test/another-component.ce');

    // Should be exactly 8 characters
    expect(hash1.length).toBe(8);
    expect(hash2.length).toBe(8);

    // Should be letters only (lowercase a-z)
    expect(hash1).toMatch(/^[a-z]{8}$/);
    expect(hash2).toMatch(/^[a-z]{8}$/);

    // Different files should produce different hashes (most of the time)
    // Note: hash collisions are possible but unlikely for different paths
    expect(hash1).not.toBe(hash2);
  });

  test('should generate consistent hash for same file', () => {
    const filePath = '/test/my-component.ce';
    const hash1 = generateHash(filePath);
    const hash2 = generateHash(filePath);

    // Same file should produce same hash
    expect(hash1).toBe(hash2);
  });

  
});
