import { Assets, Texture } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import { Container3D } from "@pixi/3d";
import {
  BoxShape,
  ConeShape,
  ParticleSystem3D,
  PointShape,
  SphereShape,
  type ParticleSystem3DOptions,
} from "@pixi/3d/extras";
import { Node3D, type Node3DProps } from "./Node3D";
import { isPlainObject } from "./utils";

export type ParticleShapeSpec =
  | { type: "point" }
  | { type: "cone"; angle?: number; radius?: number }
  | { type: "box"; width?: number; height?: number; depth?: number }
  | { type: "sphere"; radius?: number; shell?: boolean };

type Spread = number | [number, number];

export interface Particles3DProps extends Node3DProps {
  /** Image URL or Texture of one particle. Default: a soft white dot. */
  texture?: string | Texture;
  /** Most particles alive at once; about `emitRate` times the longest `life` */
  capacity?: number;
  /** Particles per second */
  emitRate?: number;
  /** Bursts: `[{ time, count, repeatEvery? }]`, times in seconds */
  bursts?: { time: number; count: number; repeatEvery?: number }[];
  /** Where particles start and which way they head. Default: a point, heading up. */
  shape?: ParticleShapeSpec | object;
  /** Lifetime in seconds: a number or `[min, max]` */
  life?: Spread;
  speed?: Spread;
  size?: Spread;
  sizeEnd?: Spread;
  alpha?: Spread;
  alphaEnd?: Spread;
  color?: number | string;
  colorEnd?: number | string;
  startRotation?: Spread;
  spin?: Spread;
  /** Acceleration: a number (down along Y) or `[x, y, z]` */
  gravity?: number | [number, number, number];
  /** Slows particles down over time */
  drag?: number;
  /** `"add"` for fire and sparks, `"normal"` for smoke */
  blendMode?: "normal" | "add" | "multiply" | "screen";
  /** `"spherical"` (default), `"cylindrical"` (upright, for flames) or `"horizontal"` (flat, for ripples) */
  billboard?: "spherical" | "cylindrical" | "horizontal";
  /** `"world"` (default: particles stay where they were born) or `"local"` (they follow the emitter) */
  space?: "world" | "local";
  /** Emits while `true` (default) */
  playing?: boolean;
  /** Called with the ParticleSystem3D once built, e.g. to call `spawn(count, overrides)` */
  onReady?: (system: ParticleSystem3D) => void;
  [option: string]: any;
}

/** Options a live system accepts as property writes; the others rebuild it. */
const LIVE_OPTIONS = ["emitRate", "gravity", "drag", "frameRate"];
const COMPONENT_OPTIONS = ["playing", "onReady", "position", "x", "y", "z", "rotation", "scale", "lookAt", "visible", "label"];

let defaultDot: Texture | null = null;

/** A soft white dot drawn on a canvas, shared by every system without a texture. */
function getDefaultDot(): Texture {
  if (defaultDot) return defaultDot;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  defaultDot = Texture.from(canvas);
  return defaultDot;
}

function buildShape(spec: any) {
  if (!isPlainObject(spec)) return spec;
  const { type, ...options } = spec;
  switch (type) {
    case "cone": return new ConeShape(options);
    case "box": return new BoxShape(options);
    case "sphere": return new SphereShape(options);
    default: return new PointShape();
  }
}

/**
 * Emits particles from its position. The component is a Container3D holding the
 * ParticleSystem3D, which is rebuilt when an option without a live setter changes.
 */
class CanvasParticles3D extends Node3D(Container3D) {
  system: ParticleSystem3D | null = null;
  #buildVersion = 0;

  applyProps3D(props: Particles3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    const keys = Object.keys(props).filter((key) => !COMPONENT_OPTIONS.includes(key));
    const system = this.system as any;
    if (initial || (keys.length && !system)) {
      this.#build();
    } else if (keys.length) {
      if (keys.every((key) => LIVE_OPTIONS.includes(key))) {
        for (const key of keys) system[key] = props[key];
      } else {
        this.#build();
      }
    }
    if (!initial && props.playing !== undefined) this.#applyPlaying();
  }

  async #build() {
    const version = ++this.#buildVersion;
    const { texture, shape, playing, onReady, ...rest } = this.fullProps as Particles3DProps;
    let particleTexture: Texture;
    if (typeof texture === "string") particleTexture = await Assets.load<Texture>(texture);
    else particleTexture = texture ?? getDefaultDot();
    if (version !== this.#buildVersion || this.destroyed) return;

    const options: Record<string, any> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (!COMPONENT_OPTIONS.includes(key)) options[key] = value;
    }
    this.#disposeSystem();
    this.system = new ParticleSystem3D({
      ...(options as ParticleSystem3DOptions),
      texture: particleTexture,
      shape: shape ? buildShape(shape) : undefined,
      autoPlay: playing !== false,
    });
    this.addChild(this.system);
    onReady?.(this.system);
  }

  #applyPlaying() {
    if (!this.system) return;
    if (this.fullProps.playing === false) this.system.stop();
    else this.system.play();
  }

  #disposeSystem() {
    if (!this.system) return;
    this.removeChild(this.system);
    this.system.destroy();
    this.system = null;
  }

  onDestroy(parent: Element<any>, afterDestroy?: () => void) {
    this.#buildVersion++;
    this.#disposeSystem();
    super.onDestroy(parent, afterDestroy);
  }
}

registerComponent("Particles3D", CanvasParticles3D);

/**
 * Fire, smoke, sparks or snow.
 *
 * @example
 * ```html
 * <Particles3D
 *   position={[0, 0.2, 0]}
 *   emitRate={110} life={[0.5, 1]} speed={[1.5, 2.3]}
 *   size={[0.5, 0.85]} sizeEnd={0.1} alpha={0.7} alphaEnd={0}
 *   color={0xffd98a} colorEnd={0xd12b06}
 *   shape={{ type: "cone", angle: 12, radius: 0.22 }}
 *   blendMode="add" billboard="cylindrical"
 * />
 * ```
 */
export const Particles3D: ComponentFunction<Particles3DProps> = (props) => createComponent("Particles3D", props);

export { CanvasParticles3D };
