import { Assets, Color, Texture, Ticker } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import { Container3D, ParticleContainer3D } from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";
import { getDefaultDot } from "./Particles3D";
import { toVec3, type Vec3Input } from "./utils";

export interface PoolParticle {
  position: Vec3Input;
  /** Size in world units. Default 0.1 */
  size?: number;
  /** Angle in the quad's plane, in radians */
  rotation?: number;
  color?: number | string;
  alpha?: number;
  /** Frame index, when `texture` is a list of textures */
  frame?: number;
}

export interface ParticlePool3DProps extends Node3DProps {
  /** Most particles drawn at once. Default 1000 */
  capacity?: number;
  /** Image URL, Texture, or a list of textures to pick from with `frame`. Default: a soft white dot */
  texture?: string | Texture | Texture[];
  /** The particles to draw. Each change rewrites them all. */
  particles?: PoolParticle[];
  /**
   * Called every frame with the ParticleContainer3D, to write particles yourself with
   * `pool.setParticleAt(index, x, y, z, size, rotation, color, alpha)`; the upload follows.
   * Faster than `particles` for thousands of moving particles.
   */
  onUpdate?: (pool: ParticleContainer3D, ticker: Ticker) => void;
  blendMode?: "normal" | "add" | "multiply" | "screen";
  billboard?: "spherical" | "cylindrical" | "horizontal";
  /** `"local"` (default here): positions are relative to the component. `"world"`: scene positions */
  space?: "world" | "local";
  alphaMode?: "opaque" | "blend" | "mask";
}

const CONSTRUCTOR_OPTIONS = ["capacity", "texture", "space", "alphaMode"];
const color = new Color();

/**
 * A fixed pool of camera-facing quads drawn in one call, which your code places:
 * stars, flocks, rain splashes, magic motes, bullets.
 */
class CanvasParticlePool3D extends Node3D(Container3D) {
  pool: ParticleContainer3D | null = null;
  #buildVersion = 0;
  #tick = (ticker: Ticker) => this.#update(ticker);
  #ticking = false;

  applyProps3D(props: ParticlePool3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    if (initial || CONSTRUCTOR_OPTIONS.some((key) => key in props)) {
      this.#build();
      return;
    }
    if (props.blendMode !== undefined && this.pool) this.pool.blendMode = props.blendMode;
    if (props.billboard !== undefined && this.pool) (this.pool as any).billboardMode = props.billboard;
    if ("particles" in props) this.#writeParticles();
    if ("onUpdate" in props) this.#syncTick();
  }

  async #build() {
    const version = ++this.#buildVersion;
    const { capacity = 1000, texture, space = "local", alphaMode, blendMode, billboard } = this.fullProps as ParticlePool3DProps;
    let textures: Texture | Texture[];
    if (typeof texture === "string") textures = await Assets.load<Texture>(texture);
    else textures = texture ?? getDefaultDot();
    if (version !== this.#buildVersion || this.destroyed) return;

    this.#disposePool();
    this.pool = new ParticleContainer3D({
      texture: textures,
      capacity,
      space,
      alphaMode,
      blendMode: blendMode ?? "normal",
      billboard: billboard ?? "spherical",
    } as any);
    this.addChild(this.pool);
    this.#writeParticles();
    this.#syncTick();
  }

  /** Writes `particles` into the pool and hides the unused slots. */
  #writeParticles() {
    const pool = this.pool;
    const particles = this.fullProps.particles as PoolParticle[] | undefined;
    if (!pool || !particles) return;
    const count = Math.min(particles.length, pool.capacity);
    for (let i = 0; i < count; i++) {
      const particle = particles[i];
      const position = toVec3(particle.position) ?? { x: 0, y: 0, z: 0 };
      color.setValue(particle.color ?? 0xffffff);
      pool.setParticleAt(i, position.x, position.y, position.z, particle.size ?? 0.1, particle.rotation ?? 0, color.toNumber(), particle.alpha ?? 1, particle.frame ?? 0);
    }
    // A size of 0 hides a slot
    for (let i = count; i < pool.capacity; i++) pool.setParticleAt(i, 0, 0, 0, 0);
    pool.upload();
  }

  #syncTick() {
    const wanted = !!this.fullProps.onUpdate && !!this.pool;
    if (wanted && !this.#ticking) Ticker.shared.add(this.#tick);
    if (!wanted && this.#ticking) Ticker.shared.remove(this.#tick);
    this.#ticking = wanted;
  }

  #update(ticker: Ticker) {
    if (!this.pool) return;
    this.fullProps.onUpdate?.(this.pool, ticker);
    this.pool.upload();
  }

  #disposePool() {
    if (!this.pool) return;
    this.removeChild(this.pool);
    this.pool.destroy();
    this.pool = null;
  }

  onDestroy(parent: Element<any>, afterDestroy?: () => void) {
    this.#buildVersion++;
    if (this.#ticking) Ticker.shared.remove(this.#tick);
    this.#ticking = false;
    this.#disposePool();
    super.onDestroy(parent, afterDestroy);
  }
}

registerComponent("ParticlePool3D", CanvasParticlePool3D);

/**
 * Particles your code places, drawn in one call.
 *
 * @example
 * ```html
 * <ParticlePool3D capacity={2000} blendMode="add" onUpdate={(pool, ticker) => moveStars(pool, ticker)} />
 * ```
 */
export const ParticlePool3D: ComponentFunction<ParticlePool3DProps> = (props) => createComponent("ParticlePool3D", props);

export { CanvasParticlePool3D };
