import { describe, expect, test, vi } from "vitest";
import { Container } from "pixi.js";
import {
  FX_PRESETS,
  FxRuntime,
  customizeFx,
  expandFxPreset,
  FX_DEFAULT_TARGET,
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

  describe("target-relative paths", () => {
    const ball: FxPreset = {
      emitters: [
        {
          name: "ball",
          pathSpace: "target",
          path: [
            { t: 0, x: 0, y: 0 },
            { t: 400, x: 0.5, y: -0.2 },
            { t: 700, x: 1, y: 0 },
          ],
          rate: 10,
        },
        { at: "target", trigger: undefined, burst: 1, x: 0, y: -10 },
        { trigger: { emitter: "ball" }, burst: 1 },
      ],
    };

    test("maps the keys from the caster to the target at any distance and angle", () => {
      const along = expandFxPreset(ball, { x: 180, y: 0 }).emitters[0];
      expect(along.pathSpace).toBeUndefined();
      expect(along.path!.map((k) => [k.t, k.x, k.y])).toEqual([
        [0, 0, 0],
        [400, 90, -36],
        [700, 180, 0],
      ]);

      // Target straight below: the line is rotated, the fractions stay the same
      const down = expandFxPreset(ball, { x: 0, y: 100 }).emitters[0];
      expect(down.path![1].x).toBeCloseTo(20)
      expect(down.path![1].y).toBeCloseTo(50)
      expect(down.path![2].x).toBeCloseTo(0)
      expect(down.path![2].y).toBeCloseTo(100)
    });

    test("keeps the timing and the keys other fields", () => {
      const path = expandFxPreset(
        { emitters: [{ pathSpace: "target", path: [{ t: 100, x: 0, y: 0 }, { t: 500, x: 1, y: 0, ease: "outQuad" }] }] },
        { x: 50, y: 50 }
      ).emitters[0];
      expect(path.delay).toBe(100);
      expect(path.duration).toBe(400);
      expect(path.path![1].ease).toBe("outQuad");
    });

    test("the impact triggered at pathEnd lands on the target", () => {
      const [, , impact] = expandFxPreset(ball, { x: -120, y: 80 }).emitters;
      expect(impact.delay).toBe(700);
      expect(impact.x).toBeCloseTo(-120);
      expect(impact.y).toBeCloseTo(80);
    });

    test("at: target places an emitter on the target with an offset", () => {
      const placed = expandFxPreset(ball, { x: 180, y: -40 }).emitters[1];
      expect(placed.at).toBeUndefined();
      expect(placed.x).toBe(180);
      expect(placed.y).toBe(-50);
    });

    test("falls back to a reference target 200 px to the right", () => {
      expect(FX_DEFAULT_TARGET).toEqual({ x: 200, y: 0 });
      const [shot, , impact] = expandFxPreset(ball).emitters;
      expect(shot.path![2]).toMatchObject({ x: 200, y: 0 });
      expect(impact.x).toBe(200);
    });

    test("a pixel path is left untouched", () => {
      const preset: FxPreset = { emitters: [{ path: [{ t: 0, x: 0, y: 0 }, { t: 400, x: 300, y: 0 }] , delay: 0 }] };
      expect(expandFxPreset(preset, { x: 10, y: 10 })).toBe(preset);
    });

    test("recipes follow the target: projectile path and impact placed with at", () => {
      const preset: FxPreset = {
        emitters: [
          { use: "projectile", name: "ball", colors: COLORS, pathSpace: "target", path: [{ t: 0, x: 0, y: 0 }, { t: 400, x: 1, y: 0 }] },
          { use: "impact", colors: COLORS, trigger: { emitter: "ball" } },
          { use: "mist", colors: COLORS, at: "target", t: 200, y: 20 },
        ],
      };
      const emitters = expandFxPreset(preset, { x: 0, y: 150 }).emitters;
      const shots = emitters.filter((e) => e.path);
      expect(shots.length).toBeGreaterThan(0);
      expect(shots.every((e) => e.path![1].x === 0 && e.path![1].y === 150 && !e.pathSpace)).toBe(true);
      const impacts = emitters.filter((e) => e.burst && e.delay === 400);
      expect(impacts.length).toBeGreaterThan(0);
      expect(impacts.every((e) => e.x === 0 && e.y === 150)).toBe(true);
      const mist = emitters.filter((e) => !e.path && e.delay === 200);
      expect(mist.length).toBeGreaterThan(0);
      expect(mist.every((e) => e.x === 0 && e.y === 170)).toBe(true);
    });

    test("instance offsets are in px, applied after the mapping", () => {
      const preset: FxPreset = {
        emitters: [
          {
            name: "meteor",
            instances: [{ t: 0 }, { t: 200, y: 30 }],
            pathSpace: "target",
            path: [{ t: 0, x: 0, y: 0 }, { t: 500, x: 1, y: 0 }],
            rate: 10,
          },
          { trigger: { emitter: "meteor" }, burst: 1 },
        ],
      };
      const emitters = expandFxPreset(preset, { x: 100, y: 0 }).emitters;
      expect(emitters[1].path![1]).toMatchObject({ t: 700, x: 100, y: 30 });
      const impacts = emitters.filter((e) => e.burst);
      expect(impacts.map((e) => [e.delay, e.x, e.y])).toEqual([
        [500, 100, 0],
        [700, 100, 30],
      ]);
    });

    test("customizeFx keeps the target-relative paths until the target is known", () => {
      const customized = customizeFx(
        { emitters: [{ pathSpace: "target", path: [{ t: 0, x: 0, y: 0 }, { t: 300, x: 1, y: 0 }], particle: { color: "#ff7a1a" } }] },
        { color: "#4aa8ff" },
        { x: 0, y: 90 }
      );
      expect(customized.emitters[0].path![1]).toMatchObject({ x: 0, y: 90 });
    });

    test("the runtime spawns particles along the line to the target", () => {
      const preset: FxPreset = {
        emitters: [
          {
            pathSpace: "target",
            path: [{ t: 0, x: 0, y: 0 }, { t: 1000, x: 1, y: 0 }],
            rate: 200,
            particle: { shape: "softCircle", lifetime: 100 },
          },
        ],
      };
      const spawnFor = (target?: { x: number; y: number }) => {
        const points: { x: number; y: number }[] = [];
        const runtime = new FxRuntime({ seed: 1 });
        runtime.spawn(new Container(), preset, {
          target,
          onParticleSpawn: (p) => points.push({ x: p.sprite.x, y: p.sprite.y }),
        });
        for (let i = 0; i < 60; i++) runtime.update(16);
        return points;
      };

      const far = spawnFor({ x: 0, y: 400 });
      expect(far.length).toBeGreaterThan(0);
      expect(far.every((p) => Math.abs(p.x) < 1)).toBe(true);
      expect(Math.max(...far.map((p) => p.y))).toBeGreaterThan(300);

      const preview = spawnFor();
      expect(preview.every((p) => Math.abs(p.y) < 1)).toBe(true);
      expect(Math.max(...preview.map((p) => p.x))).toBeGreaterThan(100);
    });

    test("backward particles follow the mapped heading", () => {
      const preset: FxPreset = {
        emitters: [
          {
            pathSpace: "target",
            path: [{ t: 0, x: 0, y: 0 }, { t: 1000, x: 1, y: 0 }],
            rate: 200,
            direction: "backward",
            speed: 100,
            particle: { shape: "softCircle", lifetime: 500 },
          },
        ],
      };
      const vy: number[] = [];
      const runtime = new FxRuntime({ seed: 1 });
      runtime.spawn(new Container(), preset, { target: { x: 0, y: 300 }, onParticleSpawn: (p) => vy.push(p.vy) });
      runtime.update(200);
      runtime.update(200);
      expect(vy.length).toBeGreaterThan(0);
      expect(vy.every((v) => v < 0)).toBe(true);
    });
  });
});
