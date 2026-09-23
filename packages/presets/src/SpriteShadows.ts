import { Container, h, mount, useProps } from "canvasengine";
import {
  AlphaFilter,
  Container as PixiContainer,
  Matrix,
  Sprite as PixiSprite,
  Texture,
} from "pixi.js";
import {
  bakeSilhouette,
  getBlobSilhouette,
  getContactShadowTexture,
  type ShadowSilhouette,
} from "./shadowSilhouette";

type ReactiveValue<T> = T | (() => T);
type PointLike = { x: number; y: number };
type BoundsLike = { x: number; y: number; width: number; height: number };
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

export type AmbientShadowLight = {
  x: number;
  y: number;
  z?: number;
  intensity?: number;
  shadowWeight?: number;
  length?: number;
  enabled?: boolean;
};

export type AmbientShadowLightInput = {
  x: ReactiveValue<number>;
  y: ReactiveValue<number>;
  z?: ReactiveValue<number>;
  intensity?: ReactiveValue<number>;
  shadowWeight?: ReactiveValue<number>;
  length?: ReactiveValue<number>;
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
  /**
   * Ground foreshortening of the projected shadow (`1` = seen from straight above,
   * `0.6` = RPG 3/4 view). Default: `0.7`
   */
  perspective?: ReactiveValue<number>;
  /** Project the real sprite silhouette (`true`) or a soft blob (`false`). Default: `true` */
  silhouette?: ReactiveValue<boolean>;
};

/**
 * - `multi`: one shadow per nearby light (up to `maxShadows`), each fading with its light
 * - `strongest`: a single shadow from the dominant light
 * - `blend2`: a single shadow averaging the two dominant lights
 */
export type ShadowMode = "multi" | "strongest" | "blend2";

export type SpriteShadowsProps = {
  lights?: ReactiveValue<Array<ShadowLightInput | ShadowLight>>;
  sources?: ReactiveValue<Array<ShadowLightInput | ShadowLight>>;
  ambientLight?: ReactiveValue<AmbientShadowLightInput | AmbientShadowLight | null>;
  minInfluence?: ReactiveValue<number>;
  falloffPower?: ReactiveValue<number>;
  mode?: ReactiveValue<ShadowMode>;
  /** Maximum shadows per caster in `multi` mode. Default: `3` */
  maxShadows?: ReactiveValue<number>;
  updateHz?: ReactiveValue<number>;
  scanHz?: ReactiveValue<number>;
  cullToViewport?: ReactiveValue<boolean>;
  shadowColor?: ReactiveValue<ColorInput>;
  /**
   * Opacity of the whole shadow layer. Shadows are merged before this opacity is applied,
   * so overlapping shadows never get darker than a single one. Default: `0.5`
   */
  opacity?: ReactiveValue<number>;
  /** zIndex of the shadow layer. Default: just below the lowest caster. */
  layerZIndex?: ReactiveValue<number>;
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
  perspective: number;
  silhouette: boolean;
};

type ResolvedLight = {
  key: string;
  x: number;
  y: number;
  globalX: number;
  globalY: number;
  z: number;
  radius: number;
  intensity: number;
  shadowWeight: number;
};

type ResolvedAmbientLight = {
  dirX: number;
  dirY: number;
  z: number;
  intensity: number;
  shadowWeight: number;
  length?: number;
};

type LightCandidate = {
  key: string;
  dirX: number;
  dirY: number;
  influence: number;
  length: number;
};

type ShadowSlot = {
  sprite: PixiSprite;
  dirX: number;
  dirY: number;
  length: number;
  alpha: number;
  targetAlpha: number;
  initialized: boolean;
};

type ShadowLayer = {
  layer: PixiContainer;
  filter: AlphaFilter;
};

type ManagedShadow = {
  caster: any;
  parent: PixiContainer;
  layer: PixiContainer;
  contact: PixiSprite;
  slots: Map<string, ShadowSlot>;
  silhouette: ShadowSilhouette | null;
  silhouetteKey: string;
  foot: PointLike;
};

