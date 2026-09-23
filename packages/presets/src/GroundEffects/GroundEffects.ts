import { Container, h, mount, useProps } from "canvasengine";
import { Container as PixiContainer, Filter, Sprite as PixiSprite } from "pixi.js";
import vertexShader from "../shaders/defaultFilter.vert.glsl?raw";
import { getGrassTuftTexture, getPuffTexture, getRippleTexture } from "./textures";

type ReactiveValue<T> = T | (() => T);
type ColorInput = string | number;

export type GroundMode = "none" | "water" | "grass" | "sink";

export type GroundSurfaceProfile = {
  /** How the lower body blends with the ground. */
  mode?: GroundMode;
  /** Fraction of the sprite height hidden (water depth, grass height, snow sink). */
  submerge?: number;
  /** For water: submersion at depth `1`. `submerge` is used at depth `0`. */
  deepSubmerge?: number;
  /** Water color mixed into the submerged part. */
  tint?: ColorInput;
  tintStrength?: number;
  /** Ripple rings around the body in water. */
  ripples?: boolean;
  /** Small splashes / puffs when walking. */
  puffs?: boolean;
  puffColor?: ColorInput;
  /** Grass blades drawn in front of the legs. */
  tuft?: boolean;
  tuftColor?: ColorInput;
  /** Multiplies SpriteShadows on this surface (shadows vanish on water). */
  shadow?: number;
};

export type GroundCasterOptions = {
  enabled?: ReactiveValue<boolean>;
  /** Surface name under the sprite, usually from a surface sampler or zones. */
  surface?: ReactiveValue<string>;
  /** Water depth `0..1` (shore to open water). */
  depth?: ReactiveValue<number>;
  /** Ground color under the sprite: tints grass tufts and dust to match the map. */
  groundColor?: ReactiveValue<ColorInput | undefined>;
  /** Feet position inside the sprite bounds. Default: `{ x: 0.5, y: 1 }` */
  footAnchor?: ReactiveValue<{ x: number; y: number }>;
};

export type GroundEffectsProps = {
  /** Custom or overridden surface profiles. */
  surfaces?: ReactiveValue<Record<string, GroundSurfaceProfile>>;
  /** How often the scene is scanned for new casters (per second). Default: `4` */
  scanHz?: ReactiveValue<number>;
};

export const GROUND_SURFACES: Record<string, GroundSurfaceProfile> = {
  water: {
    mode: "water",
    submerge: 0.12,
    deepSubmerge: 0.6,
    tint: "#1f8fb3",
    tintStrength: 0.55,
    ripples: true,
    puffs: true,
    puffColor: "#e8fbff",
    shadow: 0.1,
  },
  shallow: {
    mode: "water",
    submerge: 0.14,
    deepSubmerge: 0.14,
    tint: "#4cc3d0",
    tintStrength: 0.4,
    ripples: true,
    puffs: true,
    puffColor: "#f2fdff",
    shadow: 0.3,
  },
  tallGrass: { mode: "grass", submerge: 0.32, tuft: true, tuftColor: "#5aa33a", shadow: 0.45 },
  grass: { mode: "grass", submerge: 0.07, tuft: false, shadow: 0.9 },
  sand: { mode: "none", puffs: true, puffColor: "#ead3a4", shadow: 1 },
  dirt: { mode: "none", puffs: true, puffColor: "#a88a62", shadow: 1 },
  snow: { mode: "sink", submerge: 0.07, puffs: true, puffColor: "#ffffff", shadow: 0.9 },
  mud: { mode: "sink", submerge: 0.05, puffs: false, shadow: 0.9 },
  ground: { mode: "none", shadow: 1 },
};

const MANAGED_MARK = "__groundEffectManaged";
const MODE_INDEX: Record<GroundMode, number> = { none: 0, water: 1, grass: 2, sink: 3 };

