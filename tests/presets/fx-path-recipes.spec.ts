import { describe, expect, test, vi } from "vitest";
import { Container } from "pixi.js";
import {
  FX_PRESETS,
  FxRuntime,
  customizeFx,
  expandFxPreset,
  type FxPreset,
} from "../../packages/presets/src/fx";

const COLORS = ["#ffffff", "#ff7a1a", "#b3200e"];

describe("Fx path, trigger, instances and recipes", () => {
  test("returns a plain preset untouched", () => {
    expect(expandFxPreset(FX_PRESETS.hitSpark)).toBe(FX_PRESETS.hitSpark);
  });

  test("an emitter on a path takes its delay and duration from the path", () => {
    const preset: FxPreset = {
      emitters: [
        { name: "shot", path: [{ t: 400, x: 0, y: 0 }, { t: 1000, x: 100, y: 0 }], rate: 10 },
      ],
    };
    const [emitter] = expandFxPreset(preset).emitters;
    expect(emitter.delay).toBe(400);
    expect(emitter.duration).toBe(600);
  });

  test("a trigger starts an emitter where and when the source path ends", () => {
    const preset: FxPreset = {
      emitters: [
        { name: "shot", path: [{ t: 0, x: 0, y: 0 }, { t: 700, x: 200, y: 50 }], rate: 10 },
        { trigger: { emitter: "shot", delay: 50, offsetY: -5 }, burst: 1 },
      ],
    };
    const [, impact] = expandFxPreset(preset).emitters;
    expect(impact.delay).toBe(750);
    expect(impact.x).toBe(200);
    expect(impact.y).toBe(45);
    expect(impact.trigger).toBeUndefined();
  });

  test("a trigger on an instanced emitter fires once per clone", () => {
    const preset: FxPreset = {
      emitters: [
        {
          instances: [{ t: 0 }, { t: 200, y: 30 }, { t: 400, y: -30 }],
          name: "meteor",
          path: [{ t: 0, x: 0, y: -100 }, { t: 500, x: 100, y: 0 }],
          rate: 10,
        },
        { trigger: { emitter: "meteor" }, burst: 1 },
      ],
    };
    const impacts = expandFxPreset(preset).emitters.filter((emitter) => emitter.burst);
    expect(impacts.map((emitter) => emitter.delay)).toEqual([500, 700, 900]);
    expect(impacts.map((emitter) => emitter.y)).toEqual([0, 30, -30]);
  });

  test("groups clone their recipes with a time and position offset", () => {
    const preset: FxPreset = {
      emitters: [
        {
          instances: [{ t: 0 }, { t: 300, x: 40 }],
          emitters: [
            { use: "projectile", name: "ball", colors: COLORS, path: [{ t: 0, x: 0, y: 0 }, { t: 400, x: 100, y: 0 }] },
            { use: "impact", colors: COLORS, trigger: { emitter: "ball" } },
          ],
        },
      ],
    };
    const emitters = expandFxPreset(preset).emitters;
    expect(emitters.length).toBe(2 * (3 + 4));
    const impacts = emitters.filter((emitter) => emitter.burst === 1 && emitter.particle?.shape === "softCircle");
    expect(impacts.map((emitter) => [emitter.delay, emitter.x])).toEqual([[400, 100], [700, 140]]);
  });

  test("customizeFx recolors recipes", () => {
    const preset: FxPreset = { emitters: [{ use: "impact", colors: COLORS, x: 10, y: 10 }] };
    const customized = customizeFx(preset, { color: "#4aa8ff" });
    expect(customized.emitters.length).toBeGreaterThan(1);
    expect(customized.emitters.every((emitter: any) => emitter.particle)).toBe(true);
  });

  test("the projectile flies along its path and the impact lands on the target", () => {
    const preset: FxPreset = {
      emitters: [
        { use: "projectile", name: "ball", colors: COLORS, path: [{ t: 0, x: 0, y: 0 }, { t: 400, x: 300, y: 0 }] },
        { use: "impact", colors: COLORS, trigger: { emitter: "ball" } },
      ],
    };
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1, maxParticles: 2000 });
    const spawned: { x: number; at: number }[] = [];
    let now = 0;
    runtime.spawn(container, preset, {
      onParticleSpawn: (particle) => spawned.push({ x: particle.sprite.x, at: now }),
    });
    for (now = 16; now <= 600; now += 16) runtime.update(16);

    const early = spawned.filter((p) => p.at <= 100);
    const late = spawned.filter((p) => p.at > 300 && p.at <= 400);
    expect(early.length).toBeGreaterThan(0);
    expect(Math.max(...early.map((p) => p.x))).toBeLessThan(120);
    expect(Math.max(...late.map((p) => p.x))).toBeGreaterThan(200);

    const landing = spawned.filter((p) => p.at >= 400);
    expect(landing.length).toBeGreaterThan(40);
    expect(landing.filter((p) => Math.abs(p.x - 300) < 30).length).toBeGreaterThan(40);
  });

  test("backward particles trail behind the shot", () => {
    const preset: FxPreset = {
      emitters: [
        {
          path: [{ t: 0, x: 0, y: 0 }, { t: 1000, x: 500, y: 0 }],
          rate: 200,
          direction: "backward",
          speed: 100,
          particle: { shape: "softCircle", lifetime: 500 },
        },
      ],
    };
    const container = new Container();
    const runtime = new FxRuntime({ seed: 1 });
    const velocities: number[] = [];
    runtime.spawn(container, preset, { onParticleSpawn: (particle) => velocities.push(particle.vx) });
    runtime.update(200);
    runtime.update(200);
    expect(velocities.length).toBeGreaterThan(0);
    expect(velocities.every((vx) => vx < 0)).toBe(true);
  });
});