const SHADOW_MANAGED_MARK = "__spriteShadowManaged";
const DEFAULT_LIGHT_Z = 220;
const DEFAULT_LIGHT_RADIUS = 360;
const DEFAULT_LIGHT_INTENSITY = 1;
const DEFAULT_AMBIENT_LIGHT_Z = 420;
const DEFAULT_MODE: ShadowMode = "multi";
const DEFAULT_MAX_SHADOWS = 3;
const DEFAULT_UPDATE_HZ = 60;
const DEFAULT_SCAN_HZ = 8;
const DEFAULT_MIN_INFLUENCE = 0;
const DEFAULT_FALLOFF_POWER = 2;
const DEFAULT_SHADOW_COLOR = 0x0a0c16;
const DEFAULT_OPACITY = 0.5;
/** Default longest shadow, relative to the caster `height`. */
const DEFAULT_MAX_LENGTH_RATIO = 1.5;
const DEFAULT_CASTER: ResolvedCaster = {
  height: 72,
  footOffset: { x: 0, y: 0 },
  footAnchor: { x: 0.5, y: 1 },
  alpha: 1,
  blur: 3.5,
  gradientPower: 2,
  hardness: 0.42,
  minLength: 10,
  maxLength: 280,
  contactAlpha: 0.7,
  contactScale: 0.34,
  perspective: 0.7,
  silhouette: true,
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
  const perspective = Number(resolveReactiveValue(source.perspective));
  const silhouette = resolveReactiveValue(source.silhouette);

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
      : (isFiniteNumber(height) ? Math.max(2, height) : DEFAULT_CASTER.height) * DEFAULT_MAX_LENGTH_RATIO,
    contactAlpha: isFiniteNumber(contactAlpha)
      ? clamp(contactAlpha, 0, 1)
      : DEFAULT_CASTER.contactAlpha,
    contactScale: isFiniteNumber(contactScale)
      ? Math.max(0.05, contactScale)
      : DEFAULT_CASTER.contactScale,
    anchorX: isFiniteNumber(anchorX) ? clamp(anchorX, 0, 1) : undefined,
    perspective: isFiniteNumber(perspective) ? clamp(perspective, 0.2, 1) : DEFAULT_CASTER.perspective,
    silhouette: silhouette !== false,
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
      key: `light:${i}`,
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

const resolveAmbientLight = (
  source: ReactiveValue<AmbientShadowLightInput | AmbientShadowLight | null> | undefined
): ResolvedAmbientLight | null => {
  const raw = resolveReactiveValue(source);
  if (!raw) return null;

  const enabled = resolveReactiveValue((raw as AmbientShadowLightInput).enabled);
  if (enabled === false) return null;

  const x = Number(resolveReactiveValue((raw as AmbientShadowLightInput).x));
  const y = Number(resolveReactiveValue((raw as AmbientShadowLightInput).y));
  const norm = Math.hypot(x, y);
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || norm <= 0.0001) return null;

  const z = Number(resolveReactiveValue((raw as AmbientShadowLightInput).z));
  const intensity = Number(resolveReactiveValue((raw as AmbientShadowLightInput).intensity));
  const shadowWeight = Number(resolveReactiveValue((raw as AmbientShadowLightInput).shadowWeight));
  const length = Number(resolveReactiveValue((raw as AmbientShadowLightInput).length));

  return {
    dirX: -x / norm,
    dirY: -y / norm,
    z: isFiniteNumber(z) ? Math.max(2, z) : DEFAULT_AMBIENT_LIGHT_Z,
    intensity: isFiniteNumber(intensity) ? clamp(intensity, 0, 2) : 0.28,
    shadowWeight: isFiniteNumber(shadowWeight) ? clamp(shadowWeight, 0, 4) : 1,
    length: isFiniteNumber(length) ? Math.max(0, length) : undefined,
  };
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
    key: "blend",
    dirX: weightedDirX / norm,
    dirY: weightedDirY / norm,
    length: weightedLength / weightTotal,
    influence: clamp(weightTotal / picked.length, 0, 2),
  };
};

const destroySlot = (slot: ShadowSlot) => {
  slot.sprite.destroy();
};

const hideManagedShadow = (managed: ManagedShadow) => {
  managed.contact.visible = false;
  for (const slot of managed.slots.values()) {
    slot.sprite.visible = false;
    slot.alpha = 0;
  }
};

const destroyManagedShadow = (managed: ManagedShadow) => {
  managed.contact.destroy();
  for (const slot of managed.slots.values()) destroySlot(slot);
  managed.slots.clear();
};

