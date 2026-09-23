import { describe, expect, test, vi } from "vitest";
import { Container, Texture } from "pixi.js";
import {
  AURA_FX_PRESETS,
  FX_PRESETS,
  FxRuntime,
  customizeFx,
  getFxPreset,
  registerFxPreset,
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

  test("all built-in presets can emit particles", () => {
    for (const [name, preset] of Object.entries(FX_PRESETS)) {
      const container = new Container();
      const runtime = new FxRuntime({ seed: 1 });

      runtime.spawn(container, preset);
      runtime.update(100);

      expect(container.children.length, name).toBeGreaterThan(0);
    }
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

  test("interpolates keyframe curves over the lifetime", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    runtime.spawn(container, {
      emitters: [
        {
          burst: 1,
          particle: { texture: Texture.WHITE, lifetime: 1000, alpha: [0, 1, 0], color: ["#ff0000", "#00ff00", "#0000ff"] },
        },
      ],
    });
    runtime.update(1);
    const sprite = container.children[0] as any;
    runtime.update(499);
    expect(sprite.alpha).toBeCloseTo(1, 1);
    expect(sprite.tint).toBe(0x00ff00);
    runtime.update(400);
    expect(sprite.alpha).toBeLessThan(0.3);
  });

  test("spawns on a ring and moves outward or inward", () => {
    for (const direction of ["outward", "inward"] as const) {
      const container = new Container();
      const runtime = new FxRuntime({ seed: 3 });
      runtime.spawn(container, {
        emitters: [
          {
            burst: 12,
            radius: 50,
            innerRadius: 50,
            direction,
            speed: 100,
            particle: { texture: Texture.WHITE, lifetime: 1000 },
          },
        ],
      });
      runtime.update(1);
      for (const child of container.children) {
        expect(Math.hypot(child.x, child.y)).toBeCloseTo(50, 0);
      }
      runtime.update(100);
      for (const child of container.children) {
        const distance = Math.hypot(child.x, child.y);
        if (direction === "outward") expect(distance).toBeGreaterThan(55);
        else expect(distance).toBeLessThan(45);
      }
    }
  });

  test("orbit keeps particles at the same distance from the center", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 2 });
    runtime.spawn(container, {
      emitters: [
        { burst: 1, radius: 30, innerRadius: 30, orbit: 180, particle: { texture: Texture.WHITE, lifetime: 2000 } },
      ],
    });
    runtime.update(1);
    const sprite = container.children[0];
    const start = { x: sprite.x, y: sprite.y };
    runtime.update(500);
    expect(Math.hypot(sprite.x, sprite.y)).toBeCloseTo(30, 1);
    // 180 deg/s during 0.5s = quarter turn
    expect(start.x * sprite.x + start.y * sprite.y).toBeCloseTo(0, 0);
  });

  test("repeats bursts with burstCount and burstInterval", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    const spawned = vi.fn();
    runtime.spawn(
      container,
      { emitters: [{ burst: 2, burstCount: 3, burstInterval: 100, particle: { texture: Texture.WHITE, lifetime: 1000 } }] },
      { onParticleSpawn: spawned }
    );
    runtime.update(1);
    expect(spawned).toHaveBeenCalledTimes(2);
    runtime.update(100);
    expect(spawned).toHaveBeenCalledTimes(4);
    runtime.update(300);
    expect(spawned).toHaveBeenCalledTimes(6);
  });

  test("world space particles stay behind when the Fx moves", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    runtime.spawn(container, {
      emitters: [{ burst: 1, space: "world", particle: { texture: Texture.WHITE, lifetime: 1000 } }],
    });
    runtime.update(1);
    container.x = 100;
    runtime.update(16);
    expect(container.children[0].x).toBeCloseTo(-100);
  });

  test("emitter maxParticles does not depend on other instances", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    runtime.spawn(container, { emitters: [{ burst: 30, particle: { texture: Texture.WHITE, lifetime: 1000 } }] });
    runtime.spawn(container, { emitters: [{ burst: 10, maxParticles: 5, particle: { texture: Texture.WHITE, lifetime: 1000 } }] });
    runtime.update(1);
    expect(container.children.length).toBe(35);
  });

  test("customizeFx recolors, scales and keeps white cores", () => {
    const custom = customizeFx(FX_PRESETS.fireball, { color: "#3aff5a", intensity: 2, sizeScale: 2 });
    const flash = custom.emitters[0].particle!;
    const flames = custom.emitters[1];
    expect((flash.color as any[])[0]).toBe("#ffffff");
    expect(flames.burst).toBe(FX_PRESETS.fireball.emitters[1].burst! * 2);
    const [, flameColor] = flames.particle!.color as number[];
    const g = (flameColor >> 8) & 255;
    const r = (flameColor >> 16) & 255;
    expect(g).toBeGreaterThan(r);
    expect(flames.particle!.scale).toEqual([0.9, 2.5]);
    // source preset untouched
    expect(FX_PRESETS.fireball.emitters[1].particle.color[1]).toBe("#ff7a1a");
  });

  test("registerFxPreset makes a preset available by name", () => {
    const preset: FxPreset = { emitters: [{ burst: 1, particle: { texture: Texture.WHITE } }] };
    registerFxPreset("myCustomSpell", preset);
    expect(getFxPreset("myCustomSpell")).toBe(preset);
    expect(getFxPreset("fireball")).toBe(FX_PRESETS.fireball);
  });

  test("aura presets keep emitting while looping", () => {
    for (const [name, preset] of Object.entries(AURA_FX_PRESETS)) {
      const container = new Container();
      const runtime = new FxRuntime({ seed: 1 });
      runtime.spawn(container, preset, { loop: true });
      for (let i = 0; i < 200; i++) runtime.update(16);
      expect(container.children.length, name).toBeGreaterThan(0);
      expect(runtime.activeInstances, name).toBe(1);
    }
  });

  test("scaleX and scaleY stretch particles over their lifetime", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    runtime.spawn(container, {
      emitters: [{ burst: 1, particle: { texture: Texture.WHITE, lifetime: 1000, scale: 2, scaleX: [1, 3], scaleY: 0.5 } }],
    });
    runtime.update(1);
    const sprite = container.children[0] as any;
    runtime.update(499);
    expect(sprite.scale.x).toBeCloseTo(4, 1);
    expect(sprite.scale.y).toBeCloseTo(1, 5);
  });

  test("perspective squashes after rotating", () => {
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    runtime.spawn(container, {
      emitters: [{ burst: 1, particle: { texture: Texture.WHITE, lifetime: 1000, scale: 1, rotation: 90, perspective: 0.5 } }],
    });
    runtime.update(1);
    runtime.update(16);
    const sprite = container.children[0] as any;
    sprite.updateLocalTransform();
    const matrix = sprite.localTransform;
    // a 90° turn in the ground plane: x axis maps to a squashed vertical, y axis to full horizontal
    expect(matrix.a).toBeCloseTo(0, 3);
    expect(matrix.b).toBeCloseTo(0.5, 3);
    expect(matrix.c).toBeCloseTo(-1, 3);
    expect(matrix.d).toBeCloseTo(0, 3);
  });

  test("attack and epic presets are registered", () => {
    for (const name of ["swordSlash", "crossSlash", "groundSlam", "limitBurst", "holyPillar", "summonSigil"]) {
      expect(getFxPreset(name), name).toBeDefined();
    }
  });
});
