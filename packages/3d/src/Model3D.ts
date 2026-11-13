import { Assets } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction } from "canvasengine";
import { Container3D, Model3D as PixiModel3D, type Scene3DSource } from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";

export interface Model3DProps extends Node3DProps {
  /** URL of a .glb / .gltf file, or an already loaded Scene3DSource */
  src?: string | Scene3DSource;
  /** Name of the animation clip to play; changing it switches clip */
  animation?: string | null;
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

  applyProps3D(props: Model3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    if (props.src !== undefined) this.#load(props.src);
    else if (this.model) {
      if (props.animation !== undefined) this.#play();
      if (props.castShadow !== undefined || props.receiveShadow !== undefined) this.#applyShadows();
    }
  }

  async #load(src: string | Scene3DSource) {
    const version = ++this.#loadVersion;
    const source = typeof src === "string" ? await Assets.load<Scene3DSource>(src) : src;
    if (version !== this.#loadVersion || this.destroyed) return;
    this.#disposeModel();
    const { castShadow, receiveShadow } = this.fullProps;
    this.model = new PixiModel3D({ source, castShadow, receiveShadow });
    this.addChild(this.model);
    this.#play();
    this.fullProps.onLoad?.(this.model);
  }

  #play() {
    const player = this.model?.player;
    if (!player) return;
    const clip = this.fullProps.animation;
    if (clip) player.play(clip);
    else player.stop();
  }

  #applyShadows() {
    const { castShadow, receiveShadow } = this.fullProps;
    this.model?.traverse((node: any) => {
      if (castShadow !== undefined && "castShadow" in node) node.castShadow = castShadow;
      if (receiveShadow !== undefined && "receiveShadow" in node) node.receiveShadow = receiveShadow;
    });
  }

  #disposeModel() {
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
 * <Model3D src="./models/hero.glb" position={heroPos} animation={moving ? "Run" : "Idle"} castShadow />
 * ```
 */
export const Model3D: ComponentFunction<Model3DProps> = (props) => createComponent("Model3D", props);

export { CanvasModel3D };