const getCullBounds = (target: any): BoundsLike | null => {
  if (!target) return null;
  if (typeof target.getVisibleBounds === "function") {
    const bounds = target.getVisibleBounds();
    if (
      bounds &&
      isFiniteNumber(bounds.x) &&
      isFiniteNumber(bounds.y) &&
      isFiniteNumber(bounds.width) &&
      isFiniteNumber(bounds.height)
    ) {
      return bounds;
    }
  }
  if (typeof target.getLocalBounds === "function") {
    const bounds = target.getLocalBounds();
    if (
      bounds &&
      isFiniteNumber(bounds.x) &&
      isFiniteNumber(bounds.y) &&
      isFiniteNumber(bounds.width) &&
      isFiniteNumber(bounds.height)
    ) {
      return bounds;
    }
  }
  if (isFiniteNumber(target.width) && isFiniteNumber(target.height)) {
    return { x: 0, y: 0, width: target.width, height: target.height };
  }
  return null;
};

const boundsIntersects = (a: BoundsLike, b: BoundsLike): boolean =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

const expandBounds = (bounds: BoundsLike, padding: number): BoundsLike => ({
  x: bounds.x - padding,
  y: bounds.y - padding,
  width: bounds.width + padding * 2,
  height: bounds.height + padding * 2,
});

const getCasterBoundsInSpace = (
  caster: any,
  space: any
): BoundsLike | null => {
  const bounds = typeof caster?.getBounds === "function" ? caster.getBounds() : null;
  if (
    !bounds ||
    !isFiniteNumber(bounds.x) ||
    !isFiniteNumber(bounds.y) ||
    !isFiniteNumber(bounds.width) ||
    !isFiniteNumber(bounds.height) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return null;
  }

  const topLeft = toLocalPoint(space, { x: bounds.x, y: bounds.y });
  const bottomRight = toLocalPoint(space, {
    x: bounds.x + bounds.width,
    y: bounds.y + bounds.height,
  });
  const minX = Math.min(topLeft.x, bottomRight.x);
  const minY = Math.min(topLeft.y, bottomRight.y);
  const maxX = Math.max(topLeft.x, bottomRight.x);
  const maxY = Math.max(topLeft.y, bottomRight.y);

  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
};

const markManaged = <T extends PixiSprite>(sprite: T, shadowColor: number): T => {
  sprite.tint = shadowColor;
  // Shadow bodies are opaque inside their layer, so overlaps merge instead of darkening;
  // the layer opacity is applied once on the merged result.
  sprite.eventMode = "none";
  sprite.visible = false;
  (sprite as any)[SHADOW_MANAGED_MARK] = true;
  return sprite;
};

const createShadowLayer = (parent: PixiContainer): ShadowLayer => {
  const layer = new PixiContainer();
  const filter = new AlphaFilter({ alpha: DEFAULT_OPACITY });
  layer.filters = [filter];
  layer.eventMode = "none";
  (layer as any)[SHADOW_MANAGED_MARK] = true;
  parent.addChild(layer);
  return { layer, filter };
};

const createManagedShadow = (
  caster: any,
  parent: PixiContainer,
  layer: PixiContainer,
  shadowColor: number
): ManagedShadow => {
  const contact = markManaged(new PixiSprite(getContactShadowTexture()), shadowColor);
  contact.anchor.set(0.5);
  layer.addChild(contact);
  return {
    caster,
    parent,
    layer,
    contact,
    slots: new Map(),
    silhouette: null,
    silhouetteKey: "",
    foot: { x: 0, y: 0 },
  };
};

const createSlot = (managed: ManagedShadow, shadowColor: number): ShadowSlot => {
  const sprite = markManaged(new PixiSprite(Texture.EMPTY), shadowColor);
  managed.layer.addChild(sprite);
  return { sprite, dirX: 0, dirY: 1, length: 0, alpha: 0, targetAlpha: 0, initialized: false };
};

/**
 * Reads the caster pixels once per texture frame (sprites) or per size (other display objects)
 * and turns them into a shadow texture. Falls back to a soft blob without a renderer.
 */
