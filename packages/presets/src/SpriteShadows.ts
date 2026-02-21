import { Container, h, mount, useProps } from "canvasengine";
import {
  BlurFilter,
  Container as PixiContainer,
  Filter,
  Sprite as PixiSprite,
} from "pixi.js";
import fragmentShader from "./shaders/shadowGradient.frag.glsl?raw";
import vertexShader from "./shaders/defaultFilter.vert.glsl?raw";

type ReactiveValue<T> = T | (() => T);
type PointLike = { x: number; y: number };
type ColorInput = string | number;

export type ShadowLight = {
  x: number;
  y: number;
  z?: number;
  radius?: number;
  intensity?: number;
  shadowWeight?: number;
  enabled?: boolean;
};

export type ShadowLightInput = {
  x: ReactiveValue<number>;
  y: ReactiveValue<number>;
  z?: ReactiveValue<number>;
  radius?: ReactiveValue<number>;
  intensity?: ReactiveValue<number>;
  shadowWeight?: ReactiveValue<number>;
  enabled?: ReactiveValue<boolean>;
};

export type ShadowCasterOptions = {
  enabled?: ReactiveValue<boolean>;
  height?: ReactiveValue<number>;
  footOffset?: ReactiveValue<PointLike>;
  footAnchor?: ReactiveValue<PointLike>;
  alpha?: ReactiveValue<number>;
  blur?: ReactiveValue<number>;
  gradientPower?: ReactiveValue<number>;
  hardness?: ReactiveValue<number>;
  minLength?: ReactiveValue<number>;
  maxLength?: ReactiveValue<number>;
  contactAlpha?: ReactiveValue<number>;
  contactScale?: ReactiveValue<number>;
  anchorX?: ReactiveValue<number>;
};

type ShadowMode = "strongest" | "blend2";

export type SpriteShadowsProps = {
  lights?: ReactiveValue<Array<ShadowLightInput | ShadowLight>>;
  sources?: ReactiveValue<Array<ShadowLightInput | ShadowLight>>;
  mode?: ReactiveValue<ShadowMode>;
  updateHz?: ReactiveValue<number>;
  shadowColor?: ReactiveValue<ColorInput>;
};

type ResolvedCaster = {
  height: number;
  footOffset: PointLike;
  footAnchor: PointLike;
  alpha: number;
  blur: number;
  gradientPower: number;
  hardness: number;
  minLength: number;
  maxLength: number;
  contactAlpha: number;
  contactScale: number;
  anchorX?: number;
};

type ResolvedLight = {
  x: number;
  y: number;
  globalX: number;
  globalY: number;
  z: number;
  radius: number;
  intensity: number;
  shadowWeight: number;
};

type LightCandidate = {
  dirX: number;
  dirY: number;
  influence: number;
  length: number;
};

type GradientFilter = Filter & {
  setGradient: (power: number, floor: number) => void;
};

type ManagedShadow = {
  caster: any;
  parent: PixiContainer;
  near: PixiSprite;
  far: PixiSprite;
  contact: PixiSprite;
  nearBlur: BlurFilter;
  farBlur: BlurFilter;
  contactBlur: BlurFilter;
  nearGradient: GradientFilter;
  farGradient: GradientFilter;
  dirX: number;
  dirY: number;
  length: number;
};

const SHADOW_MANAGED_MARK = "__spriteShadowManaged";
const DEFAULT_LIGHT_Z = 220;
const DEFAULT_LIGHT_RADIUS = 360;
const DEFAULT_LIGHT_INTENSITY = 1;
const DEFAULT_MODE: ShadowMode = "strongest";
const DEFAULT_UPDATE_HZ = 30;
const DEFAULT_SHADOW_COLOR = 0x000000;
const DEFAULT_CASTER: ResolvedCaster = {
  height: 72,
  footOffset: { x: 0, y: 0 },
  footAnchor: { x: 0.5, y: 1 },
  alpha: 0.56,
  blur: 3.5,
  gradientPower: 2,
  hardness: 0.42,
  minLength: 10,
  maxLength: 280,
  contactAlpha: 0.28,
  contactScale: 0.28,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

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

const parseColorToNumber = (color: ColorInput | undefined): number => {
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
    if (Number.isFinite(parsed)) return parsed & 0xffffff;
  }
  return DEFAULT_SHADOW_COLOR;
};

