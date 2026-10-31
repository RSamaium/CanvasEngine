import type { FxColor, FxEmitterConfig, FxRecipeName, FxRecipeUse } from "./types";

type Colors = [FxColor, FxColor, FxColor];
type Recipe = (
  options: FxRecipeUse,
  scale: number,
  density: number,
  colors: Colors
) => (FxEmitterConfig | false)[];

// Base size (px) of the procedural textures, to turn a size in px into a particle scale.
const SOFT = 48;
const SPARK = 64;
const RING = 64;
const FLAME = 48;
const SIGIL = 128;

const px = (values: number[], base: number, factor: number) => values.map((value) => (value * factor) / base);
const pair = (a: number, b: number, factor: number): [number, number] => [a * factor, b * factor];

/** Common FX building blocks, tuned once so that presets stay short. */
export const FX_RECIPES: Record<FxRecipeName, Recipe> = {
  // Energy gathering: converging motes and a growing core glow.
  charge: (o, s, n, [core, main]) => {
    const d = o.duration ?? 500;
    const pos = { x: o.x, y: o.y, delay: o.t ?? 0 };
    return [
      {
        ...pos,
        duration: d * 0.9,
        rate: 90 * n,
        radius: pair(40, 90, s),
        direction: "inward",
        speed: pair(80, 160, s),
        drag: 1,
        particle: {
          shape: "softCircle",
          lifetime: [300, 500],
          scale: px([4, 9, 3], SOFT, s),
          alpha: [0, 1, 0.3],
          color: [main, core],
          blendMode: "add",
        },
      },
      {
        ...pos,
        burst: 1,
        particle: {
          shape: "softCircle",
          lifetime: d + 100,
          scale: px([10, 90, 60], SOFT, s),
          alpha: [0, 0.9, 0],
          color: [main, core],
          blendMode: "add",
        },
      },
    ];
  },

  // Moving shot along `path`: trail streaming backward, head following the shot, sparks.
  projectile: (o, s, n, [core, main, deep]) => {
    if (!o.path?.length) return [];
    return [
      {
        name: o.name,
        path: o.path,
        rate: 160 * n,
        radius: 6 * s,
        direction: "backward",
        angle: [-12, 12],
        speed: pair(20, 70, s),
        particle: {
          shape: o.trail ?? "flame",
          align: "velocity",
          lifetime: [180, 350],
          scale: px([26, 16, 4], FLAME, s),
          alpha: [0.9, 0.5, 0],
          color: [core, main, deep],
          blendMode: "add",
        },
      },
      {
        path: o.path,
        rate: 60,
        particle: {
          shape: o.shape ?? "softCircle",
          lifetime: 120,
          scale: px([44, 34], SOFT, s),
          alpha: [1, 0],
          color: [core, main],
          blendMode: "add",
        },
      },
      {
        path: o.path,
        rate: 40 * n,
        direction: "backward",
        angle: [-40, 40],
        speed: pair(60, 160, s),
        drag: 2,
        particle: {
          shape: "spark",
          align: "velocity",
          lifetime: [200, 400],
          scale: px([10, 3], SPARK, s),
          alpha: [1, 0],
          color: [core, main],
          blendMode: "add",
        },
      },
    ];
  },

  // Hit: flash, ground ring, debris thrown up and falling, fast sparks.
  impact: (o, s, n, [core, main, deep]) => {
    const pos = { x: o.x, y: o.y, delay: o.t ?? 0 };
    const ground = o.ground !== false;
    return [
      {
        ...pos,
        burst: 1,
        particle: {
          shape: "softCircle",
          lifetime: 180,
          scale: px([60, 220], SOFT, s),
          alpha: [1, 0],
          color: [core, main],
          blendMode: "add",
          ease: "outCubic",
        },
      },
      {
        ...pos,
        burst: 1,
        particle: {
          shape: "ring",
          lifetime: 450,
          scale: px([30, 300], RING, s),
          perspective: ground ? 0.35 : undefined,
          alpha: [0.9, 0],
          color: [core, main],
          blendMode: "add",
          ease: "outCubic",
        },
      },
      {
        ...pos,
        burst: Math.round(24 * n),
        angle: ground ? [-165, -15] : [0, 360],
        speed: pair(150, 420, s),
        drag: 1.5,
        gravity: ground ? 700 * s : 0,
        particle: {
          shape: "square",
          lifetime: [400, 900],
          scale: px([10, 4], SOFT, s),
          alpha: [1, 0.8, 0],
          color: [core, main, deep],
          rotationSpeed: [-500, 500],
        },
      },
      {
        ...pos,
        burst: Math.round(20 * n),
        angle: ground ? [-170, -10] : [0, 360],
        speed: pair(250, 600, s),
        drag: 3,
        particle: {
          shape: "spark",
          align: "velocity",
          lifetime: [150, 350],
          scale: px([16, 4], SPARK, s),
          alpha: [1, 0],
          color: [core, main],
          blendMode: "add",
        },
      },
    ];
  },

  // Smoke or mist cloud that billows out, rises and fades.
  mist: (o, s, n, [, main, deep]) => {
    const d = o.duration ?? 1200;
    return [
      {
        x: o.x,
        y: o.y,
        delay: o.t ?? 0,
        burst: Math.round(10 * n),
        radius: pair(0, 40, s),
        direction: "outward",
        speed: pair(20, 70, s),
        drag: 1.2,
        gravity: -(o.rise ?? 30) * s,
        particle: {
          shape: o.shape ?? "softCircle",
          lifetime: [d * 0.75, d * 1.15],
          scale: px([40, 140], SOFT, s),
          alpha: [0, o.opacity ?? 0.6, 0],
          color: [main, deep],
          rotationSpeed: [-30, 30],
        },
      },
    ];
  },

  // Magic circle on the ground: spinning sigil, orbiting marks, rising motes.
  circle: (o, s, n, [core, main]) => {
    const d = o.duration ?? 1500;
    const r = (o.radius ?? 90) * s;
    const pos = { x: o.x, y: o.y, delay: o.t ?? 0 };
    return [
      {
        ...pos,
        burst: 1,
        particle: {
          shape: "sigil",
          lifetime: d,
          scale: [0, (r * 2.3) / SIGIL, (r * 2.3) / SIGIL, 0],
          alpha: [0, 1, 1, 0],
          rotationSpeed: 40,
          perspective: 0.35,
          color: main,
          blendMode: "add",
        },
      },
      {
        ...pos,
        burst: o.marks ?? 8,
        radius: [r * 1.02, r * 1.06],
        innerRadius: r,
        ellipse: 0.35,
        orbit: 70,
        particle: {
          shape: "diamond",
          lifetime: d,
          scale: [0, 0.6 * s, 0.6 * s, 0],
          alpha: [0, 1, 1, 0],
          color: [core, main],
          blendMode: "add",
        },
      },
      {
        ...pos,
        duration: d,
        rate: 30 * n,
        radius: r,
        ellipse: 0.35,
        angle: [-100, -80],
        speed: pair(30, 80, s),
        particle: {
          shape: "softCircle",
          lifetime: [500, 900],
          scale: px([6, 2], SOFT, s),
          alpha: [0, 1, 0],
          color: [core, main],
          blendMode: "add",
        },
      },
    ];
  },
};
