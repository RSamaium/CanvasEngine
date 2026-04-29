import { Container, h, mount, on, tick, useProps } from "canvasengine";
import type { Container as PixiContainer } from "pixi.js";
import { FX_PRESETS } from "./presets";
import { FxRuntime } from "./runtime";
import type { FxPreset } from "./types";

const valueOf = (value) => (typeof value === "function" ? value() : value);

function resolvePreset(name, preset): FxPreset {
  const directPreset = valueOf(preset);
  if (directPreset) return directPreset;
  const presetName = valueOf(name);
  const found = FX_PRESETS[presetName];
  if (!found) {
    throw new Error(`Unknown Fx preset: ${presetName}`);
  }
  return found;
}

export function Fx(options) {
  const {
    name,
    preset,
    trigger,
    autostart,
    loop,
    enabled,
    x,
    y,
    rotation,
    scale,
    alpha,
    seed,
    maxParticles,
    timeScale,
    preload,
    missingTexture,
    onStart,
    onComplete,
    onParticleSpawn,
    ...containerProps
  } = useProps(options, {
    name: "hitSpark",
    autostart: false,
    loop: false,
    enabled: true,
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    alpha: 1,
    timeScale: 1,
    preload: true,
    missingTexture: "shape",
  });

  let container: PixiContainer | undefined;
  let localRuntime = new FxRuntime({
    seed: valueOf(seed),
    maxParticles: valueOf(maxParticles),
  });

  const spawn = async (config = {}) => {
    if (!container || !valueOf(enabled)) return;
    const selectedPreset = resolvePreset(name, preset);
    if (valueOf(preload)) {
      await localRuntime.preload(selectedPreset);
    }
    const instance = localRuntime.spawn(container, selectedPreset, {
      loop: valueOf(loop),
      seed: valueOf(seed),
      maxParticles: valueOf(maxParticles),
      missingTexture: valueOf(missingTexture),
      onStart,
      onComplete,
      onParticleSpawn,
      ...config,
    });
    return instance;
  };

  mount((element) => {
    container = element.componentInstance as unknown as PixiContainer;
    if (valueOf(autostart) || valueOf(loop)) {
      spawn();
    }
    return () => {
      localRuntime.clear();
    };
  });

  if (trigger?.listen) {
    on(trigger, async (config) => {
      await spawn(config);
    });
  }

  tick(({ deltaTime }) => {
    localRuntime.update((deltaTime ?? 16.67) * valueOf(timeScale));
  });

  return h(Container, {
    ...containerProps,
    x,
    y,
    rotation,
    scale,
    alpha,
  });
}
