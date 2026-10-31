import { FX_RECIPES } from "./recipes";
import type {
  FxCloneOffset,
  FxEmitterConfig,
  FxEmitterGroup,
  FxEmitterItem,
  FxExpandedPreset,
  FxPreset,
  FxRecipeUse,
} from "./types";
import { pathPoint } from "./utils";

const isRecipe = (item: FxEmitterItem): item is FxRecipeUse => "use" in item;
const isGroup = (item: FxEmitterItem): item is FxEmitterGroup =>
  "emitters" in item && Array.isArray((item as FxEmitterGroup).emitters);

/** `true` when the preset only holds plain emitters: nothing to expand. */
function isPlain(preset: FxPreset) {
  return preset.emitters.every(
    (item) => !isRecipe(item) && !isGroup(item) && !(item as FxEmitterConfig).instances && !(item as FxEmitterConfig).trigger
  ) && preset.emitters.every((item) => !(item as FxEmitterConfig).path || (item as FxEmitterConfig).delay !== undefined);
}

function expandRecipe(item: FxRecipeUse): FxEmitterConfig[] {
  const recipe = FX_RECIPES[item.use];
  if (!recipe) return [];
  const colors = item.colors?.length ? item.colors : ["#ffffff"];
  const emitters = recipe(item, item.scale ?? 1, item.density ?? 1, [
    colors[0],
    colors[1] ?? colors[0],
    colors[2] ?? colors[1] ?? colors[0],
  ]).filter((emitter): emitter is FxEmitterConfig => Boolean(emitter));
  return emitters.map((emitter) => ({
    ...emitter,
    ...(item.trigger ? { trigger: item.trigger } : {}),
    ...(item.instances ? { instances: item.instances } : {}),
  }));
}

/** Clones an emitter with a time/position offset. */
function shift(emitter: FxEmitterConfig, offset: FxCloneOffset, suffix: string): FxEmitterConfig {
  const dt = offset.t ?? 0;
  const dx = offset.x ?? 0;
  const dy = offset.y ?? 0;
  const clone: FxEmitterConfig = { ...emitter, instances: undefined };
  if (dt && emitter.delay !== undefined) clone.delay = emitter.delay + dt;
  else if (dt && !emitter.path) clone.delay = dt;
  if (emitter.path) {
    clone.path = emitter.path.map((key) => ({ ...key, t: key.t + dt, x: key.x + dx, y: key.y + dy }));
  } else {
    clone.x = (emitter.x ?? 0) + dx;
    clone.y = (emitter.y ?? 0) + dy;
  }
  if (emitter.name) clone.name = emitter.name + suffix;
  if (emitter.trigger) {
    clone.trigger = { ...emitter.trigger, emitter: emitter.trigger.emitter + suffix, fallback: emitter.trigger.emitter };
  }
  return clone;
}

function flatten(items: FxEmitterItem[]): FxEmitterConfig[] {
  const out: FxEmitterConfig[] = [];
  items.forEach((item, index) => {
    if (isGroup(item)) {
      const inner = item.emitters.flatMap((child) => (isRecipe(child) ? expandRecipe(child) : [child]));
      item.instances.forEach((offset, k) => {
        for (const emitter of inner) out.push(shift(emitter, offset, `#${index}.${k}`));
      });
      return;
    }
    const emitters = isRecipe(item) ? expandRecipe(item) : [item];
    for (const emitter of emitters) {
      if (emitter.instances) emitter.instances.forEach((offset, k) => out.push(shift(emitter, offset, `#${index}.${k}`)));
      else out.push({ ...emitter });
    }
  });
  return out;
}

/** Start time (ms) and duration of an emitter, from its path when it has one. */
function timing(emitter: FxEmitterConfig) {
  const path = emitter.path;
  const delay = emitter.delay ?? path?.[0].t ?? 0;
  const duration = emitter.duration ?? (path ? path[path.length - 1].t - path[0].t : undefined);
  return { delay, duration };
}

/**
 * Resolves recipes, groups, instances and triggers into plain emitters.
 * Pure and idempotent: a preset that is already plain is returned as is.
 */
export function expandFxPreset(preset: FxPreset): FxExpandedPreset {
  if (isPlain(preset)) return preset as FxExpandedPreset;

  const out = flatten(preset.emitters);

  // A trigger aimed at an emitter cloned by instances fires once per clone (one impact per meteor).
  const named = out.filter((emitter): emitter is FxEmitterConfig & { name: string } => Boolean(emitter.name));
  const byName = new Map(named.map((emitter) => [emitter.name, emitter]));
  for (let i = out.length - 1; i >= 0; i--) {
    const trigger = out[i].trigger;
    if (!trigger || byName.has(trigger.emitter) || (trigger.fallback && byName.has(trigger.fallback))) continue;
    const clones = named.filter((emitter) => emitter.name.startsWith(`${trigger.emitter}#`));
    if (clones.length) {
      out.splice(i, 1, ...clones.map((clone) => ({ ...out[i], trigger: { ...trigger, emitter: clone.name } })));
    }
  }

  for (const emitter of out) {
    const trigger = emitter.trigger;
    if (!trigger) continue;
    const source = byName.get(trigger.emitter) ?? (trigger.fallback ? byName.get(trigger.fallback) : undefined);
    if (!source) {
      delete emitter.trigger;
      continue;
    }
    const { delay: sourceDelay, duration: sourceDuration } = timing(source);
    const at = trigger.at ?? "pathEnd";
    const time =
      at === "pathStart" ? sourceDelay : at === "pathEnd" ? sourceDelay + (sourceDuration ?? 0) : sourceDelay + at;
    const point = source.path
      ? pathPoint(source.path, time)
      : { x: source.x ?? 0, y: source.y ?? 0 };
    emitter.delay = time + (trigger.delay ?? 0);
    emitter.x = point.x + (trigger.offsetX ?? 0);
    emitter.y = point.y + (trigger.offsetY ?? 0);
    delete emitter.trigger;
  }

  for (const emitter of out) {
    if (!emitter.path) continue;
    const { delay, duration } = timing(emitter);
    emitter.delay = delay;
    if (emitter.duration === undefined && duration !== undefined) emitter.duration = duration;
  }

  return { ...preset, emitters: out };
}