const resolveSilhouette = (
  managed: ManagedShadow,
  config: ResolvedCaster,
  renderer: any
): ShadowSilhouette | null => {
  const caster = managed.caster;
  const texture: Texture | undefined = caster.texture;
  const isSprite = !!texture && !!caster.anchor && !(caster.children?.length > 0);
  let rect: BoundsLike;
  let key: string;
  let read: () => any;

  if (isSprite) {
    if (texture === Texture.EMPTY || !texture.width) return null;
    const width = texture.orig?.width ?? texture.width;
    const height = texture.orig?.height ?? texture.height;
    const anchorX = config.anchorX ?? caster.anchor.x;
    rect = { x: -anchorX * width, y: -caster.anchor.y * height, width, height };
    key = `tex:${(texture as any).uid}`;
    read = () => renderer.extract.canvas(texture);
  } else {
    const bounds = typeof caster.getLocalBounds === "function" ? caster.getLocalBounds() : null;
    if (!bounds || !(bounds.width > 0) || !(bounds.height > 0)) return null;
    rect = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
    key = `obj:${caster.uid}:${Math.round(rect.width)}x${Math.round(rect.height)}`;
    read = () => renderer.extract.canvas(caster);
  }

  const foot = {
    x: rect.x + config.footAnchor.x * rect.width + config.footOffset.x,
    y: rect.y + config.footAnchor.y * rect.height + config.footOffset.y,
  };
  managed.foot = foot;
  const fullKey = `${key}|${config.silhouette}|${foot.x}|${foot.y}|${config.blur}|${config.hardness}|${config.gradientPower}`;
  if (managed.silhouetteKey === fullKey && managed.silhouette && !managed.silhouette.texture.destroyed) {
    return managed.silhouette;
  }

  let silhouette: ShadowSilhouette | null = null;
  if (config.silhouette && renderer?.extract?.canvas) {
    try {
      const canvas = read();
      if (canvas && canvas.width > 0) {
        silhouette = bakeSilhouette(key, canvas as HTMLCanvasElement, rect, {
          blur: config.blur * 2.2,
          hardness: config.hardness,
          gradientPower: config.gradientPower,
          foot,
        });
      }
    } catch {
      silhouette = null;
    }
  }
  if (!silhouette) silhouette = getBlobSilhouette(rect);

  managed.silhouette = silhouette;
  managed.silhouetteKey = fullKey;
  return silhouette;
};

const shadowMatrix = new Matrix();

/**
 * Lays the silhouette on the ground: its height follows the shadow direction
 * (foreshortened by `perspective`) and its width stays perpendicular to it.
 * Exported for custom shadow rendering and tests.
 */
export const applyShadowTransform = (
  sprite: PixiSprite,
  silhouette: ShadowSilhouette,
  footX: number,
  footY: number,
  pxToParentX: number,
  dirX: number,
  dirY: number,
  length: number,
  perspective: number
) => {
  if (sprite.texture !== silhouette.texture) sprite.texture = silhouette.texture;
  const textureWidth = silhouette.texture.width || 1;
  const textureHeight = silhouette.texture.height || 1;
  sprite.anchor.set(silhouette.footX / textureWidth, silhouette.footY / textureHeight);

  // Shadow direction on the ground plane
  let groundX = dirX;
  let groundY = dirY / perspective;
  const norm = Math.hypot(groundX, groundY) || 1;
  groundX /= norm;
  groundY /= norm;

  // Silhouette height -> along the shadow, back to screen space
  const upX = groundX * length;
  const upY = groundY * length * perspective;

  // Silhouette width -> screen X made perpendicular to the shadow on the ground.
  // It naturally narrows when the light comes from the side (thin shadow).
  const side = groundY >= 0 ? 1 : -1;
  const widthScale = Math.max(Math.abs(groundY), 0.3);
  const widthX = groundY * side * widthScale;
  const widthY = -groundX * side * widthScale * perspective;

  shadowMatrix.set(
    widthX * pxToParentX,
    widthY * pxToParentX,
    -upX / silhouette.heightPx,
    -upY / silhouette.heightPx,
    footX,
    footY
  );
  sprite.setFromMatrix(shadowMatrix);
};

