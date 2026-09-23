import { describe, expect, test } from "vitest";
import {
  GROUND_SURFACES,
  createSurfaceSamplerFromPixels,
  defaultSurfaceClassifier,
} from "../../packages/presets/src/GroundEffects";

describe("Surface sampler", () => {
  test("classifies typical top-down RPG colors", () => {
    expect(defaultSurfaceClassifier(104, 186, 53).surface).toBe("grass");
    expect(defaultSurfaceClassifier(246, 217, 165).surface).toBe("sand");
    expect(defaultSurfaceClassifier(77, 223, 213).surface).toBe("water");
    expect(defaultSurfaceClassifier(0, 101, 170).surface).toBe("water");
    expect(defaultSurfaceClassifier(120, 110, 100).surface).toBe("ground");
  });

  test("darker blue water is deeper", () => {
    const shore = defaultSurfaceClassifier(77, 223, 213).depth!;
    const middle = defaultSurfaceClassifier(6, 185, 198).depth!;
    const open = defaultSurfaceClassifier(1, 85, 167).depth!;
    expect(shore).toBeLessThan(middle);
    expect(middle).toBeLessThan(open);
    expect(open).toBeCloseTo(1, 1);
  });

  test("samples averaged pixels at world coordinates", () => {
    // 4x1 image: grass, grass, water, water
    const pixels = new Uint8ClampedArray([
      104, 186, 53, 255, 104, 186, 53, 255,
      0, 101, 170, 255, 0, 101, 170, 255,
    ]);
    const sampler = createSurfaceSamplerFromPixels(pixels, 4, 1, { scale: 10, radius: 0 });
    expect(sampler.width).toBe(40);
    expect(sampler.sample(5, 0).surface).toBe("grass");
    const water = sampler.sample(35, 0);
    expect(water.surface).toBe("water");
    expect(water.color).toBe(0x0065aa);
  });
});

describe("Ground surfaces", () => {
  test("water hides more of the body when deeper and removes shadows", () => {
    expect(GROUND_SURFACES.water.deepSubmerge!).toBeGreaterThan(GROUND_SURFACES.water.submerge!);
    expect(GROUND_SURFACES.water.shadow!).toBeLessThan(0.5);
    expect(GROUND_SURFACES.tallGrass.mode).toBe("grass");
    expect(GROUND_SURFACES.sand.puffs).toBe(true);
  });
});