const resolvePoint = (
  value: ReactiveValue<PointLike> | undefined,
  fallback: PointLike
): PointLike => {
  const resolved = resolveReactiveValue(value);
  const x = Number((resolved as PointLike | undefined)?.x);
  const y = Number((resolved as PointLike | undefined)?.y);
  return {
    x: isFiniteNumber(x) ? x : fallback.x,
    y: isFiniteNumber(y) ? y : fallback.y,
  };
};

const toGlobalPoint = (
  container: any,
  point: PointLike
): PointLike => {
  if (container && typeof container.toGlobal === "function") {
    const globalPoint = container.toGlobal(point);
    if (isFiniteNumber(globalPoint?.x) && isFiniteNumber(globalPoint?.y)) {
      return { x: globalPoint.x, y: globalPoint.y };
    }
  }
  return point;
};

const toLocalPoint = (
  container: any,
  point: PointLike
): PointLike => {
  if (container && typeof container.toLocal === "function") {
    const localPoint = container.toLocal(point);
    if (isFiniteNumber(localPoint?.x) && isFiniteNumber(localPoint?.y)) {
      return { x: localPoint.x, y: localPoint.y };
    }
  }
  return point;
};

const createGradientFilter = (
  power = 2,
  floor = 0.06
): GradientFilter => {
  const uPower = { value: power, type: "f32" as const };
  const uFloor = { value: floor, type: "f32" as const };
  const filter = Filter.from({
    gl: {
      vertex: vertexShader,
      fragment: fragmentShader,
    },
    resources: {
      shadowGradientUniforms: {
        uPower,
        uFloor,
      },
    },
  }) as GradientFilter;

  filter.setGradient = (nextPower: number, nextFloor: number) => {
    uPower.value = isFiniteNumber(nextPower) ? Math.max(0.001, nextPower) : 2;
    uFloor.value = isFiniteNumber(nextFloor) ? clamp(nextFloor, 0, 1) : 0.06;
  };

  return filter;
};

const resolveCasterOptions = (rawValue: unknown): ResolvedCaster | null => {
  if (rawValue === false || rawValue === null || rawValue === undefined) return null;
  const source: ShadowCasterOptions =
    rawValue === true || typeof rawValue !== "object"
      ? {}
      : (rawValue as ShadowCasterOptions);

  const enabled = resolveReactiveValue(source.enabled);
  if (enabled === false) return null;

  const height = Number(resolveReactiveValue(source.height));
  const alpha = Number(resolveReactiveValue(source.alpha));
  const blur = Number(resolveReactiveValue(source.blur));
  const gradientPower = Number(resolveReactiveValue(source.gradientPower));
  const hardness = Number(resolveReactiveValue(source.hardness));
  const minLength = Number(resolveReactiveValue(source.minLength));
  const maxLength = Number(resolveReactiveValue(source.maxLength));
  const contactAlpha = Number(resolveReactiveValue(source.contactAlpha));
  const contactScale = Number(resolveReactiveValue(source.contactScale));
  const anchorX = Number(resolveReactiveValue(source.anchorX));

  return {
    height: isFiniteNumber(height) ? Math.max(2, height) : DEFAULT_CASTER.height,
    footOffset: resolvePoint(source.footOffset, DEFAULT_CASTER.footOffset),
    footAnchor: resolvePoint(source.footAnchor, DEFAULT_CASTER.footAnchor),
    alpha: isFiniteNumber(alpha) ? clamp(alpha, 0, 1.5) : DEFAULT_CASTER.alpha,
    blur: isFiniteNumber(blur) ? Math.max(0, blur) : DEFAULT_CASTER.blur,
    gradientPower: isFiniteNumber(gradientPower)
      ? clamp(gradientPower, 0.2, 8)
      : DEFAULT_CASTER.gradientPower,
    hardness: isFiniteNumber(hardness) ? clamp(hardness, 0, 1) : DEFAULT_CASTER.hardness,
    minLength: isFiniteNumber(minLength) ? Math.max(0, minLength) : DEFAULT_CASTER.minLength,
    maxLength: isFiniteNumber(maxLength)
      ? Math.max(2, maxLength)
      : DEFAULT_CASTER.maxLength,
    contactAlpha: isFiniteNumber(contactAlpha)
      ? clamp(contactAlpha, 0, 1)
      : DEFAULT_CASTER.contactAlpha,
    contactScale: isFiniteNumber(contactScale)
      ? Math.max(0.05, contactScale)
      : DEFAULT_CASTER.contactScale,
    anchorX: isFiniteNumber(anchorX) ? clamp(anchorX, 0, 1) : undefined,
  };
};