const updateManagedShadow = (
  managed: ManagedShadow,
  casterConfig: ResolvedCaster,
  lights: ResolvedLight[],
  ambientLight: ResolvedAmbientLight | null,
  minInfluence: number,
  falloffPower: number,
  mode: ShadowMode,
  maxShadows: number,
  shadowColor: number,
  renderer: any
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

  const silhouette = resolveSilhouette(managed, casterConfig, renderer);
  if (!silhouette) {
    hideManagedShadow(managed);
    return;
  }

  const footGlobal = toGlobalPoint(caster, managed.foot);
  const footLocal = toLocalPoint(parent, footGlobal);
  // Caster scale as seen from the parent (keeps horizontal flips)
  const unitX = toLocalPoint(parent, toGlobalPoint(caster, { x: managed.foot.x + 1, y: managed.foot.y }));
  const pxToParentX = silhouette.localPerPx * (unitX.x - footLocal.x || 1);
  const perspective = casterConfig.perspective;
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
    const falloff = Math.pow(clamp(1 - distance / light.radius, 0, 1), falloffPower);
    const zWeight = clamp(DEFAULT_LIGHT_Z / Math.max(12, light.z), 0.35, 2.4);
    const influence = clamp(falloff * light.intensity * light.shadowWeight * zWeight, 0, 2.2);
    if (influence <= 0.001) continue;

    const groundDistance = Math.hypot(dx, dy / perspective);
    const directionNorm = distance > 0.0001 ? distance : 1;
    candidates.push({
      key: light.key,
      dirX: distance > 0.0001 ? dx / directionNorm : 0,
      dirY: distance > 0.0001 ? dy / directionNorm : 1,
      influence,
      length: clamp(
        (groundDistance * casterConfig.height) / Math.max(14, light.z),
        casterConfig.minLength,
        casterConfig.maxLength
      ),
    });
  }

  if (ambientLight && ambientLight.intensity > 0.001 && ambientLight.shadowWeight > 0.001) {
    const ambientLength =
      ambientLight.length ??
      (casterConfig.height * DEFAULT_LIGHT_Z) / Math.max(14, ambientLight.z);
    const ambientInfluence = clamp(
      Math.max(minInfluence, ambientLight.intensity * ambientLight.shadowWeight),
      0,
      2.2
    );
    if (ambientInfluence > 0.001) {
      candidates.push({
        key: "ambient",
        dirX: ambientLight.dirX,
        dirY: ambientLight.dirY,
        influence: ambientInfluence,
        length: clamp(ambientLength, casterConfig.minLength, casterConfig.maxLength),
      });
    }
  }

  candidates.sort((a, b) => b.influence - a.influence);
  let picked: LightCandidate[];
  if (mode === "blend2") {
    const blended = blendCandidates([...candidates], "blend2");
    picked = blended ? [blended] : [];
  } else if (mode === "strongest") {
    picked = candidates.slice(0, 1);
  } else {
    picked = candidates.slice(0, Math.max(1, maxShadows));
  }

  const strongest = picked[0]?.influence ?? 0;
  // Set by GroundEffects: shadows fade on water and in tall grass.
  const groundFactor = isFiniteNumber(caster.__groundShadowFactor) ? caster.__groundShadowFactor : 1;
  for (const slot of managed.slots.values()) slot.targetAlpha = 0;

  for (let i = 0; i < picked.length; i++) {
    const candidate = picked[i];
    let slot = managed.slots.get(candidate.key);
    if (!slot) {
      slot = createSlot(managed, shadowColor);
      managed.slots.set(candidate.key, slot);
    }
    if (!slot.initialized) {
      slot.dirX = candidate.dirX;
      slot.dirY = candidate.dirY;
      slot.length = candidate.length;
      slot.initialized = true;
    } else {
      const smoothDirX = slot.dirX + (candidate.dirX - slot.dirX) * 0.35;
      const smoothDirY = slot.dirY + (candidate.dirY - slot.dirY) * 0.35;
      const smoothNorm = Math.hypot(smoothDirX, smoothDirY);
      slot.dirX = smoothNorm > 0.0001 ? smoothDirX / smoothNorm : candidate.dirX;
      slot.dirY = smoothNorm > 0.0001 ? smoothDirY / smoothNorm : candidate.dirY;
      slot.length += (candidate.length - slot.length) * 0.35;
    }
    // Secondary lights cast lighter shadows; very close lights give crisp dark ones.
    const share = strongest > 0 ? candidate.influence / strongest : 1;
    // Square root keeps shadows readable away from the light, while still fading out.
    const visual = clamp(Math.sqrt(candidate.influence), 0.2, 1);
    slot.targetAlpha = clamp(
      casterConfig.alpha * groundFactor * visual * (i === 0 ? 1 : 0.35 + share * 0.5),
      0,
      1
    );
  }

  for (const [key, slot] of managed.slots) {
    slot.alpha += (slot.targetAlpha - slot.alpha) * 0.25;
    if (slot.targetAlpha === 0 && slot.alpha < 0.01) {
      destroySlot(slot);
      managed.slots.delete(key);
      continue;
    }
    slot.sprite.tint = shadowColor;
    slot.sprite.alpha = slot.alpha;
    slot.sprite.visible = true;
    applyShadowTransform(
      slot.sprite,
      silhouette,
      footLocal.x,
      footLocal.y,
      pxToParentX,
      slot.dirX,
      slot.dirY,
      slot.length,
      perspective
    );
  }

  // Contact shadow: soft occlusion right under the feet.
  const casterWidth = silhouette.texture.width * Math.abs(pxToParentX);
  const contactWidth = Math.max(6, casterWidth * clamp(casterConfig.contactScale * 1.7, 0.2, 1.2));
  const textureWidth = managed.contact.texture.width || 128;
  const textureHeight = managed.contact.texture.height || 64;
  managed.contact.tint = shadowColor;
  managed.contact.position.set(footLocal.x, footLocal.y);
  managed.contact.scale.set(contactWidth / textureWidth, (contactWidth * 0.34 * perspective / 0.7) / textureHeight);
  managed.contact.alpha = clamp(casterConfig.contactAlpha * groundFactor, 0, 1);
  managed.contact.visible = managed.contact.alpha > 0.001;
};

