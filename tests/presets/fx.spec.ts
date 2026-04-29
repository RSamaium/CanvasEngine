import { describe, expect, test, vi } from "vitest";
import { Container, Texture } from "pixi.js";
import {
  FX_PRESETS,
  FxRuntime,
  type FxPreset,
} from "../../packages/presets/src/fx";

describe("Fx preset runtime", () => {
  test("spawns burst particles from a preset", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    const spawned = vi.fn();

    runtime.spawn(container, FX_PRESETS.hitSpark, {
      onParticleSpawn: spawned,
    });
    runtime.update(16);

    expect(spawned).toHaveBeenCalledTimes(18);
    expect(container.children.length).toBe(18);
  });

  test("uses visible procedural textures for shape presets", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });

    runtime.spawn(container, FX_PRESETS.hitSpark);
    runtime.update(16);

    const particle = container.children[0] as any;
    expect(particle.texture.width).toBeGreaterThan(1);
    expect(particle.texture.height).toBeGreaterThan(1);
    expect(particle.width).toBeGreaterThan(1);
  });

  test("removes particles after their lifetime", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    const preset: FxPreset = {
      duration: 20,
      emitters: [
        {
          burst: 3,
          particle: {
            texture: Texture.WHITE,
            lifetime: 40,
            alpha: [1, 0],
            scale: [1, 0],
          },
        },
      ],
    };

    runtime.spawn(container, preset);
    runtime.update(1);
    expect(container.children.length).toBe(3);

    runtime.update(80);
    expect(container.children.length).toBe(0);
    expect(runtime.activeInstances).toBe(0);
  });

  test("emits particles over time with rate", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    const preset: FxPreset = {
      duration: 1000,
      emitters: [
        {
          rate: 10,
          particle: {
            texture: Texture.WHITE,
            lifetime: 700,
          },
        },
      ],
    };

    runtime.spawn(container, preset);
    runtime.update(100);
    expect(container.children.length).toBe(1);
    runtime.update(400);
    expect(container.children.length).toBe(5);
  });

  test("uses image fallback shape when texture is missing", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    const preset: FxPreset = {
      emitters: [
        {
          burst: 1,
          particle: {
            image: "/not-preloaded.png",
            lifetime: 100,
          },
        },
      ],
    };

    runtime.spawn(container, preset, { missingTexture: "shape" });
    runtime.update(1);

    expect(container.children.length).toBe(1);
  });

  test("can skip missing image textures", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    const preset: FxPreset = {
      emitters: [
        {
          burst: 1,
          particle: {
            image: "/not-preloaded.png",
            lifetime: 100,
          },
        },
      ],
    };

    runtime.spawn(container, preset, { missingTexture: "skip" });
    runtime.update(1);

    expect(container.children.length).toBe(0);
  });
});
