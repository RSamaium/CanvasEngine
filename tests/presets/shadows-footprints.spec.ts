import { describe, expect, test } from "vitest";
import { Sprite, Texture } from "pixi.js";
import { applyShadowTransform } from "../../packages/presets/src/SpriteShadows";
import { sunShadowAt } from "../../packages/presets/src/DayNight";
import { getFootprintTextures } from "../../packages/presets/src/footprintTextures";

const silhouette = {
  texture: Texture.WHITE,
  footX: 0.5,
  footY: 1,
  heightPx: 1,
  localPerPx: 20,
};

/** Where the top of the silhouette lands, relative to the feet. */
const tip = (sprite: Sprite) => {
  sprite.updateLocalTransform();
  const m = sprite.localTransform;
  // local (0, -heightPx) relative to the anchor at the feet
  return { x: m.c * -1, y: m.d * -1 };
};

describe("SpriteShadows projection", () => {
  test("the shadow points away from the light with the requested length", () => {
    const sprite = new Sprite(Texture.WHITE);
    // Light on the left: shadow goes right
    applyShadowTransform(sprite, silhouette, 100, 200, 1, 1, 0, 80, 1);
    expect(sprite.x).toBe(100);
    expect(sprite.y).toBe(200);
    const end = tip(sprite);
    expect(end.x).toBeCloseTo(80, 3);
    expect(end.y).toBeCloseTo(0, 3);
  });

  test("perspective foreshortens shadows falling toward the camera", () => {
    const sprite = new Sprite(Texture.WHITE);
    applyShadowTransform(sprite, silhouette, 0, 0, 1, 0, 1, 100, 0.5);
    const end = tip(sprite);
    expect(end.x).toBeCloseTo(0, 3);
    expect(end.y).toBeCloseTo(50, 3);
  });

  test("silhouette width stays readable when the light comes from the side", () => {
    const sprite = new Sprite(Texture.WHITE);
    applyShadowTransform(sprite, silhouette, 0, 0, 1, 1, 0, 60, 0.7);
    sprite.updateLocalTransform();
    const width = Math.hypot(sprite.localTransform.a, sprite.localTransform.b);
    expect(width).toBeGreaterThan(0.2);
  });
});

describe("sunShadowAt", () => {
  test("shadows sweep west to east through the day and stay short at noon", () => {
    const morning = sunShadowAt(8)!;
    const noon = sunShadowAt(12.25)!;
    const evening = sunShadowAt(17)!;
    // x / y point toward the sun, so the shadow goes the opposite way
    expect(-morning.x).toBeLessThan(0);
    expect(-evening.x).toBeGreaterThan(0);
    expect(-noon.y).toBeGreaterThan(0);
    expect(noon.z).toBeGreaterThan(morning.z);
    expect(noon.intensity).toBeGreaterThan(0.9);
  });

  test("north option points noon shadows up, night uses faint moonlight", () => {
    expect(-sunShadowAt(12.25, { noonShadow: "north" })!.y).toBeLessThan(0);
    expect(sunShadowAt(1, { moonlight: 0.2 }).intensity).toBeLessThanOrEqual(0.2);
    expect(sunShadowAt(1, { moonlight: 0 }).intensity).toBe(0);
  });
});

describe("Footprint textures", () => {
  test("every print shape provides sharp, soft and rim textures", () => {
    for (const shape of ["boot", "shoe", "bare", "paw", "hoof"] as const) {
      const textures = getFootprintTextures(shape);
      expect(textures.sharp.width, shape).toBeGreaterThan(1);
      expect(textures.soft.width, shape).toBe(textures.sharp.width);
      expect(textures.rim.height, shape).toBe(textures.sharp.height);
      // cached
      expect(getFootprintTextures(shape)).toBe(textures);
    }
  });
});
