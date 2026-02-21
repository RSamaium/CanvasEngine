import { Container, h, mount, useProps } from "canvasengine";
import {
  BlurFilter,
  Container as PixiContainer,
  Graphics,
  Sprite as PixiSprite,
  Texture,
} from "pixi.js";

type ReactiveValue<T> = T | (() => T);
type PointLike = { x: number; y: number };
type ColorInput = string | number;
type FootSide = "left" | "right";

type ResolvedSurfaceProfile = {
  lifetimeMs: number;
  startAlpha: number;
  endAlpha: number;
  tint: number;
  blendMode: any;
  scale: number;
  blurStart: number;
  blurEnd: number;
  erosionStart: number;
};

type ResolvedCaster = {
  footAnchor: PointLike;
  leftOffset: PointLike;
  rightOffset: PointLike;
  minStepDistance: number;
  minSpeed: number;
  stepIntervalMs: number;
  size: number;
  alpha: number;
  blur: number;
  surface: string;
  angleOffset: number;
  jitter: number;
};

type ManagedCasterState = {
  lastPoint: PointLike | null;
  lastUpdateMs: number;
  distanceSinceStep: number;
  lastStepMs: number;
  nextFoot: FootSide;
  heading: number;
};

type ManagedFootprint = {
  sprite: PixiSprite;
  blurFilter: BlurFilter;
  bornAt: number;
  lifetimeMs: number;
  startAlpha: number;
  endAlpha: number;
  baseScaleX: number;
  baseScaleY: number;
  blurStart: number;
  blurEnd: number;
  erosionStart: number;
};

export type FootprintSurfaceProfile = {
  lifetimeMs?: ReactiveValue<number>;
  startAlpha?: ReactiveValue<number>;
  endAlpha?: ReactiveValue<number>;
  tint?: ReactiveValue<ColorInput>;
  blendMode?: ReactiveValue<any>;
  scale?: ReactiveValue<number>;
  blurStart?: ReactiveValue<number>;
  blurEnd?: ReactiveValue<number>;
  erosionStart?: ReactiveValue<number>;
};

export type FootprintCasterOptions = {
  enabled?: ReactiveValue<boolean>;
  footAnchor?: ReactiveValue<PointLike>;
  leftOffset?: ReactiveValue<PointLike>;
  rightOffset?: ReactiveValue<PointLike>;
  minStepDistance?: ReactiveValue<number>;
  minSpeed?: ReactiveValue<number>;
  stepIntervalMs?: ReactiveValue<number>;
  size?: ReactiveValue<number>;
  alpha?: ReactiveValue<number>;
  blur?: ReactiveValue<number>;
  surface?: ReactiveValue<string>;
  angleOffset?: ReactiveValue<number>;
  jitter?: ReactiveValue<number>;
};

export type FootprintsProps = {
  profiles?: ReactiveValue<Record<string, FootprintSurfaceProfile>>;
  defaultSurface?: ReactiveValue<string>;
  maxFootprints?: ReactiveValue<number>;
  updateHz?: ReactiveValue<number>;
};

const FOOTPRINT_MANAGED_MARK = "__footprintManaged";
const DEFAULT_SURFACE = "default";
const DEFAULT_UPDATE_HZ = 30;
const DEFAULT_MAX_FOOTPRINTS = 260;

const DEFAULT_CASTER: ResolvedCaster = {
  footAnchor: { x: 0.5, y: 1 },
  leftOffset: { x: -10, y: 1 },
  rightOffset: { x: 10, y: 1 },
  minStepDistance: 18,
  minSpeed: 36,
  stepIntervalMs: 85,
  size: 1,
  alpha: 1,
  blur: 0,
  surface: DEFAULT_SURFACE,
  angleOffset: 0,
  jitter: 8,
};

const BASE_PROFILE: ResolvedSurfaceProfile = {
  lifetimeMs: 1800,
  startAlpha: 0.32,
  endAlpha: 0,
  tint: 0x2d2a26,
  blendMode: "multiply",
  scale: 1,
  blurStart: 0.45,
  blurEnd: 1.9,
  erosionStart: 0.54,
};