const fragmentShader = /* glsl */ `
  precision highp float;
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform highp vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform float uCutY;       // screen y of the water / grass line
  uniform float uDepthPx;    // submerged height in screen px
  uniform float uMode;       // 1 water, 2 grass, 3 sink
  uniform float uTime;
  uniform vec3  uTint;
  uniform float uTintStrength;
  uniform float uScale;      // screen px per world px

  float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

  void main() {
    vec2 screen = uOutputFrame.xy + vTextureCoord * uInputSize.xy;
    vec4 color = texture(uTexture, vTextureCoord);

    if (uMode < 0.5) { finalColor = color; return; }

    if (uMode < 1.5) {
      // Water: wavy surface line, submerged part wobbles, tints and fades with depth.
      float wave = sin(screen.x * 0.09 / uScale + uTime * 2.6) * 1.2 * uScale
                 + sin(screen.x * 0.21 / uScale - uTime * 3.4) * 0.6 * uScale;
      float below = screen.y - (uCutY + wave);
      if (below > 0.0) {
        vec2 offset = vec2(sin(screen.y * 0.18 / uScale + uTime * 4.0) * 1.3 * uScale * uInputSize.z, 0.0);
        vec4 under = texture(uTexture, vTextureCoord + offset);
        float fade = clamp(below / max(uDepthPx, 1.0), 0.0, 1.0);
        vec3 tinted = mix(under.rgb, uTint * under.a, uTintStrength);
        float visibility = mix(0.5, 0.0, smoothstep(0.0, 0.85, fade));
        color = vec4(tinted, under.a) * visibility;
      } else {
        // Wet foam line where the body meets the water
        float foam = 1.0 - smoothstep(0.0, 1.8 * uScale, -below);
        color.rgb = mix(color.rgb, vec3(color.a), foam * 0.55);
      }
    } else if (uMode < 2.5) {
      // Grass: blades of varying height hide the legs.
      float column = floor(screen.x / (3.0 * uScale));
      float blade = hash(column) * 0.55 + hash(column + 17.0) * 0.45;
      float sway = sin(uTime * 2.0 + column * 0.4) * 1.5 * uScale;
      float line = uCutY - blade * uDepthPx * 0.45 + sway * 0.3;
      float below = screen.y - line;
      color *= 1.0 - smoothstep(-1.0 * uScale, 1.0 * uScale, below);
    } else {
      // Sink (snow, mud): feet softly disappear into the ground.
      float below = screen.y - uCutY;
      color *= 1.0 - smoothstep(-uDepthPx * 0.35, uDepthPx * 0.35, below);
    }
    finalColor = color;
  }
`;

type ResolvedCaster = {
  surface: string;
  depth: number;
  groundColor?: number;
  footAnchor: { x: number; y: number };
};

type Ripple = { back: PixiSprite; front: PixiSprite; age: number; life: number; width: number };
type Puff = { sprite: PixiSprite; age: number; life: number; vx: number; vy: number; size: number };

type CasterState = {
  caster: any;
  filter: Filter;
  uniforms: any;
  submerge: number;
  shadow: number;
  lastX: number;
  lastY: number;
  speed: number;
  rippleTimer: number;
  stepDistance: number;
  tuft: PixiSprite;
  tuftAmount: number;
  rustle: number;
  ripples: Ripple[];
  puffs: Puff[];
};

const read = <T>(value: ReactiveValue<T> | undefined): T | undefined =>
  typeof value === "function" ? (value as () => T)() : value;

