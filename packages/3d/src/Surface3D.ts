import { Container } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import { Container3D, ContainerTexture, FlatMaterial, Material3D, Mesh3D as PixiMesh3D, PlaneGeometry } from "@pixi/3d";
import { findViewComponent, Node3D, type Node3DProps } from "./Node3D";

export interface Surface3DProps extends Node3DProps {
  /** Size of the 2D area in pixels, `[width, height]`: the 2D children draw in it. Default `[512, 256]` */
  resolution?: [number, number];
  /** Width of the surface in world units; the height follows the 2D area's shape. Default 2 */
  width?: number;
  /** `false` (default): the 2D shows as lit from within, like a screen. `true`: lit like a poster */
  lit?: boolean;
  /** Colour behind the 2D content; transparent when left out */
  clearColor?: number | string;
  /** `"frame"` (default): redraws every frame. `"manual"`: only when `redraw()` is called */
  update?: "frame" | "manual";
  /** Draws both faces */
  doubleSided?: boolean;
}

/**
 * A plane showing its 2D CanvasEngine children: a sign, a screen, a health bar over a
 * character. The children draw into a ContainerTexture, never on the stage.
 */
class CanvasSurface3D extends Node3D(PixiMesh3D) {
  /** Holds the 2D children */
  readonly content = new Container();
  texture2d: ContainerTexture | null = null;

  /** 3D children go in the scene, 2D children in the texture's container. */
  addChild(...children: any[]) {
    for (const child of children) {
      if (child instanceof Container3D) super.addChild(child);
      else this.content.addChild(child);
    }
    return children[0];
  }

  addChildAt(child: any, index: number) {
    if (child instanceof Container3D) return super.addChildAt(child, index);
    return this.content.addChildAt(child, Math.min(index, this.content.children.length));
  }

  removeChild(...children: any[]) {
    for (const child of children) {
      if (child instanceof Container3D) super.removeChild(child);
      else this.content.removeChild(child);
    }
    return children[0];
  }

  applyProps3D(props: Surface3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    if (initial || "resolution" in props || "width" in props || "lit" in props || "clearColor" in props || "doubleSided" in props) {
      this.#build();
    } else if (props.update !== undefined && this.texture2d) {
      this.texture2d.autoUpdate = props.update !== "manual";
    }
  }

  #build() {
    const renderer = this.element ? findViewComponent(this.element)?.renderer : null;
    const [width, height] = (this.fullProps.resolution as [number, number]) ?? [512, 256];
    const previous = this.texture2d;
    this.texture2d = new ContainerTexture({
      container: this.content,
      width,
      height,
      antialias: true,
      resolution: renderer?.resolution ?? 1,
      clearColor: this.fullProps.clearColor,
      renderer: renderer ?? undefined,
      autoUpdate: this.fullProps.update !== "manual",
    });

    const surfaceWidth = this.fullProps.width ?? 2;
    this.geometry?.destroy();
    this.geometry = new PlaneGeometry({ width: surfaceWidth, height: (surfaceWidth * height) / width });
    const options = {
      baseColorTexture: this.texture2d,
      // Transparent areas stay see-through unless a clear colour fills them
      alphaMode: this.fullProps.clearColor === undefined ? ("blend" as const) : ("opaque" as const),
      doubleSided: this.fullProps.doubleSided ?? false,
    };
    const previousMaterial = this.material;
    this.material = this.fullProps.lit ? new Material3D(options) : new FlatMaterial(options);
    previousMaterial?.destroy();
    // Keeps the container: it holds the 2D children
    previous?.destroy(true);
  }

  /** Redraws the 2D content, with `update="manual"`. */
  redraw() {
    this.texture2d?.render();
  }

  onDestroy(parent: Element<any>, afterDestroy?: () => void) {
    const texture = this.texture2d;
    const material = this.material;
    const geometry = this.geometry;
    this.texture2d = null;
    super.onDestroy(parent, afterDestroy);
    texture?.destroy(true);
    material?.destroy();
    geometry?.destroy();
    this.content.destroy();
  }
}

registerComponent("Surface3D", CanvasSurface3D);

/**
 * Shows 2D components on a plane in the 3D scene.
 *
 * @example
 * ```html
 * <Surface3D position={[0, 3, -4]} width={3} resolution={[512, 128]} clearColor={0x1b1430}>
 *   <Text text={score} x={256} y={64} anchor={0.5} size={64} color="#ffc46b" />
 * </Surface3D>
 * ```
 */
export const Surface3D: ComponentFunction<Surface3DProps> = (props) => createComponent("Surface3D", props);

export { CanvasSurface3D };