const BUILTIN_PROFILES: Record<string, ResolvedSurfaceProfile> = {
  [DEFAULT_SURFACE]: BASE_PROFILE,
  sand: {
    lifetimeMs: 1650,
    startAlpha: 0.31,
    endAlpha: 0,
    tint: 0x8e6d46,
    blendMode: "multiply",
    scale: 1,
    blurStart: 0.35,
    blurEnd: 1.5,
    erosionStart: 0.62,
  },
  snow: {
    lifetimeMs: 2550,
    startAlpha: 0.24,
    endAlpha: 0,
    tint: 0x7d8fa3,
    blendMode: "multiply",
    scale: 1.05,
    blurStart: 0.6,
    blurEnd: 2.25,
    erosionStart: 0.45,
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const toggleFoot = (foot: FootSide): FootSide => (foot === "left" ? "right" : "left");

const degToRad = (degrees: number) => (degrees * Math.PI) / 180;

const resolveReactiveValue = <T>(value: ReactiveValue<T> | undefined): T | undefined => {
  if (
    value &&
    typeof value === "object" &&
    "value" in (value as Record<string, unknown>) &&
    Object.keys(value as Record<string, unknown>).length <= 2
  ) {
    return (value as Record<string, T>).value;
  }
  if (typeof value === "function") {
    try {
      return (value as () => T)();
    } catch {
      return undefined;
    }
  }
  return value;
};

const parseColorToNumber = (color: ColorInput | undefined, fallback: number): number => {
  if (typeof color === "number" && Number.isFinite(color)) {
    return Math.max(0, Math.floor(color)) & 0xffffff;
  }
  if (typeof color === "string") {
    const cleaned = color.trim().replace(/^#/, "");
    const normalized =
      cleaned.length === 3
        ? `${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`
        : cleaned;
    const parsed = parseInt(normalized, 16);
    if (Number.isFinite(parsed)) {
      return parsed & 0xffffff;
    }
  }
  return fallback;
};

const resolvePoint = (value: ReactiveValue<PointLike> | undefined, fallback: PointLike): PointLike => {
  const resolved = resolveReactiveValue(value);
  const x = Number((resolved as PointLike | undefined)?.x);
  const y = Number((resolved as PointLike | undefined)?.y);
  return {
    x: isFiniteNumber(x) ? x : fallback.x,
    y: isFiniteNumber(y) ? y : fallback.y,
  };
};

const toGlobalPoint = (container: any, point: PointLike): PointLike => {
  if (container && typeof container.toGlobal === "function") {
    const globalPoint = container.toGlobal(point);
    if (isFiniteNumber(globalPoint?.x) && isFiniteNumber(globalPoint?.y)) {
      return { x: globalPoint.x, y: globalPoint.y };
    }
  }
  return point;
};

const toLocalPoint = (container: any, point: PointLike): PointLike => {
  if (container && typeof container.toLocal === "function") {
    const localPoint = container.toLocal(point);
    if (isFiniteNumber(localPoint?.x) && isFiniteNumber(localPoint?.y)) {
      return { x: localPoint.x, y: localPoint.y };
    }
  }
  return point;
};

const resolveProfileInput = (
  source: FootprintSurfaceProfile | undefined,
  fallback: ResolvedSurfaceProfile
): ResolvedSurfaceProfile => {
  const lifetimeMs = Number(resolveReactiveValue(source?.lifetimeMs));
  const startAlpha = Number(resolveReactiveValue(source?.startAlpha));
  const endAlpha = Number(resolveReactiveValue(source?.endAlpha));
  const scale = Number(resolveReactiveValue(source?.scale));
  const blurStart = Number(resolveReactiveValue(source?.blurStart));
  const blurEnd = Number(resolveReactiveValue(source?.blurEnd));
  const erosionStart = Number(resolveReactiveValue(source?.erosionStart));
  const tintInput = resolveReactiveValue(source?.tint);
  const blendInput = resolveReactiveValue(source?.blendMode);

  return {
    lifetimeMs: isFiniteNumber(lifetimeMs) ? Math.max(120, lifetimeMs) : fallback.lifetimeMs,
    startAlpha: isFiniteNumber(startAlpha) ? clamp(startAlpha, 0, 1.5) : fallback.startAlpha,
    endAlpha: isFiniteNumber(endAlpha) ? clamp(endAlpha, 0, 1.5) : fallback.endAlpha,
    tint: parseColorToNumber(tintInput, fallback.tint),
    blendMode: blendInput ?? fallback.blendMode,
    scale: isFiniteNumber(scale) ? Math.max(0.05, scale) : fallback.scale,
    blurStart: isFiniteNumber(blurStart) ? Math.max(0, blurStart) : fallback.blurStart,
    blurEnd: isFiniteNumber(blurEnd) ? Math.max(0, blurEnd) : fallback.blurEnd,
    erosionStart: isFiniteNumber(erosionStart)
      ? clamp(erosionStart, 0.05, 0.95)
      : fallback.erosionStart,
  };
};

const resolveProfilesMap = (
  value: ReactiveValue<Record<string, FootprintSurfaceProfile>> | undefined
): Record<string, ResolvedSurfaceProfile> => {
  const userProfiles = resolveReactiveValue(value) ?? {};
  const resolved: Record<string, ResolvedSurfaceProfile> = {};

  for (const [name, profile] of Object.entries(BUILTIN_PROFILES)) {
    resolved[name] = resolveProfileInput((userProfiles as any)[name], profile);
  }

  for (const [name, profile] of Object.entries(userProfiles)) {
    if (resolved[name]) continue;
    resolved[name] = resolveProfileInput(profile, BASE_PROFILE);
  }

  if (!resolved[DEFAULT_SURFACE]) {
    resolved[DEFAULT_SURFACE] = BASE_PROFILE;
  }

  return resolved;
};

const resolveCasterOptions = (
  rawValue: unknown,
  defaultSurface: string
): ResolvedCaster | null => {
  if (rawValue === false || rawValue === null || rawValue === undefined) return null;
  const source: FootprintCasterOptions =
    rawValue === true || typeof rawValue !== "object"
      ? {}
      : (rawValue as FootprintCasterOptions);

  const enabled = resolveReactiveValue(source.enabled);
  if (enabled === false) return null;

  const minStepDistance = Number(resolveReactiveValue(source.minStepDistance));
  const minSpeed = Number(resolveReactiveValue(source.minSpeed));
  const stepIntervalMs = Number(resolveReactiveValue(source.stepIntervalMs));
  const size = Number(resolveReactiveValue(source.size));
  const alpha = Number(resolveReactiveValue(source.alpha));
  const blur = Number(resolveReactiveValue(source.blur));
  const angleOffset = Number(resolveReactiveValue(source.angleOffset));
  const jitter = Number(resolveReactiveValue(source.jitter));
  const surfaceRaw = resolveReactiveValue(source.surface);

  return {
    footAnchor: resolvePoint(source.footAnchor, DEFAULT_CASTER.footAnchor),
    leftOffset: resolvePoint(source.leftOffset, DEFAULT_CASTER.leftOffset),
    rightOffset: resolvePoint(source.rightOffset, DEFAULT_CASTER.rightOffset),
    minStepDistance: isFiniteNumber(minStepDistance)
      ? Math.max(2, minStepDistance)
      : DEFAULT_CASTER.minStepDistance,
    minSpeed: isFiniteNumber(minSpeed) ? Math.max(0, minSpeed) : DEFAULT_CASTER.minSpeed,
    stepIntervalMs: isFiniteNumber(stepIntervalMs)
      ? Math.max(0, stepIntervalMs)
      : DEFAULT_CASTER.stepIntervalMs,
    size: isFiniteNumber(size) ? Math.max(0.1, size) : DEFAULT_CASTER.size,
    alpha: isFiniteNumber(alpha) ? clamp(alpha, 0, 2) : DEFAULT_CASTER.alpha,
    blur: isFiniteNumber(blur) ? Math.max(0, blur) : DEFAULT_CASTER.blur,
    surface:
      typeof surfaceRaw === "string" && surfaceRaw.trim().length > 0
        ? surfaceRaw.trim()
        : defaultSurface,
    angleOffset: isFiniteNumber(angleOffset) ? angleOffset : DEFAULT_CASTER.angleOffset,
    jitter: isFiniteNumber(jitter) ? Math.max(0, jitter) : DEFAULT_CASTER.jitter,
  };
};

const resolveCasterFromInstance = (
  instance: any,
  defaultSurface: string
): ResolvedCaster | null => {
  if (!instance || instance[FOOTPRINT_MANAGED_MARK]) return null;
  const element = typeof instance.getElement === "function" ? instance.getElement() : null;
  const rawFootprintCaster =
    resolveReactiveValue((instance as any).footprintCaster) ??
    resolveReactiveValue((instance as any).fullProps?.footprintCaster) ??
    resolveReactiveValue(element?.props?.footprintCaster) ??
    resolveReactiveValue(element?.propObservables?.footprintCaster as any);
  if (rawFootprintCaster === undefined) return null;
  return resolveCasterOptions(rawFootprintCaster, defaultSurface);
};

const collectFootprintCasters = (
  root: any,
  defaultSurface: string
): Array<{ instance: any; caster: ResolvedCaster }> => {
  const collected: Array<{ instance: any; caster: ResolvedCaster }> = [];
  const stack: any[] = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    const children = Array.isArray(node?.children) ? node.children : [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child || child[FOOTPRINT_MANAGED_MARK]) continue;

      const caster = resolveCasterFromInstance(child, defaultSurface);
      if (caster && child.parent) {
        collected.push({ instance: child, caster });
      }

      if (Array.isArray(child.children) && child.children.length > 0) {
        stack.push(child);
      }
    }
  }

  return collected;
};

const resolveRenderer = (context: any): any => {
  const appSignal = context?.app;
  if (typeof appSignal === "function") {
    try {
      const app = appSignal();
      if (app?.renderer && typeof app.renderer.generateTexture === "function") {
        return app.renderer;
      }
    } catch {
      // Ignore and use fallback.
    }
  }
  const globalRenderer = (globalThis as any).__PIXI_RENDERER__;
  if (globalRenderer && typeof globalRenderer.generateTexture === "function") {
    return globalRenderer;
  }
  return null;
};

const createFootprintTexture = (renderer: any): Texture => {
  const graphics = new Graphics();

  graphics.ellipse(0, 10, 8.4, 6.1).fill(0xffffff);
  graphics.ellipse(0, -1.4, 6.8, 9.4).fill(0xffffff);
  graphics.circle(-4.7, -12.8, 2).fill(0xffffff);
  graphics.circle(-1.5, -14.6, 1.9).fill(0xffffff);
  graphics.circle(1.5, -15.3, 1.75).fill(0xffffff);
  graphics.circle(4.5, -14.1, 1.45).fill(0xffffff);

  const texture = renderer.generateTexture(graphics);
  graphics.destroy();

  return texture;
};

const resolveCasterBasePoint = (
  caster: any,
  parent: PixiContainer,
  casterConfig: ResolvedCaster
): PointLike => {
  const bounds = typeof caster.getBounds === "function" ? caster.getBounds() : null;
  const width = Math.max(
    1,
    Math.abs(Number(caster.width)) || Math.abs(Number(bounds?.width)) || 1
  );
  const height = Math.max(
    1,
    Math.abs(Number(caster.height)) || Math.abs(Number(bounds?.height)) || 1
  );

  const anchorXRaw = Number(caster.anchor?.x);
  const anchorYRaw = Number(caster.anchor?.y);
  const anchorX = isFiniteNumber(anchorXRaw) ? clamp(anchorXRaw, 0, 1) : 0.5;
  const anchorY = isFiniteNumber(anchorYRaw) ? clamp(anchorYRaw, 0, 1) : 1;

  const local = {
    x: (casterConfig.footAnchor.x - anchorX) * width,
    y: (casterConfig.footAnchor.y - anchorY) * height,
  };

  const global = toGlobalPoint(caster, local);
  return toLocalPoint(parent, global);
};

const placeBelowCaster = (
  sprite: PixiSprite,
  caster: any,
  parent: PixiContainer
) => {
  const casterZIndex = isFiniteNumber(caster?.zIndex) ? caster.zIndex : 0;
  sprite.zIndex = casterZIndex - 0.16;

  if ((parent as any).sortableChildren) return;
  if (!Array.isArray(parent.children)) return;
  if (!parent.children.includes(caster) || !parent.children.includes(sprite)) return;

  const casterIndex = parent.getChildIndex(caster);
  const targetIndex = Math.max(0, casterIndex - 1);
  if (parent.getChildIndex(sprite) !== targetIndex) {
    parent.setChildIndex(sprite, targetIndex);
  }
};

/**
 * Footprints preset
 *
 * Adds fading footprints behind moving sprites tagged with `footprintCaster`.
 * Footprints are generated procedurally (no image required) and can be tuned
 * per surface profile (for example `sand` and `snow`).
 */
export function Footprints(options: FootprintsProps = {}) {
  const props = useProps(options);

  mount((element) => {
    const context = element.props.context;
    const viewport = context?.viewport;
    const target: any = viewport ?? element.parent?.componentInstance;
    if (!target || typeof target.addChild !== "function") return;
    const tickSignal = context?.tick;

    const casterState = new Map<any, ManagedCasterState>();
    const activeFootprints: ManagedFootprint[] = [];
    const freeFootprints: ManagedFootprint[] = [];

    let accumulatorMs = 0;
    let elapsedMs = 0;
    let forceRefresh = true;
    let tickSubscription: any = null;
    let footprintTexture: Texture | null = null;

    const ensureTexture = (): Texture | null => {
      if (footprintTexture && !footprintTexture.destroyed) return footprintTexture;
      const renderer = resolveRenderer(context);
      if (!renderer) return null;
      footprintTexture = createFootprintTexture(renderer);
      return footprintTexture;
    };

    const releaseFootprint = (managed: ManagedFootprint) => {
      const sprite = managed.sprite;
      sprite.visible = false;
      sprite.alpha = 0;
      if (sprite.parent) {
        sprite.parent.removeChild(sprite);
      }
      freeFootprints.push(managed);
    };

    const destroyFootprint = (managed: ManagedFootprint) => {
      if (managed.sprite.parent) {
        managed.sprite.parent.removeChild(managed.sprite);
      }
      managed.sprite.destroy();
    };

    const acquireFootprint = (texture: Texture): ManagedFootprint => {
      let managed = freeFootprints.pop();
      if (!managed) {
        const sprite = new PixiSprite(texture);
        const blurFilter = new BlurFilter({ strength: 0, quality: 1 });

        sprite.filters = [blurFilter];
        sprite.anchor.set(0.5, 0.84);
        sprite.roundPixels = true;
        sprite.eventMode = "none";
        sprite.visible = false;
        (sprite as any)[FOOTPRINT_MANAGED_MARK] = true;

        managed = {
          sprite,
          blurFilter,
          bornAt: 0,
          lifetimeMs: BASE_PROFILE.lifetimeMs,
          startAlpha: BASE_PROFILE.startAlpha,
          endAlpha: BASE_PROFILE.endAlpha,
          baseScaleX: 1,
          baseScaleY: 1,
          blurStart: BASE_PROFILE.blurStart,
          blurEnd: BASE_PROFILE.blurEnd,
          erosionStart: BASE_PROFILE.erosionStart,
        };
      } else {
        managed.sprite.texture = texture;
      }

      return managed;
    };

    const trimOverflow = (maxFootprints: number) => {
      while (activeFootprints.length > maxFootprints) {
        const oldest = activeFootprints.shift();
        if (!oldest) break;
        releaseFootprint(oldest);
      }
    };

    const updateActiveFootprints = (nowMs: number) => {
      for (let i = activeFootprints.length - 1; i >= 0; i--) {
        const managed = activeFootprints[i];
        const sprite = managed.sprite;

        if (!sprite || sprite.destroyed) {
          activeFootprints.splice(i, 1);
          continue;
        }

        const t = clamp((nowMs - managed.bornAt) / Math.max(1, managed.lifetimeMs), 0, 1);
        const fade = 1 - smoothstep(0, 1, t);
        const erosion =
          t <= managed.erosionStart ? 1 : 1 - smoothstep(managed.erosionStart, 1, t);
        const alpha = clamp(lerp(managed.startAlpha, managed.endAlpha, t) * fade * erosion, 0, 1.5);

        if (t >= 1 || alpha <= 0.001) {
          activeFootprints.splice(i, 1);
          releaseFootprint(managed);
          continue;
        }

        const spread = 1 + t * 0.08;
        sprite.scale.set(managed.baseScaleX * spread, managed.baseScaleY * spread);
        sprite.alpha = alpha;
        managed.blurFilter.strength = lerp(managed.blurStart, managed.blurEnd, t);
        sprite.visible = true;
      }
    };

    const emitFootprint = (
      casterInstance: any,
      casterConfig: ResolvedCaster,
      state: ManagedCasterState,
      profile: ResolvedSurfaceProfile,
      nowMs: number,
      maxFootprints: number
    ) => {
      const texture = ensureTexture();
      const parent = casterInstance.parent as PixiContainer | null;
      if (!texture || !parent || parent.destroyed) return;

      const basePoint = resolveCasterBasePoint(casterInstance, parent, casterConfig);
      const offset = state.nextFoot === "left" ? casterConfig.leftOffset : casterConfig.rightOffset;

      const heading = state.heading;
      const rightX = -Math.sin(heading);
      const rightY = Math.cos(heading);
      const forwardX = Math.cos(heading);
      const forwardY = Math.sin(heading);

      const x = basePoint.x + rightX * offset.x + forwardX * offset.y;
      const y = basePoint.y + rightY * offset.x + forwardY * offset.y;

      const managed = acquireFootprint(texture);
      const sprite = managed.sprite;

      if (sprite.parent && sprite.parent !== parent) {
        sprite.parent.removeChild(sprite);
      }
      if (!sprite.parent) {
        parent.addChild(sprite);
      }

      const jitterRad = degToRad(casterConfig.jitter);
      const randomJitter = (Math.random() * 2 - 1) * jitterRad;
      const angleOffsetRad = degToRad(casterConfig.angleOffset);
      const rotation = heading + Math.PI / 2 + angleOffsetRad + randomJitter;
      const profileScale = profile.scale * casterConfig.size;
      const scaleX = (state.nextFoot === "left" ? 1 : -1) * Math.max(0.01, profileScale);
      const scaleY = Math.max(0.01, profileScale);

      sprite.position.set(x, y);
      sprite.rotation = rotation;
      sprite.scale.set(scaleX, scaleY);
      sprite.tint = profile.tint;
      sprite.blendMode = profile.blendMode as any;
      sprite.alpha = clamp(profile.startAlpha * casterConfig.alpha, 0, 1.5);
      sprite.visible = true;

      placeBelowCaster(sprite, casterInstance, parent);

      managed.bornAt = nowMs;
      managed.lifetimeMs = profile.lifetimeMs;
      managed.startAlpha = clamp(profile.startAlpha * casterConfig.alpha, 0, 1.5);
      managed.endAlpha = clamp(profile.endAlpha * casterConfig.alpha, 0, 1.5);
      managed.baseScaleX = scaleX;
      managed.baseScaleY = scaleY;
      managed.blurStart = Math.max(0, profile.blurStart + casterConfig.blur);
      managed.blurEnd = Math.max(managed.blurStart, profile.blurEnd + casterConfig.blur);
      managed.erosionStart = clamp(
        profile.erosionStart + (Math.random() * 2 - 1) * 0.11,
        0.05,
        0.95
      );
      managed.blurFilter.strength = managed.blurStart;

      activeFootprints.push(managed);
      trimOverflow(maxFootprints);

      state.nextFoot = toggleFoot(state.nextFoot);
      state.lastStepMs = nowMs;
      state.distanceSinceStep = Math.max(0, state.distanceSinceStep - casterConfig.minStepDistance);
    };

    const sync = (nowMs: number) => {
      const defaultSurfaceRaw = resolveReactiveValue(props.defaultSurface as ReactiveValue<string> | undefined);
      const defaultSurface =
        typeof defaultSurfaceRaw === "string" && defaultSurfaceRaw.trim().length > 0
          ? defaultSurfaceRaw.trim()
          : DEFAULT_SURFACE;

      const profileMap = resolveProfilesMap(
        props.profiles as ReactiveValue<Record<string, FootprintSurfaceProfile>> | undefined
      );

      const maxFootprintsRaw = Number(
        resolveReactiveValue(props.maxFootprints as ReactiveValue<number> | undefined)
      );
      const maxFootprints = clamp(
        isFiniteNumber(maxFootprintsRaw) ? maxFootprintsRaw : DEFAULT_MAX_FOOTPRINTS,
        10,
        1200
      );

      const casters = collectFootprintCasters(target, defaultSurface);
      const activeCasters = new Set<any>();

      for (let i = 0; i < casters.length; i++) {
        const { instance: casterInstance, caster } = casters[i];
        if (!casterInstance || casterInstance.destroyed || !casterInstance.parent) continue;

        activeCasters.add(casterInstance);

        let state = casterState.get(casterInstance);
        if (!state) {
          state = {
            lastPoint: null,
            lastUpdateMs: nowMs,
            distanceSinceStep: 0,
            lastStepMs: -Infinity,
            nextFoot: "left",
            heading: Number(casterInstance.rotation) || 0,
          };
          casterState.set(casterInstance, state);
        }

        const parent = casterInstance.parent as PixiContainer;
        const basePoint = resolveCasterBasePoint(casterInstance, parent, caster);

        if (!state.lastPoint) {
          state.lastPoint = basePoint;
          state.lastUpdateMs = nowMs;
          continue;
        }

        const deltaMs = Math.max(1, nowMs - state.lastUpdateMs);
        const dx = basePoint.x - state.lastPoint.x;
        const dy = basePoint.y - state.lastPoint.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0.0001) {
          state.heading = Math.atan2(dy, dx);
        }

        state.distanceSinceStep += distance;
        const speed = (distance * 1000) / deltaMs;
        const profile = profileMap[caster.surface] ?? profileMap[defaultSurface] ?? BASE_PROFILE;

        if (
          speed >= caster.minSpeed &&
          state.distanceSinceStep >= caster.minStepDistance &&
          nowMs - state.lastStepMs >= caster.stepIntervalMs
        ) {
          emitFootprint(casterInstance, caster, state, profile, nowMs, maxFootprints);
        }

        state.lastPoint = basePoint;
        state.lastUpdateMs = nowMs;
      }

      for (const [casterInstance] of casterState.entries()) {
        if (!activeCasters.has(casterInstance) || casterInstance?.destroyed) {
          casterState.delete(casterInstance);
        }
      }

      updateActiveFootprints(nowMs);
    };

    tickSubscription = tickSignal?.observable?.subscribe((tickArgs: any) => {
      const tickValue = tickArgs?.value ?? tickArgs;
      const deltaTime = Number(tickValue?.deltaTime);
      const frameMs = isFiniteNumber(deltaTime) ? deltaTime : 16.67;

      elapsedMs += frameMs;
      accumulatorMs += frameMs;

      const updateHzRaw = Number(resolveReactiveValue(props.updateHz as ReactiveValue<number> | undefined));
      const updateHz = clamp(isFiniteNumber(updateHzRaw) ? updateHzRaw : DEFAULT_UPDATE_HZ, 1, 120);
      const intervalMs = 1000 / updateHz;

      if (forceRefresh || accumulatorMs >= intervalMs) {
        accumulatorMs = 0;
        forceRefresh = false;
        sync(elapsedMs);
      }
    });

    sync(0);

    return () => {
      tickSubscription?.unsubscribe?.();

      for (let i = 0; i < activeFootprints.length; i++) {
        destroyFootprint(activeFootprints[i]);
      }
      for (let i = 0; i < freeFootprints.length; i++) {
        destroyFootprint(freeFootprints[i]);
      }

      activeFootprints.length = 0;
      freeFootprints.length = 0;
      casterState.clear();

      if (footprintTexture && !footprintTexture.destroyed) {
        footprintTexture.destroy(true);
      }
      footprintTexture = null;
    };
  });

  return h(Container);
}