const toColor = (value: ColorInput | undefined, fallback: number) => {
  if (value === undefined) return fallback;
  if (typeof value === "number") return value;
  const parsed = parseInt(value.replace("#", ""), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toRgb = (color: number) => [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255];

const mixColor = (a: number, b: number, t: number) => {
  const mix = (shift: number) => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
};

const resolveCaster = (instance: any): ResolvedCaster | null => {
  const element = typeof instance.getElement === "function" ? instance.getElement() : null;
  const raw = read(instance.fullProps?.groundCaster) ?? read(element?.props?.groundCaster);
  if (!raw) return null;
  const options: GroundCasterOptions = raw === true ? {} : raw;
  if (read(options.enabled) === false) return null;
  const groundColor = read(options.groundColor);
  return {
    surface: read(options.surface) ?? "ground",
    depth: Math.max(0, Math.min(1, Number(read(options.depth)) || 0)),
    groundColor: groundColor === undefined ? undefined : toColor(groundColor, 0x888888),
    footAnchor: read(options.footAnchor) ?? { x: 0.5, y: 1 },
  };
};

const collectCasters = (root: any) => {
  const found: any[] = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    for (const child of node?.children ?? []) {
      if (!child || child[MANAGED_MARK] || child.__spriteShadowManaged) continue;
      if (resolveCaster(child)) found.push(child);
      if (child.children?.length) stack.push(child);
    }
  }
  return found;
};

const managedSprite = (texture: any, anchorX: number, anchorY: number) => {
  const sprite = new PixiSprite(texture);
  sprite.anchor.set(anchorX, anchorY);
  sprite.eventMode = "none";
  sprite.visible = false;
  (sprite as any)[MANAGED_MARK] = true;
  return sprite;
};

/**
 * Makes sprites sit *in* their terrain instead of on top of it:
 * - `water`: the lower body sinks under a wavy waterline, wobbles and takes the water color,
 *   ripples spread around the body and splashes appear when walking; deeper water hides more;
 * - `tallGrass`: legs disappear behind uneven blades and a grass tuft sways in front,
 *   rustling when the character moves;
 * - `sand`, `dirt`, `snow`: dust or powder puffs at each step, feet slightly sink in snow.
 *
 * Tag sprites with `groundCaster={{ surface, depth }}`; pair it with `createSurfaceSampler()`
 * to read the surface straight from the map image. Works with `SpriteShadows` (shadows fade on water).
 */
export function GroundEffects(options: GroundEffectsProps = {}) {
  const props = useProps(options);

  mount((element) => {
    const context = element.props.context;
    const root: any = context?.viewport ?? element.parent?.componentInstance;
    const tick = context?.tick;
    if (!root || !tick?.observable) return;

    const states = new Map<any, CasterState>();
    let casters: any[] = [];
    let scanTimer = 0;
    let time = 0;

    const profileFor = (surface: string): GroundSurfaceProfile => {
      const custom = read(props.surfaces as ReactiveValue<Record<string, GroundSurfaceProfile>> | undefined);
      return { ...(GROUND_SURFACES[surface] ?? GROUND_SURFACES.ground), ...(custom?.[surface] ?? {}) };
    };

    const createState = (caster: any): CasterState => {
      const filter = Filter.from({
        gl: { vertex: vertexShader, fragment: fragmentShader },
        resources: {
          groundUniforms: {
            uCutY: { value: 0, type: "f32" },
            uDepthPx: { value: 1, type: "f32" },
            uMode: { value: 0, type: "f32" },
            uTime: { value: 0, type: "f32" },
            uTint: { value: new Float32Array([0.1, 0.5, 0.7]), type: "vec3<f32>" },
            uTintStrength: { value: 0.5, type: "f32" },
            uScale: { value: 1, type: "f32" },
          },
        },
      });
      filter.padding = 4;
      const tuft = managedSprite(getGrassTuftTexture(), 0.5, 1);
      return {
        caster,
        filter,
        uniforms: (filter as any).resources.groundUniforms.uniforms,
        submerge: 0,
        shadow: 1,
        lastX: caster.x,
        lastY: caster.y,
        speed: 0,
        rippleTimer: 0,
        stepDistance: 0,
        tuft,
        tuftAmount: 0,
        rustle: 0,
        ripples: [],
        puffs: [],
      };
    };

    const setFilter = (state: CasterState, active: boolean) => {
      const caster = state.caster;
      const filters: any[] = Array.isArray(caster.filters) ? caster.filters : caster.filters ? [caster.filters] : [];
      const has = filters.includes(state.filter);
      if (active && !has) caster.filters = [...filters, state.filter];
      if (!active && has) {
        const next = filters.filter((filter) => filter !== state.filter);
        caster.filters = next.length ? next : null;
      }
    };

    const destroyState = (state: CasterState) => {
      if (!state.caster.destroyed) setFilter(state, false);
      state.tuft.destroy();
      state.ripples.forEach((ripple) => {
        ripple.back.destroy();
        ripple.front.destroy();
      });
      state.puffs.forEach((puff) => puff.sprite.destroy());
      state.caster.__groundShadowFactor = undefined;
    };

    const spawnRipple = (state: CasterState, x: number, y: number, width: number, strength: number) => {
      const parent = state.caster.parent;
      if (!parent) return;
      const back = managedSprite(getRippleTexture("back"), 0.5, 1);
      const front = managedSprite(getRippleTexture("front"), 0.5, 0);
      back.position.set(x, y);
      front.position.set(x, y);
      parent.addChild(back);
      parent.addChild(front);
      state.ripples.push({ back, front, age: 0, life: 1.6 + strength * 0.6, width });
    };

    const spawnPuff = (state: CasterState, x: number, y: number, color: number, size: number) => {
      const parent = state.caster.parent;
      if (!parent) return;
      const sprite = managedSprite(getPuffTexture(), 0.5, 0.5);
      sprite.tint = color;
      sprite.position.set(x, y);
      parent.addChild(sprite);
      state.puffs.push({
        sprite,
        age: 0,
        life: 0.45 + Math.random() * 0.25,
        vx: (Math.random() - 0.5) * 30,
        vy: -12 - Math.random() * 18,
        size,
      });
    };

    const update = (seconds: number) => {
      time += seconds;
      for (const state of states.values()) {
        const caster = state.caster;
        const config = resolveCaster(caster);
        if (!config || caster.destroyed || !caster.parent) continue;
        const profile = profileFor(config.surface);
        const mode = profile.mode ?? "none";
        const z = Number.isFinite(caster.zIndex) ? caster.zIndex : 0;

        // Movement
        const dx = caster.x - state.lastX;
        const dy = caster.y - state.lastY;
        const moved = Math.hypot(dx, dy);
        state.lastX = caster.x;
        state.lastY = caster.y;
        const instantSpeed = seconds > 0 ? moved / seconds : 0;
        state.speed += (instantSpeed - state.speed) * Math.min(1, seconds * 8);
        const moving = state.speed > 12;

        // Smoothly sink into / rise out of the terrain
        const baseSubmerge = profile.submerge ?? 0;
        const targetSubmerge =
          mode === "none"
            ? 0
            : mode === "water"
              ? baseSubmerge + ((profile.deepSubmerge ?? baseSubmerge) - baseSubmerge) * config.depth
              : baseSubmerge;
        state.submerge += (targetSubmerge - state.submerge) * Math.min(1, seconds * 5);
        state.shadow += ((profile.shadow ?? 1) - state.shadow) * Math.min(1, seconds * 5);
        caster.__groundShadowFactor = state.shadow;

        // Sprite geometry in screen space
        const bounds = caster.getLocalBounds?.();
        if (!bounds || bounds.height <= 0) continue;
        const footLocal = {
          x: bounds.x + config.footAnchor.x * bounds.width,
          y: bounds.y + config.footAnchor.y * bounds.height,
        };
        const localHeight = bounds.height;
        const cutLocalY = footLocal.y - state.submerge * localHeight;
        const cutGlobal = caster.toGlobal({ x: footLocal.x, y: cutLocalY });
        const footGlobal = caster.toGlobal(footLocal);
        const scale = Math.abs(caster.worldTransform?.d ?? 1) || 1;
        const active = state.submerge > 0.005 && mode !== "none";
        setFilter(state, active);
        if (active) {
          state.uniforms.uCutY = cutGlobal.y;
          state.uniforms.uDepthPx = Math.max(1, footGlobal.y - cutGlobal.y);
          state.uniforms.uMode = MODE_INDEX[mode];
          state.uniforms.uTime = time;
          state.uniforms.uScale = scale;
          state.uniforms.uTintStrength = profile.tintStrength ?? 0.5;
          const tint = toRgb(toColor(profile.tint, 0x1f8fb3));
          state.uniforms.uTint[0] = tint[0];
          state.uniforms.uTint[1] = tint[1];
          state.uniforms.uTint[2] = tint[2];
        }

        // Positions in the caster parent space
        const parent = caster.parent as PixiContainer;
        const waterLine = parent.toLocal(cutGlobal);
        const feet = parent.toLocal(footGlobal);
        const bodyWidth = bounds.width * Math.abs(caster.scale?.x ?? 1);

        // Water ripples around the body
        if (mode === "water" && profile.ripples !== false && state.submerge > 0.03) {
          state.rippleTimer -= seconds;
          if (state.rippleTimer <= 0) {
            spawnRipple(state, waterLine.x, waterLine.y, bodyWidth * 0.75, state.submerge);
            state.rippleTimer = moving ? 0.35 : 1.1;
          }
        }

        // Grass tuft in front of the legs
        const wantTuft = mode === "grass" && profile.tuft === true;
        state.tuftAmount += ((wantTuft ? 1 : 0) - state.tuftAmount) * Math.min(1, seconds * 6);
        if (moving && wantTuft) state.rustle = Math.min(1, state.rustle + seconds * 4);
        state.rustle = Math.max(0, state.rustle - seconds * 1.5);
        if (state.tuftAmount > 0.02) {
          if (state.tuft.parent !== parent) parent.addChild(state.tuft);
          const tuftColor = config.groundColor ?? toColor(profile.tuftColor, 0x5aa33a);
          state.tuft.tint = mixColor(tuftColor, 0xffffff, 0.22);
          state.tuft.position.set(feet.x, feet.y + 2);
          const tuftHeight = state.submerge * localHeight * Math.abs(caster.scale?.y ?? 1) * 1.25;
          state.tuft.scale.set((bodyWidth * 1.35) / 128, tuftHeight / 64);
          state.tuft.skew.x = Math.sin(time * (2 + state.rustle * 8)) * (0.05 + state.rustle * 0.18);
          state.tuft.alpha = state.tuftAmount * 0.9;
          state.tuft.zIndex = z + 0.2;
          state.tuft.visible = true;
        } else {
          state.tuft.visible = false;
        }

        // Puffs at each step (dust, snow powder, water splashes)
        if (moving && profile.puffs) {
          state.stepDistance += moved;
          if (state.stepDistance > 22) {
            state.stepDistance = 0;
            const color =
              mode === "water"
                ? toColor(profile.puffColor, 0xffffff)
                : config.groundColor !== undefined
                  ? mixColor(config.groundColor, 0xffffff, 0.35)
                  : toColor(profile.puffColor, 0xdddddd);
            const puffY = mode === "water" ? waterLine.y : feet.y;
            for (let i = 0; i < (mode === "water" ? 4 : 2); i++) {
              spawnPuff(state, feet.x + (Math.random() - 0.5) * bodyWidth * 0.5, puffY, color, mode === "water" ? 0.22 : 0.45);
            }
          }
        }

        // Animate ripples
        for (let i = state.ripples.length - 1; i >= 0; i--) {
          const ripple = state.ripples[i];
          ripple.age += seconds;
          const t = ripple.age / ripple.life;
          if (t >= 1 || !ripple.back.parent) {
            ripple.back.destroy();
            ripple.front.destroy();
            state.ripples.splice(i, 1);
            continue;
          }
          const grow = 0.55 + t * 1.6;
          const width = (ripple.width * grow) / 128;
          const alpha = (1 - t) * (1 - t) * 0.95;
          for (const sprite of [ripple.back, ripple.front]) {
            sprite.scale.set(width, width);
            sprite.alpha = alpha;
            sprite.visible = true;
          }
          ripple.back.zIndex = z - 0.2;
          ripple.front.zIndex = z + 0.15;
        }

        // Animate puffs
        for (let i = state.puffs.length - 1; i >= 0; i--) {
          const puff = state.puffs[i];
          puff.age += seconds;
          const t = puff.age / puff.life;
          if (t >= 1) {
            puff.sprite.destroy();
            state.puffs.splice(i, 1);
            continue;
          }
          puff.sprite.x += puff.vx * seconds;
          puff.sprite.y += puff.vy * seconds;
          puff.vy += (mode === "water" ? 120 : 10) * seconds;
          puff.sprite.scale.set(puff.size * (0.6 + t * 0.9));
          puff.sprite.alpha = (1 - t) * 0.7;
          puff.sprite.zIndex = z + 0.1;
          puff.sprite.visible = true;
        }
      }
    };

    const scan = () => {
      casters = collectCasters(root);
      const alive = new Set(casters);
      for (const caster of casters) if (!states.has(caster)) states.set(caster, createState(caster));
      for (const [caster, state] of states) {
        if (!alive.has(caster) || caster.destroyed) {
          destroyState(state);
          states.delete(caster);
        }
      }
    };

    scan();
    const subscription = tick.observable.subscribe((tickArgs: any) => {
      const value = tickArgs?.value ?? tickArgs;
      const seconds = Math.min(0.1, (Number(value?.deltaTime) || 16.67) / 1000);
      scanTimer += seconds;
      const scanHz = Number(read(props.scanHz as ReactiveValue<number> | undefined)) || 4;
      if (scanTimer >= 1 / scanHz) {
        scanTimer = 0;
        scan();
      }
      update(seconds);
    });

    return () => {
      subscription.unsubscribe();
      for (const state of states.values()) destroyState(state);
      states.clear();
    };
  });

  return h(Container);
}
