import { RenderTexture, Ticker } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import { FlatMaterial, Mesh3D as PixiMesh3D, PlaneGeometry } from "@pixi/3d";
import { PortalMaterial, PortalPass } from "@pixi/3d/extras";
import { findViewComponent, Node3D, type Node3DProps } from "./Node3D";
import { mergeVec3, type Vec3Input } from "./utils";

export interface Portal3DProps extends Node3DProps {
  /** Size of the doorway in world units, `[width, height]`. Default `[2, 3]` */
  size?: [number, number];
  /** Where the far side is: the exit doorway's `position` and `rotation` (it faces its +Z into the place it shows) */
  exit?: { position?: Vec3Input; rotation?: Vec3Input };
  /** Colour of the exit doorway, seen from the far side. Default `0x05070c` */
  exitColor?: number | string;
  /** Draws the far side. Set `false` to pause the portal; it keeps its last picture. */
  active?: boolean;
}

/**
 * A doorway showing another place of the same scene, as if both were joined. The
 * component is the entry, which faces its +Z toward the viewer; `exit` places the
 * matching doorway in the other place.
 */
class CanvasPortal3D extends Node3D(PixiMesh3D) {
  exitMesh: PixiMesh3D | null = null;
  portal: PortalPass | null = null;
  renderTexture: RenderTexture | null = null;
  #viewComponent: any = null;
  #resize = () => this.#fitTexture();

  applyProps3D(props: Portal3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    if (initial || "size" in props) this.#build();
    if (props.exit !== undefined) this.#placeExit(props.exit);
    if (props.exitColor !== undefined && this.exitMesh) (this.exitMesh.material as any).baseColor = props.exitColor;
    if (props.active !== undefined && this.portal) this.portal.enabled = props.active;
  }

  #build() {
    const viewComponent = this.element ? findViewComponent(this.element) : null;
    if (!viewComponent) return;
    this.#viewComponent = viewComponent;
    this.#dispose();
    const [width, height] = (this.fullProps.size as [number, number]) ?? [2, 3];
    // Entry and exit share one geometry: scaling only one would scale the far side
    const doorway = new PlaneGeometry({ width, height });

    this.renderTexture = RenderTexture.create({ width: 2, height: 2, resolution: viewComponent.renderer?.resolution ?? 1 });
    this.#fitTexture();
    this.geometry = doorway;
    this.material = new PortalMaterial({ texture: this.renderTexture });

    this.exitMesh = new PixiMesh3D({
      geometry: doorway,
      material: new FlatMaterial({ baseColor: this.fullProps.exitColor ?? 0x05070c }),
      castShadow: false,
    });
    viewComponent.view.root.addChild(this.exitMesh);
    this.#placeExit(this.fullProps.exit ?? {});

    this.portal = new PortalPass({ entry: this as unknown as PixiMesh3D, exit: this.exitMesh, texture: this.renderTexture });
    if (this.fullProps.active === false) this.portal.enabled = false;
    viewComponent.registerPasses(this, [this.portal], "camera");
    Ticker.shared.add(this.#resize);
  }

  #placeExit(exit: { position?: Vec3Input; rotation?: Vec3Input }) {
    const mesh = this.exitMesh;
    if (!mesh) return;
    const position = mergeVec3(mesh.position, exit.position);
    if (position) mesh.position.set(position.x, position.y, position.z);
    const rotation = mergeVec3(mesh.rotation, exit.rotation);
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  }

  /** The material spreads the texture over the whole view: keep it the view's size. */
  #fitTexture() {
    const view = this.#viewComponent?.view;
    const texture = this.renderTexture;
    if (!view || !texture) return;
    const width = Math.max(1, Math.round(view.width));
    const height = Math.max(1, Math.round(view.height));
    if (texture.width !== width || texture.height !== height) {
      texture.resize(width, height, this.#viewComponent.renderer?.resolution ?? texture.source.resolution);
    }
  }

  #dispose() {
    Ticker.shared.remove(this.#resize);
    this.#viewComponent?.unregisterPasses(this);
    this.portal?.destroy();
    this.portal = null;
    if (this.exitMesh) {
      this.exitMesh.parent?.removeChild(this.exitMesh);
      this.exitMesh.material?.destroy();
      this.exitMesh.destroy();
      this.exitMesh = null;
    }
    this.material?.destroy();
    this.geometry?.destroy();
    this.renderTexture?.destroy(true);
    this.renderTexture = null;
  }

  onDestroy(parent: Element<any>, afterDestroy?: () => void) {
    this.#dispose();
    this.#viewComponent = null;
    super.onDestroy(parent, afterDestroy);
  }
}

registerComponent("Portal3D", CanvasPortal3D);

/**
 * A doorway onto another place of the scene.
 *
 * @example
 * ```html
 * <Portal3D position={[0, 1.5, -6]} size={[2, 3]} exit={{ position: [60, 1.5, 0], rotation: [0, Math.PI, 0] }} />
 * ```
 */
export const Portal3D: ComponentFunction<Portal3DProps> = (props) => createComponent("Portal3D", props);

export { CanvasPortal3D };