const resolveCasterFromInstance = (instance: any): ResolvedCaster | null => {
  if (!instance || instance[SHADOW_MANAGED_MARK]) return null;
  const element = typeof instance.getElement === "function" ? instance.getElement() : null;
  const rawShadowCaster =
    resolveReactiveValue((instance as any).shadowCaster) ??
    resolveReactiveValue((instance as any).fullProps?.shadowCaster) ??
    resolveReactiveValue(element?.props?.shadowCaster) ??
    resolveReactiveValue(element?.propObservables?.shadowCaster as any);
  if (rawShadowCaster === undefined) return null;
  return resolveCasterOptions(rawShadowCaster);
};

const collectShadowCasters = (root: any): Array<{ instance: any; caster: ResolvedCaster }> => {
  const collected: Array<{ instance: any; caster: ResolvedCaster }> = [];
  const stack: any[] = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    const children = Array.isArray(node?.children) ? node.children : [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child || child[SHADOW_MANAGED_MARK]) continue;

      const caster = resolveCasterFromInstance(child);
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

const resolveLights = (
  source: ReactiveValue<Array<ShadowLightInput | ShadowLight>> | undefined,
  lightSpace: any
): ResolvedLight[] => {
  const raw = resolveReactiveValue(source);
  if (!Array.isArray(raw)) return [];
  const resolved: ResolvedLight[] = [];

  for (let i = 0; i < raw.length; i++) {
    const light = raw[i] as ShadowLightInput | ShadowLight;
    const enabled = resolveReactiveValue((light as ShadowLightInput).enabled);
    if (enabled === false) continue;

    const x = Number(resolveReactiveValue((light as ShadowLightInput).x));
    const y = Number(resolveReactiveValue((light as ShadowLightInput).y));
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) continue;

    const z = Number(resolveReactiveValue((light as ShadowLightInput).z));
    const radius = Number(resolveReactiveValue((light as ShadowLightInput).radius));
    const intensity = Number(resolveReactiveValue((light as ShadowLightInput).intensity));
    const shadowWeight = Number(resolveReactiveValue((light as ShadowLightInput).shadowWeight));
    const global = toGlobalPoint(lightSpace, { x, y });

    resolved.push({
      x,
      y,
      globalX: global.x,
      globalY: global.y,
      z: isFiniteNumber(z) ? Math.max(2, z) : DEFAULT_LIGHT_Z,
      radius: isFiniteNumber(radius) ? Math.max(1, radius) : DEFAULT_LIGHT_RADIUS,
      intensity: isFiniteNumber(intensity)
        ? clamp(intensity, 0, 2)
        : DEFAULT_LIGHT_INTENSITY,
      shadowWeight: isFiniteNumber(shadowWeight) ? clamp(shadowWeight, 0, 4) : 1,
    });
  }

  return resolved;
};

