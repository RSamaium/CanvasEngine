import { describe, expect, test } from "vitest";
import { canvasengineManualChunks, withCanvasEngineManualChunks } from "../index";

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
