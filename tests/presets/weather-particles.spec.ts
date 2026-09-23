import { describe, expect, test } from "vitest";
import {
  WEATHER_PARTICLE_EFFECTS,
  WEATHER_PRESETS,
  WeatherParticleField,
  getWeatherPreset,
} from "../../packages/presets/src/Weathers";

const createRandom = (seed = 1) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const params = { width: 1280, height: 720, density: 100, maxDrops: 500 };

describe("Weather particle effects", () => {
  test("every particle effect fills the visible area", () => {
    for (const effect of WEATHER_PARTICLE_EFFECTS) {
      const field = new WeatherParticleField(effect, createRandom());
      for (let i = 0; i < 120; i++) field.update(16, params);
      expect(field.particleCount, effect).toBeGreaterThan(0);
      for (const sprite of field.children.slice(1) as any[]) {
        expect(sprite.x, effect).toBeGreaterThan(-120);
        expect(sprite.x, effect).toBeLessThan(params.width + 120);
        expect(sprite.y, effect).toBeGreaterThan(-120);
        expect(sprite.y, effect).toBeLessThan(params.height + 120);
      }
    }
  });

  test("maxDrops caps the particle count and density scales it", () => {
    const field = new WeatherParticleField("leaves", createRandom());
    field.update(16, { ...params, density: 1000, maxDrops: 25 });
    expect(field.particleCount).toBe(25);
    field.update(16, { ...params, density: 20, maxDrops: 25 });
    expect(field.particleCount).toBeLessThan(25);
  });

  test("embers rise and leaves fall", () => {
    const averageY = (field: WeatherParticleField) => {
      const sprites = field.children.slice(1);
      return sprites.reduce((sum, sprite) => sum + sprite.y, 0) / sprites.length;
    };
    const embers = new WeatherParticleField("embers", createRandom(4));
    embers.update(16, params);
    const embersStart = averageY(embers);
    embers.update(16, params);
    expect(averageY(embers)).toBeLessThan(embersStart);

    const leaves = new WeatherParticleField("leaves", createRandom(4));
    leaves.update(16, params);
    const leavesStart = averageY(leaves);
    leaves.update(16, params);
    expect(averageY(leaves)).toBeGreaterThan(leavesStart);
  });

  test("particles stay anchored to the world when the camera moves", () => {
    const field = new WeatherParticleField("fireflies", createRandom(2));
    field.update(0, { ...params, cameraX: 0, cameraY: 0, speed: 0 });
    const sprite = field.children[1] as any;
    const before = sprite.x;
    field.update(0, { ...params, cameraX: 10, cameraY: 0, speed: 0 });
    expect(sprite.x).toBeLessThan(before);
  });

  test("custom colors override the palette", () => {
    const field = new WeatherParticleField("petals", createRandom());
    field.update(16, { ...params, colors: ["#123456"] });
    for (const sprite of field.children.slice(1) as any[]) {
      expect(sprite.tint).toBe(0x123456);
    }
  });

  test("presets are reachable by name", () => {
    expect(getWeatherPreset("volcanoEmbers")).toBe(WEATHER_PRESETS.volcano.volcanoEmbers);
    expect(getWeatherPreset("steadyRain")).toBe(WEATHER_PRESETS.rain.steadyRain);
    expect(getWeatherPreset("unknown")).toBeUndefined();
  });
});