const blendCandidates = (
  candidates: LightCandidate[],
  mode: ShadowMode
): LightCandidate | null => {
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.influence - a.influence);

  if (mode === "strongest" || candidates.length === 1) {
    return candidates[0];
  }

  const picked = candidates.slice(0, 2);
  let weightedDirX = 0;
  let weightedDirY = 0;
  let weightedLength = 0;
  let weightTotal = 0;

  for (let i = 0; i < picked.length; i++) {
    const candidate = picked[i];
    const weight = Math.max(0.001, candidate.influence);
    weightedDirX += candidate.dirX * weight;
    weightedDirY += candidate.dirY * weight;
    weightedLength += candidate.length * weight;
    weightTotal += weight;
  }

  if (weightTotal <= 0) return null;
  const norm = Math.hypot(weightedDirX, weightedDirY);
  if (norm <= 0.0001) return null;

  return {
    dirX: weightedDirX / norm,
    dirY: weightedDirY / norm,
    length: weightedLength / weightTotal,
    influence: clamp(weightTotal / picked.length, 0, 2),
  };
};

const hideManagedShadow = (managed: ManagedShadow) => {
  managed.near.visible = false;
  managed.far.visible = false;
  managed.contact.visible = false;
};

const destroyManagedShadow = (managed: ManagedShadow) => {
  managed.near.destroy();
  managed.far.destroy();
  managed.contact.destroy();
};

const createManagedShadow = (
  caster: any,
  parent: PixiContainer,
  shadowColor: number
): ManagedShadow => {
  const near = new PixiSprite();
  const far = new PixiSprite();
  const contact = new PixiSprite();
  const nearBlur = new BlurFilter({ strength: 2.5, quality: 2 });
  const farBlur = new BlurFilter({ strength: 4.2, quality: 3 });
  const contactBlur = new BlurFilter({ strength: 2.8, quality: 2 });
  const nearGradient = createGradientFilter(2, 0.08);
  const farGradient = createGradientFilter(2.8, 0.02);

  near.filters = [nearGradient, nearBlur];
  far.filters = [farGradient, farBlur];
  contact.filters = [contactBlur];

  near.tint = shadowColor;
  far.tint = shadowColor;
  contact.tint = shadowColor;
  near.blendMode = "multiply" as any;
  far.blendMode = "multiply" as any;
  contact.blendMode = "multiply" as any;
  near.eventMode = "none";
  far.eventMode = "none";
  contact.eventMode = "none";
  near.roundPixels = true;
  far.roundPixels = true;
  contact.roundPixels = true;
  near.visible = false;
  far.visible = false;
  contact.visible = false;
  near.alpha = 0;
  far.alpha = 0;

  (near as any)[SHADOW_MANAGED_MARK] = true;
  (far as any)[SHADOW_MANAGED_MARK] = true;
  (contact as any)[SHADOW_MANAGED_MARK] = true;

  parent.addChild(contact);
  parent.addChild(far);
  parent.addChild(near);

  return {
    caster,
    parent,
    near,
    far,
    contact,
    nearBlur,
    farBlur,
    contactBlur,
    nearGradient,
    farGradient,
    dirX: 0,
    dirY: 1,
    length: 0,
  };
};

const placeBelowCaster = (managed: ManagedShadow) => {
  const { caster, parent, near, far, contact } = managed;
  if (!caster || caster.destroyed || !parent) return;

  const casterZIndex = isFiniteNumber(caster.zIndex) ? caster.zIndex : 0;
  contact.zIndex = casterZIndex - 0.32;
  far.zIndex = casterZIndex - 0.26;
  near.zIndex = casterZIndex - 0.22;

  if ((parent as any).sortableChildren) return;
  if (!Array.isArray(parent.children) || !parent.children.includes(caster)) return;

  const setBeforeCaster = (item: any) => {
    if (!item || item.destroyed || !parent.children.includes(item)) return;
    const casterIndex = parent.getChildIndex(caster);
    const targetIndex = Math.max(0, casterIndex - 1);
    if (parent.getChildIndex(item) !== targetIndex) {
      parent.setChildIndex(item, targetIndex);
    }
  };

  setBeforeCaster(contact);
  setBeforeCaster(far);
  setBeforeCaster(near);
};

