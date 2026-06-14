import { describe, expect, test } from "vitest";
import canvasengine, { canvasengineManualChunks, withCanvasEngineManualChunks } from "../index";

describe("CanvasEngine Vite production chunks", () => {
  test("groups Pixi modules in a stable Pixi chunk", () => {
    expect(
      canvasengineManualChunks(
        "/project/node_modules/.pnpm/pixi.js@8.18.1/node_modules/pixi.js/lib/rendering/renderers/canvas/CanvasRenderer.mjs"
      )
    ).toBe("pixi");

    expect(
      canvasengineManualChunks(
        "/project/node_modules/.pnpm/@pixi+layout@3.2.0/node_modules/@pixi/layout/dist/index.mjs"
      )
    ).toBe("pixi");
  });

  test("groups CanvasEngine packages in a stable CanvasEngine chunk", () => {
    expect(
      canvasengineManualChunks(
        "/project/node_modules/.pnpm/canvasengine@2.0.0-beta.58/node_modules/canvasengine/dist/index.js"
      )
    ).toBe("canvasengine");

    expect(
      canvasengineManualChunks(
        "/project/node_modules/.pnpm/@canvasengine+presets@2.0.0-beta.58/node_modules/@canvasengine/presets/dist/index.js"
      )
    ).toBe("canvasengine");
  });

  test("preserves user manualChunks after CanvasEngine chunks", () => {
    const manualChunks = withCanvasEngineManualChunks((id: string) => {
      if (id.includes("lodash")) return "vendor";
    });

    expect(manualChunks("/project/node_modules/pixi.js/lib/index.mjs", {})).toBe("pixi");
    expect(manualChunks("/project/node_modules/lodash-es/lodash.js", {})).toBe("vendor");
    expect(manualChunks("/project/src/main.ts", {})).toBeUndefined();
  });
});

describe("CanvasEngine Vite HMR option", () => {
  const source = `<Container />`;
  const id = "/project/src/App.ce";
  const restoreNodeEnv = (previousEnv: string | undefined) => {
    if (previousEnv === undefined) {
      delete process.env.NODE_ENV;
      return;
    }
    process.env.NODE_ENV = previousEnv;
  };

  test("wraps compiled components in hot components by default in dev", () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "dev";
    try {
      const plugin = canvasengine() as any;
      const result = plugin.transform(source, id);

      expect(result.code).toContain("createHotComponent");
      expect(result.code).toContain("import.meta.hot.accept");
    } finally {
      restoreNodeEnv(previousEnv);
    }
  });

  test("can disable compiled component HMR in dev", () => {
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "dev";
    try {
      const plugin = canvasengine({ hmr: false }) as any;
      const result = plugin.transform(source, id);

      expect(result.code).not.toContain("createHotComponent");
      expect(result.code).not.toContain("import.meta.hot.accept");
      expect(result.code).toContain("const __ce_component = component");
    } finally {
      restoreNodeEnv(previousEnv);
    }
  });
});

describe("CanvasEngine Vite component macros", () => {
  test("injects defineEmits into compiled components", () => {
    const plugin = canvasengine({ hmr: false }) as any;
    const result = plugin.transform(`<Container />`, "/project/src/App.ce");

    expect(result.code).toContain("useDefineEmits");
    expect(result.code).toContain("const defineEmits = useDefineEmits($$props)");
  });
});
