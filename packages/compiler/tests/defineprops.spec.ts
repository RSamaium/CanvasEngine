import { describe, test, expect } from "vitest";
import canvasengine from "../dist/index.js";

describe("DefineProps Plugin Tests", () => {
  test("should preserve defineProps variables in destructured form", () => {
    const input = `<Canvas>
      <Text text />
    </Canvas>

    <script>
    const { text } = defineProps();
    </script>`;
    
    const plugin = canvasengine();
    const result = plugin.transform(input, 'test.ce');
    
    expect(result).not.toBeNull();
    expect(result!.code).toContain('var text = defineProps().text');
  });

  test("should preserve simple defineProps variable", () => {
    const input = `<Canvas>
      <Text text />
    </Canvas>

    <script>
    const props = defineProps();
    </script>`;
    
    const plugin = canvasengine();
    const result = plugin.transform(input, 'test.ce');
    
    expect(result).not.toBeNull();
    expect(result!.code).toContain('var props = defineProps()');
  });

  test("should preserve multiple defineProps variables", () => {
    const input = `<Canvas>
      <Text text />
      <Sprite width height />
    </Canvas>

    <script>
    const { text, width, height } = defineProps();
    </script>`;
    
    const plugin = canvasengine();
    const result = plugin.transform(input, 'test.ce');
    
    expect(result).not.toBeNull();
    expect(result!.code).toContain('text = _a.text');
    expect(result!.code).toContain('width = _a.width');
    expect(result!.code).toContain('height = _a.height');
  });

  test("should handle mixed variable declaration styles", () => {
    const input = `<Canvas>
      <Text text />
    </Canvas>

    <script>
    let { text } = defineProps();
    var props = defineProps();
    </script>`;
    
    const plugin = canvasengine();
    const result = plugin.transform(input, 'test.ce');
    
    expect(result).not.toBeNull();
    expect(result!.code).toContain('text');
    expect(result!.code).toContain('props');
  });

  test("should handle defineProps with type annotations", () => {
    const input = `<Canvas>
      <Text text />
    </Canvas>

    <script>
    const { text }: { text: string } = defineProps();
    </script>`;
    
    const plugin = canvasengine();
    const result = plugin.transform(input, 'test.ce');
    
    expect(result).not.toBeNull();
    // TypeScript should remove type annotations but preserve the variable
    expect(result!.code).toContain('text');
  });

  test("should work without defineProps usage", () => {
    const input = `<Canvas>
      <Text text="Hello World" />
    </Canvas>

    <script>
    const message = "Hello";
    </script>`;
    
    const plugin = canvasengine();
    const result = plugin.transform(input, 'test.ce');
    
    expect(result).not.toBeNull();
    expect(result!.code).toContain('var message = "Hello"');
  });
});