const updateManagedShadow = (
  managed: ManagedShadow,
  casterConfig: ResolvedCaster,
  lights: ResolvedLight[],
  mode: ShadowMode,
  shadowColor: number
) => {
  const caster = managed.caster;
  const parent = managed.parent;
  if (!caster || caster.destroyed || !parent || parent.destroyed) {
    hideManagedShadow(managed);
    return;
  }

  if (caster.visible === false || (isFiniteNumber(caster.worldAlpha) && caster.worldAlpha <= 0.001)) {
    hideManagedShadow(managed);
    return;
  }

  const bounds = typeof caster.getBounds === "function" ? caster.getBounds() : null;
  const hasBounds =
    !!bounds &&
    isFiniteNumber(bounds.x) &&
    isFiniteNumber(bounds.y) &&
    isFiniteNumber(bounds.width) &&
    isFiniteNumber(bounds.height) &&
    bounds.width > 0 &&
    bounds.height > 0;
  if (!hasBounds) {
    hideManagedShadow(managed);
    return;
  }

  const casterWidth = Math.max(
    1,
    Math.abs(Number(caster.width)) || Math.abs(bounds.width)
  );
  const casterHeight = Math.max(
    1,
    Math.abs(Number(caster.height)) || Math.abs(bounds.height)
  );

  const casterAnchorXRaw = Number(caster.anchor?.x);
  const casterAnchorYRaw = Number(caster.anchor?.y);
  const casterAnchorX = isFiniteNumber(casterAnchorXRaw) ? clamp(casterAnchorXRaw, 0, 1) : 0.5;
  const casterAnchorY = isFiniteNumber(casterAnchorYRaw) ? clamp(casterAnchorYRaw, 0, 1) : 1;

  const anchorXForShadow = isFiniteNumber(casterConfig.anchorX)
    ? casterConfig.anchorX
    : casterAnchorX;

  const localFootPoint: PointLike = {
    x:
      (casterConfig.footAnchor.x - casterAnchorX) * casterWidth +
      casterConfig.footOffset.x,
    y:
      (casterConfig.footAnchor.y - casterAnchorY) * casterHeight +
      casterConfig.footOffset.y,
  };
  const footGlobal = toGlobalPoint(caster, localFootPoint);
  const footLocal = toLocalPoint(parent, footGlobal);
  const candidates: LightCandidate[] = [];

  for (let i = 0; i < lights.length; i++) {
    const light = lights[i];
    if (light.intensity <= 0.001 || light.radius <= 0.001) continue;
    const lightLocal = toLocalPoint(parent, {
      x: light.globalX,
      y: light.globalY,
    });
    const dx = footLocal.x - lightLocal.x;
    const dy = footLocal.y - lightLocal.y;
    const distance = Math.hypot(dx, dy);
    const falloff = clamp(1 - distance / light.radius, 0, 1);
    const zWeight = clamp(DEFAULT_LIGHT_Z / Math.max(12, light.z), 0.35, 2.4);
    const influence = clamp(
      falloff * falloff * light.intensity * light.shadowWeight * zWeight,
      0,
      2.2
    );
    if (influence <= 0.001) continue;

    const directionNorm = distance > 0.0001 ? distance : 1;
    const dirX = dx / directionNorm;
    const dirY = dy / directionNorm;
    const projectedLength = clamp(
      (distance * casterConfig.height) / Math.max(14, light.z),
      casterConfig.minLength,
      casterConfig.maxLength
    );

    candidates.push({
      dirX: isFiniteNumber(dirX) ? dirX : 0,
      dirY: isFiniteNumber(dirY) ? dirY : 1,
      influence,
      length: isFiniteNumber(projectedLength) ? projectedLength : casterConfig.minLength,
    });
  }

  const projection = blendCandidates(candidates, mode);
  if (!projection) {
    hideManagedShadow(managed);
    return;
  }

  const casterTexture = caster.texture;
  if (!casterTexture) {
    hideManagedShadow(managed);
    return;
  }

  const directionLerp = 0.34;
  const lengthLerp = 0.32;
  const smoothDirX = managed.dirX + (projection.dirX - managed.dirX) * directionLerp;
  const smoothDirY = managed.dirY + (projection.dirY - managed.dirY) * directionLerp;
  const smoothNorm = Math.hypot(smoothDirX, smoothDirY);
  const dirX = smoothNorm > 0.0001 ? smoothDirX / smoothNorm : projection.dirX;
  const dirY = smoothNorm > 0.0001 ? smoothDirY / smoothNorm : projection.dirY;
  const length = managed.length + (projection.length - managed.length) * lengthLerp;
  managed.dirX = dirX;
  managed.dirY = dirY;
  managed.length = length;

  const lengthScale = clamp(length / casterHeight, 0.08, 6);
  const widthScale = clamp(0.62 + lengthScale * 0.08, 0.5, 1.2);
  const hardness = clamp(casterConfig.hardness, 0, 1);
  const influenceNorm = clamp(projection.influence, 0, 1.35);
  const alphaBase = clamp(casterConfig.alpha * influenceNorm, 0, 1);
  const blurBase = Math.max(0, casterConfig.blur * (1.15 - hardness * 0.55));
  const gradientPower = clamp(casterConfig.gradientPower + (1 - hardness) * 0.7, 0.2, 8);
  // With anchor.y=1, the silhouette extends along local -Y; rotate that axis to shadow direction.
  const rotation = Math.atan2(dirY, dirX) + Math.PI / 2;

  managed.near.texture = casterTexture;
  managed.far.texture = casterTexture;
  managed.contact.texture = casterTexture;
  managed.near.tint = shadowColor;
  managed.far.tint = shadowColor;
  managed.contact.tint = shadowColor;
  managed.near.anchor.set(anchorXForShadow, 1);
  managed.far.anchor.set(anchorXForShadow, 1);
  managed.contact.anchor.set(anchorXForShadow, 1);

  managed.near.width = casterWidth * widthScale;
  managed.near.height = casterHeight * Math.max(0.12, lengthScale * 1.06);
  managed.far.width = managed.near.width * 1.02;
  managed.far.height = managed.near.height * 1.22;

  managed.near.position.set(footLocal.x, footLocal.y);
  managed.far.position.set(
    footLocal.x + dirX * length * 0.34,
    footLocal.y + dirY * length * 0.34
  );
  managed.contact.position.set(
    footLocal.x + dirX * Math.min(4, length * 0.06),
    footLocal.y + dirY * Math.min(4, length * 0.06)
  );
  managed.near.rotation = rotation;
  managed.far.rotation = rotation;
  managed.contact.rotation = rotation;

  managed.near.alpha = clamp(alphaBase * (0.74 + hardness * 0.2), 0, 1);
  managed.far.alpha = clamp(alphaBase * (0.3 + (1 - hardness) * 0.2), 0, 1);
  managed.near.visible = managed.near.alpha > 0.001;
  managed.far.visible = managed.far.alpha > 0.001;

  managed.nearBlur.strength = blurBase * (0.72 + (1 - influenceNorm) * 0.45);
  managed.farBlur.strength = blurBase * (1.45 + (1 - influenceNorm) * 1.1);
  managed.nearGradient.setGradient(gradientPower, 0.08);
  managed.farGradient.setGradient(gradientPower + 0.65, 0.03);

  const contactAlpha = clamp(casterConfig.contactAlpha * influenceNorm * 0.85, 0, 1);
  const contactWidth = Math.max(
    4,
    casterWidth * clamp(casterConfig.contactScale * 1.8, 0.25, 1.3)
  );
  const contactHeight = Math.max(
    2,
    casterHeight * clamp(casterConfig.contactScale * 0.62, 0.08, 0.56)
  );
  managed.contact.width = contactWidth * (0.92 + lengthScale * 0.18);
  managed.contact.height = contactHeight;
  managed.contact.alpha = clamp(contactAlpha * (0.6 + hardness * 0.2), 0, 1);
  managed.contactBlur.strength = blurBase * (0.85 + (1 - hardness) * 0.25);
  managed.contact.visible = managed.contact.alpha > 0.001;

  placeBelowCaster(managed);
};

