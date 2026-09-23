import { Container, effect, h, mount, on, tick, useProps } from "canvasengine";
import type { Container as PixiContainer } from "pixi.js";
import { customizeFx, pickFxCustomization } from "./customize";
import { getFxPreset } from "./presets";
import { FxRuntime } from "./runtime";
import type { FxPreset } from "./types";

const valueOf = (value) => (typeof value === "function" ? value() : value);

function resolvePreset(name, preset): FxPreset {
  const directPreset = valueOf(preset);
  if (directPreset) return directPreset;
  const presetName = valueOf(name);
  const found = getFxPreset(presetName);
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
    color,
    hueShift,
    intensity,
    speedScale,
    sizeScale,
    lifetimeScale,
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

  /**
   * `config` comes from `trigger.start(config)` and can override the preset
   * (`name`, `preset`), its customization (`color`, `intensity`...) and the
   * local spawn position (`x`, `y`).
   */
  const spawn = async (config: Record<string, any> = {}) => {
    if (!container || !valueOf(enabled)) return;
    const {
      name: configName,
      preset: configPreset,
      color: _color,
      hueShift: _hueShift,
      intensity: _intensity,
      speedScale: _speedScale,
      sizeScale: _sizeScale,
      lifetimeScale: _lifetimeScale,
      ...runtimeConfig
    } = config ?? {};
    const basePreset = configPreset || configName
      ? resolvePreset(configName, configPreset)
      : resolvePreset(name, preset);
    const selectedPreset = customizeFx(basePreset, {
      ...pickFxCustomization({ color, hueShift, intensity, speedScale, sizeScale, lifetimeScale }),
      ...pickFxCustomization(config ?? {}),
    });
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
      ...runtimeConfig,
    });
    return instance;
  };

  mount((element) => {
    container = element.componentInstance as unknown as PixiContainer;
    if (valueOf(autostart) || valueOf(loop)) {
      spawn();
    }
    // A looping effect only reads its preset once: restart it when the preset or its customization changes.
    let initialized = false;
    const restartLoop = effect(() => {
      [name, preset, color, hueShift, intensity, speedScale, sizeScale, lifetimeScale].forEach(valueOf);
      if (!initialized) {
        initialized = true;
        return;
      }
      if (valueOf(loop)) {
        localRuntime.clear();
        spawn();
      }
    });
    return () => {
      restartLoop?.subscription?.unsubscribe?.();
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
