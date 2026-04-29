import type { FxPreset } from "./types";

export const FX_PRESETS = {
  hitSpark: {
    duration: 180,
    emitters: [
      {
        burst: 18,
        angle: [0, 360],
        speed: [120, 340],
        particle: {
          shape: "spark",
          lifetime: [160, 340],
          color: ["#fff4a8", "#ff7a2f"],
          alpha: [1, 0],
          scale: [0.18, 0],
          rotationSpeed: [-480, 480],
          blendMode: "add",
          ease: "outCubic",
        },
      },
    ],
  },
  smokePuff: {
    duration: 260,
    emitters: [
      {
        burst: 16,
        angle: [-130, -50],
        speed: [12, 58],
        spreadX: 10,
        spreadY: 6,
        gravity: -10,
        particle: {
          shape: "softCircle",
          lifetime: [520, 940],
          color: ["#8f8f8f", "#4f4f4f"],
          alpha: [0.38, 0],
          scale: [0.45, 1.85],
          rotationSpeed: [-40, 40],
          ease: "outQuad",
        },
      },
    ],
  },
  dustStep: {
    duration: 160,
    emitters: [
      {
        burst: 10,
        angle: [-170, -10],
        speed: [18, 86],
        spreadX: 8,
        spreadY: 3,
        particle: {
          shape: "softCircle",
          lifetime: [260, 520],
          color: "#b99a6a",
          alpha: [0.26, 0],
          scale: [0.22, 0.9],
          ease: "outQuad",
        },
      },
    ],
  },
  magicBurst: {
    duration: 360,
    emitters: [
      {
        burst: 32,
        angle: [0, 360],
        speed: [70, 220],
        particle: {
          shape: "star",
          lifetime: [420, 840],
          color: ["#77e5ff", "#b970ff"],
          alpha: [0.95, 0],
          scale: [0.18, 0.75],
          rotationSpeed: [-220, 220],
          blendMode: "add",
          ease: "outCubic",
        },
      },
    ],
  },
  campfire: {
    duration: 1000,
    emitters: [
      {
        loop: true,
        rate: 38,
        angle: [-110, -70],
        speed: [16, 54],
        spreadX: 8,
        spreadY: 3,
        particle: {
          shape: "softCircle",
          lifetime: [360, 720],
          color: ["#ffd36d", "#ff4b1f"],
          alpha: [0.8, 0],
          scale: [0.25, 1.05],
          blendMode: "add",
          ease: "outQuad",
        },
      },
      {
        loop: true,
        rate: 12,
        angle: [-115, -65],
        speed: [10, 30],
        particle: {
          shape: "softCircle",
          lifetime: [620, 1100],
          color: "#555555",
          alpha: [0.18, 0],
          scale: [0.35, 1.4],
          ease: "outQuad",
        },
      },
    ],
  },
  pickup: {
    duration: 320,
    emitters: [
      {
        burst: 14,
        angle: [210, 330],
        speed: [70, 170],
        particle: {
          shape: "star",
          lifetime: [260, 620],
          color: ["#ffffff", "#ffe66d"],
          alpha: [1, 0],
          scale: [0.2, 0.65],
          blendMode: "add",
          ease: "outCubic",
        },
      },
    ],
  },
  explosionSmall: {
    duration: 280,
    emitters: [
      {
        burst: 28,
        angle: [0, 360],
        speed: [120, 300],
        particle: {
          shape: "softCircle",
          lifetime: [300, 720],
          color: ["#fff1a6", "#d34b24"],
          alpha: [1, 0],
          scale: [0.25, 1.15],
          blendMode: "add",
          ease: "outCubic",
        },
      },
    ],
  },
} satisfies Record<string, FxPreset>;