/**
 * SpriteShadows preset
 *
 * Adds RPG-style projected shadows for sprites tagged with `shadowCaster`.
 * The shadow direction is automatically opposite to the dominant light source.
 *
 * Usage:
 * - Add `<SpriteShadows lights={lights} />` in your scene (preferably inside `Viewport`).
 * - Add `shadowCaster` on any sprite that should cast a shadow.
 */
export function SpriteShadows(options: SpriteShadowsProps = {}) {
  const props = useProps(options);
  const lightsSource = () =>
    (props.lights as ReactiveValue<Array<ShadowLightInput | ShadowLight>> | undefined) ??
    (props.sources as ReactiveValue<Array<ShadowLightInput | ShadowLight>> | undefined);

  mount((element) => {
    const context = element.props.context;
    const viewport = context?.viewport;
    const target: any = viewport ?? element.parent?.componentInstance;
    if (!target || typeof target.addChild !== "function") return;
    const tickSignal = context?.tick;

    const managedByCaster = new Map<any, ManagedShadow>();
    let accumulatorMs = 0;
    let forceRefresh = true;
    let tickSubscription: any = null;

    const sync = () => {
      const shadowColor = parseColorToNumber(
        resolveReactiveValue(props.shadowColor as ReactiveValue<ColorInput> | undefined)
      );
      const modeRaw = resolveReactiveValue(props.mode as ReactiveValue<ShadowMode> | undefined);
      const mode: ShadowMode = modeRaw === "blend2" ? "blend2" : DEFAULT_MODE;
      const lights = resolveLights(lightsSource(), target);
      const casters = collectShadowCasters(target);
      const activeCasters = new Set<any>();

      for (let i = 0; i < casters.length; i++) {
        const { instance: casterInstance, caster } = casters[i];
        if (!casterInstance || !casterInstance.parent || casterInstance.destroyed) continue;
        activeCasters.add(casterInstance);

        let managed = managedByCaster.get(casterInstance);
        if (!managed || managed.parent !== casterInstance.parent) {
          if (managed) destroyManagedShadow(managed);
          managed = createManagedShadow(casterInstance, casterInstance.parent, shadowColor);
          managedByCaster.set(casterInstance, managed);
        }

        updateManagedShadow(managed, caster, lights, mode, shadowColor);
      }

      for (const [casterInstance, managed] of managedByCaster.entries()) {
        if (
          !activeCasters.has(casterInstance) ||
          !casterInstance ||
          casterInstance.destroyed
        ) {
          destroyManagedShadow(managed);
          managedByCaster.delete(casterInstance);
        }
      }
    };

    tickSubscription = tickSignal?.observable?.subscribe((tickArgs: any) => {
      const tickValue = tickArgs?.value ?? tickArgs;
      const deltaTime = Number(tickValue?.deltaTime);
      const frameMs = isFiniteNumber(deltaTime) ? deltaTime : 16.67;
      const updateHzRaw = Number(
        resolveReactiveValue(props.updateHz as ReactiveValue<number> | undefined)
      );
      const updateHz = clamp(
        isFiniteNumber(updateHzRaw) ? updateHzRaw : DEFAULT_UPDATE_HZ,
        1,
        120
      );
      const intervalMs = 1000 / updateHz;
      accumulatorMs += frameMs;

      if (forceRefresh || accumulatorMs >= intervalMs) {
        accumulatorMs = 0;
        forceRefresh = false;
        sync();
      }
    });

    sync();

    return () => {
      tickSubscription?.unsubscribe?.();
      for (const managed of managedByCaster.values()) {
        destroyManagedShadow(managed);
      }
      managedByCaster.clear();
    };
  });

  return h(Container);
}
