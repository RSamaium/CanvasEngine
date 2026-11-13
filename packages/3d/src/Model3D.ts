import { Assets, Ticker } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction } from "canvasengine";
import { Container3D, Model3D as PixiModel3D, type AnimationState, type Scene3DSource } from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";

export interface Model3DProps extends Node3DProps {
  /** URL of a .glb / .gltf file, or an already loaded Scene3DSource */
  src?: string | Scene3DSource;
  /** Name of the animation clip to play; changing it cross-fades to the new clip */
  animation?: string | null;
  /** Cross-fade duration in seconds when `animation` changes (default 0.25, 0 to cut) */
  fadeDuration?: number;
  /** Whether the clip loops (default true) */
  loop?: boolean;
  /** Playback speed multiplier (default 1) */
  animationSpeed?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Called once the model is built */
  onLoad?: (model: PixiModel3D) => void;
}

/**
 * Wraps a loaded glTF. The component is a Container3D holding the Model3D, so
 * transforms and children work before the file has loaded.
 */
class CanvasModel3D extends Node3D(Container3D) {
  model: PixiModel3D | null = null;
  #loadVersion = 0;
  #clip: string | null = null;
  #state: AnimationState | null = null;
  #fade: ((ticker: Ticker) => void) | null = null;

  applyProps3D(props: Model3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    if (props.src !== undefined) this.#load(props.src);
    else if (this.model) {
      if (props.animation !== undefined) this.#play();
      if (this.#state && props.loop !== undefined) this.#state.loop = props.loop;
      if (this.#state && props.animationSpeed !== undefined) this.#state.animationSpeed = props.animationSpeed;
      if (props.castShadow !== undefined || props.receiveShadow !== undefined) this.#applyShadows();
    }
  }

  async #load(src: string | Scene3DSource) {
    const version = ++this.#loadVersion;
    const source = typeof src === "string" ? await Assets.load<Scene3DSource>(src) : src;
    if (version !== this.#loadVersion || this.destroyed) return;
    this.#disposeModel();
    const { castShadow, receiveShadow } = this.fullProps;
    // The `animation` prop drives playback: no clip starts on its own
    this.model = new PixiModel3D({ source, castShadow, receiveShadow, autoPlay: false });
    this.addChild(this.model);
    this.#play();
    this.fullProps.onLoad?.(this.model);
  }

  /** Switches to the clip named by `animation`, fading out the clip that was playing. */
  #play() {
    const player = this.model?.player;
    if (!player) return;
    const clip = this.fullProps.animation ?? null;
    if (clip === this.#clip) return;
    this.#clip = clip;
    this.#stopFade();

    const previous = this.#state;
    if (!clip) {
      player.stop();
      this.#state = null;
      return;
    }
    if (!player.getAnimation(clip)) {
      console.warn(`<Model3D> no animation named "${clip}"`);
      previous?.stop();
      this.#state = null;
      return;
    }
    const next = player.play(clip);
    next.loop = this.fullProps.loop ?? true;
    next.animationSpeed = this.fullProps.animationSpeed ?? 1;
    this.#state = next;
    if (!previous || previous === next) {
      next.weight = 1;
      return;
    }

    const duration = this.fullProps.fadeDuration ?? 0.25;
    if (duration <= 0) {
      previous.stop();
      next.weight = 1;
      return;
    }
    const from = previous.weight;
    let elapsed = 0;
    next.weight = 0;
    this.#fade = (ticker: Ticker) => {
      elapsed += ticker.deltaMS / 1000;
      const t = Math.min(1, elapsed / duration);
      next.weight = t;
      previous.weight = from * (1 - t);
      if (t >= 1) {
        previous.stop();
        previous.weight = 1;
        this.#stopFade();
      }
    };
    // The player advances on Ticker.shared too
    Ticker.shared.add(this.#fade);
  }

  #stopFade() {
    if (this.#fade) Ticker.shared.remove(this.#fade);
    this.#fade = null;
  }

  #applyShadows() {
    const { castShadow, receiveShadow } = this.fullProps;
    this.model?.traverse((node: any) => {
      if (castShadow !== undefined && "castShadow" in node) node.castShadow = castShadow;
      if (receiveShadow !== undefined && "receiveShadow" in node) node.receiveShadow = receiveShadow;
    });
  }

  #disposeModel() {
    this.#stopFade();
    this.#state = null;
    this.#clip = null;
    if (!this.model) return;
    this.removeChild(this.model);
    this.model.destroy();
    this.model = null;
  }

  onDestroy(parent: any, afterDestroy?: () => void) {
    this.#loadVersion++;
    this.#disposeModel();
    super.onDestroy(parent, afterDestroy);
  }
}

registerComponent("Model3D", CanvasModel3D);

/**
 * A glTF model.
 *
 * @example
 * ```html
 * <Model3D src="./models/hero.glb" position={heroPos} animation={clip} fadeDuration={0.3} castShadow={true} />
 * ```
 */
export const Model3D: ComponentFunction<Model3DProps> = (props) => createComponent("Model3D", props);

export { CanvasModel3D };