const resolveRenderer = (context: any): any => {
  const appSignal = context?.app;
  if (typeof appSignal === "function") {
    try {
      const app = appSignal();
      if (app?.renderer?.extract) return app.renderer;
    } catch {
      // Use the global renderer below.
    }
  }
  const globalRenderer = (globalThis as any).__PIXI_RENDERER__;
  return globalRenderer?.extract ? globalRenderer : null;
};

/**
 * SpriteShadows preset
 *
 * Adds RPG-style ground shadows for sprites tagged with `shadowCaster`.
 * The real silhouette of each sprite is projected on the ground, away from each nearby light,
 * with a penumbra that softens toward the tip and a contact shadow under the feet.
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

    const renderer = resolveRenderer(context);
    const managedByCaster = new Map<any, ManagedShadow>();
    const layersByParent = new Map<PixiContainer, ShadowLayer>();
    const layerFor = (parent: PixiContainer): ShadowLayer => {
      let entry = layersByParent.get(parent);
      if (!entry || entry.layer.destroyed) {
        entry = createShadowLayer(parent);
        layersByParent.set(parent, entry);
      }
      return entry;
    };
    let cachedCasters: Array<{ instance: any; caster: ResolvedCaster }> = [];
    let accumulatorMs = 0;
    let scanAccumulatorMs = 0;
    let forceRefresh = true;
    let forceScan = true;
    let tickSubscription: any = null;

    const sync = () => {
      const shadowColor = parseColorToNumber(
        resolveReactiveValue(props.shadowColor as ReactiveValue<ColorInput> | undefined)
      );
      const modeRaw = resolveReactiveValue(props.mode as ReactiveValue<ShadowMode> | undefined);
      const mode: ShadowMode =
        modeRaw === "blend2" || modeRaw === "strongest" || modeRaw === "multi" ? modeRaw : DEFAULT_MODE;
      const maxShadowsRaw = Number(
        resolveReactiveValue(props.maxShadows as ReactiveValue<number> | undefined)
      );
      const maxShadows = isFiniteNumber(maxShadowsRaw)
        ? clamp(Math.round(maxShadowsRaw), 1, 8)
        : DEFAULT_MAX_SHADOWS;
      const lights = resolveLights(lightsSource(), target);
      const ambientLight = resolveAmbientLight(
        props.ambientLight as
          | ReactiveValue<AmbientShadowLightInput | AmbientShadowLight | null>
          | undefined
      );
      const minInfluenceRaw = Number(
        resolveReactiveValue(props.minInfluence as ReactiveValue<number> | undefined)
      );
      const minInfluence = isFiniteNumber(minInfluenceRaw)
        ? clamp(minInfluenceRaw, 0, 1.5)
        : DEFAULT_MIN_INFLUENCE;
      const falloffPowerRaw = Number(
        resolveReactiveValue(props.falloffPower as ReactiveValue<number> | undefined)
      );
      const falloffPower = isFiniteNumber(falloffPowerRaw)
        ? clamp(falloffPowerRaw, 0.25, 6)
        : DEFAULT_FALLOFF_POWER;
      const cullToViewport =
        resolveReactiveValue(props.cullToViewport as ReactiveValue<boolean> | undefined) === true;
      const cullBounds = cullToViewport ? getCullBounds(target) : null;

      if (forceScan) {
        cachedCasters = collectShadowCasters(target);
        forceScan = false;
      }

      const casters = cachedCasters;
      const activeCasters = new Set<any>();

      for (let i = 0; i < casters.length; i++) {
        const { instance: casterInstance, caster } = casters[i];
        if (!casterInstance || !casterInstance.parent || casterInstance.destroyed) continue;
        activeCasters.add(casterInstance);

        let managed = managedByCaster.get(casterInstance);
        if (!managed || managed.parent !== casterInstance.parent) {
          if (managed) destroyManagedShadow(managed);
          const { layer } = layerFor(casterInstance.parent);
          managed = createManagedShadow(casterInstance, casterInstance.parent, layer, shadowColor);
          managedByCaster.set(casterInstance, managed);
        }

        if (cullBounds) {
          const casterBounds = getCasterBoundsInSpace(casterInstance, target);
          const cullPadding = Math.max(caster.maxLength, caster.blur * 8, 16);
          if (!casterBounds || !boundsIntersects(expandBounds(casterBounds, cullPadding), cullBounds)) {
            hideManagedShadow(managed);
            continue;
          }
        }

        updateManagedShadow(
          managed,
          caster,
          lights,
          ambientLight,
          minInfluence,
          falloffPower,
          mode,
          maxShadows,
          shadowColor,
          renderer
        );
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

      // Each shadow layer sits on the ground: just below the lowest caster of its parent.
      const opacityRaw = Number(resolveReactiveValue(props.opacity as ReactiveValue<number> | undefined));
      const opacity = isFiniteNumber(opacityRaw) ? clamp(opacityRaw, 0, 1) : DEFAULT_OPACITY;
      const layerZRaw = Number(resolveReactiveValue(props.layerZIndex as ReactiveValue<number> | undefined));
      for (const [parent, entry] of layersByParent) {
        if (parent.destroyed || entry.layer.destroyed) {
          layersByParent.delete(parent);
          continue;
        }
        entry.filter.alpha = opacity;
        let lowestZ = Infinity;
        let lowestIndex = Infinity;
        for (const managed of managedByCaster.values()) {
          if (managed.parent !== parent) continue;
          const z = isFiniteNumber(managed.caster.zIndex) ? managed.caster.zIndex : 0;
          lowestZ = Math.min(lowestZ, z);
          const index = parent.children.indexOf(managed.caster);
          if (index >= 0) lowestIndex = Math.min(lowestIndex, index);
        }
        entry.layer.zIndex = isFiniteNumber(layerZRaw) ? layerZRaw : (lowestZ === Infinity ? 0 : lowestZ - 0.5);
        if (!(parent as any).sortableChildren && lowestIndex !== Infinity) {
          const layerIndex = parent.children.indexOf(entry.layer);
          if (layerIndex > lowestIndex) parent.setChildIndex(entry.layer, lowestIndex);
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
      const scanHzRaw = Number(
        resolveReactiveValue(props.scanHz as ReactiveValue<number> | undefined)
      );
      const scanHz = clamp(
        isFiniteNumber(scanHzRaw) ? scanHzRaw : DEFAULT_SCAN_HZ,
        1,
        60
      );
      const intervalMs = 1000 / updateHz;
      const scanIntervalMs = 1000 / scanHz;
      accumulatorMs += frameMs;
      scanAccumulatorMs += frameMs;

      if (scanAccumulatorMs >= scanIntervalMs) {
        scanAccumulatorMs = 0;
        forceScan = true;
      }

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
      for (const entry of layersByParent.values()) entry.layer.destroy({ children: true });
      layersByParent.clear();
    };
  });

  return h(Container);
}
