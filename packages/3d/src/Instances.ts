import { Color } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction, type Element } from "canvasengine";
import {
  BaseMaterial3D,
  BatchedMesh3D,
  Container3D,
  Geometry3D,
  Matrix4,
  Quaternion,
  RenderPassBit,
  srgbToLinear,
  type ShaderBit,
} from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";
import { buildGeometry, buildMaterial, type GeometrySpec, type MaterialSpec } from "./builders";
import { toVec3, type Vec3Input } from "./utils";

export interface InstanceItem {
  position?: Vec3Input;
  /** Euler rotation in radians */
  rotation?: Vec3Input;
  scale?: Vec3Input;
  /** Multiplies the material colour for this copy */
  color?: number | string;
  visible?: boolean;
}

export interface InstancesProps extends Node3DProps {
  /** Shape shared by every copy */
  geometry?: GeometrySpec | Geometry3D;
  /** Material shared by every copy (plain spec); `color` per item tints it */
  material?: MaterialSpec;
  /** The copies: position, rotation, scale, color and visibility of each */
  items?: InstanceItem[];
  /** Slots reserved; grows to fit `items`. Reserve more to add copies without a rebuild. */
  capacity?: number;
  castShadow?: boolean;
  /** `"none"` (default), `"spherical"` or `"cylindrical"`: copies turn to face the camera */
  billboardMode?: "none" | "spherical" | "cylindrical";
  /** `"gpu"` culls each copy on the GPU, for very large counts */
  cull?: "off" | "cpu" | "gpu";
}

/** Multiplies the surface colour by each copy's `tint` instance data. */
const tintBit: ShaderBit = {
  name: "canvasEngineInstanceTint",
  bindings: { instance: { tint: "vec4<f32>" } },
  gpu: { fragment: { material: "albedo *= instance.tint.rgb;" } },
  gl: { fragment: { material: "albedo *= instance.tint.rgb;" } },
} as ShaderBit;

const matrix = new Matrix4();
const rotation = new Quaternion();
const color = new Color();

/**
 * Thousands of copies of one mesh in one draw call (grass, trees, rocks, bullets).
 * Each item is a slot of a BatchedMesh3D: no scene node per copy.
 */
class CanvasInstances extends Node3D(Container3D) {
  batch: BatchedMesh3D | null = null;
  #geometry: Geometry3D | null = null;
  #ownsGeometry = false;
  #material: BaseMaterial3D | null = null;
  #materialVersion = 0;

  applyProps3D(props: InstancesProps, initial: boolean) {
    super.applyProps3D(props, initial);
    const items = (this.fullProps.items as InstanceItem[]) ?? [];
    const size = Math.max(this.fullProps.capacity ?? 0, items.length, 1);
    const rebuild =
      initial || !this.batch || size > this.batch.size || "cull" in props || "billboardMode" in props;
    if (props.geometry !== undefined || initial) this.#setGeometry();
    if (rebuild) this.#build(size);
    if (props.material !== undefined || initial) {
      this.#setMaterial();
      return;
    }
    if (rebuild || props.items !== undefined || props.geometry !== undefined || props.castShadow !== undefined) {
      this.#fill();
    }
  }

  #setGeometry() {
    const spec = this.fullProps.geometry;
    if (!spec) return;
    const built = buildGeometry(spec);
    if (!built) return;
    if (this.#ownsGeometry) this.#geometry?.destroy();
    this.#geometry = built.geometry;
    this.#ownsGeometry = built.owned;
  }

  #build(size: number) {
    if (this.batch) {
      this.removeChild(this.batch);
      this.batch.destroy();
    }
    this.batch = new BatchedMesh3D({
      size,
      cull: this.fullProps.cull,
      instanceData: { tint: { value: [1, 1, 1, 1], type: "vec4<f32>" } },
    } as any);
    this.addChild(this.batch);
  }

  #setMaterial() {
    const version = ++this.#materialVersion;
    const spec: MaterialSpec = { ...(this.fullProps.material ?? {}) };
    spec.extraBits = [...(spec.extraBits ?? []), tintBit];
    buildMaterial(spec).then((material) => {
      if (version !== this.#materialVersion || this.destroyed) {
        material.destroy();
        return;
      }
      const previous = this.#material;
      this.#material = material;
      this.#fill();
      previous?.destroy();
    });
  }

  /** Writes every item into its slot and hides the spare slots. */
  #fill() {
    const batch = this.batch;
    if (!batch || !this.#geometry || !this.#material) return;
    const items = (this.fullProps.items as InstanceItem[]) ?? [];
    const transparent = this.#material.alphaMode === "blend";
    const passes =
      (transparent ? RenderPassBit.TRANSPARENT : RenderPassBit.OPAQUE) |
      (this.fullProps.castShadow === false ? 0 : RenderPassBit.SHADOW);

    for (let i = 0; i < batch.size; i++) {
      const item = items[i];
      if (!item) {
        batch.setVisibleAt(i, false);
        continue;
      }
      batch.setGeometryAt(i, this.#geometry);
      batch.setMaterialAt(i, this.#material);
      batch.setPassesAt(i, passes);
      const position = toVec3(item.position) ?? { x: 0, y: 0, z: 0 };
      const euler = toVec3(item.rotation) ?? { x: 0, y: 0, z: 0 };
      const scale = toVec3(item.scale, 1) ?? { x: 1, y: 1, z: 1 };
      rotation.setFromEuler(euler);
      batch.setMatrixAt(i, matrix.compose(position, rotation, scale));
      color.setValue(item.color ?? 0xffffff);
      // The shader multiplies linear light: convert the sRGB colour
      batch.setInstanceDataAt(i, "tint", srgbToLinear(color.red), srgbToLinear(color.green), srgbToLinear(color.blue), 1);
      if (this.fullProps.billboardMode) {
        (batch.items[i] as any).billboardMode = this.fullProps.billboardMode;
        batch.invalidate(i);
      }
      batch.setVisibleAt(i, item.visible !== false);
    }
  }

  onDestroy(parent: Element<any>, afterDestroy?: () => void) {
    this.#materialVersion++;
    const batch = this.batch;
    const material = this.#material;
    const geometry = this.#ownsGeometry ? this.#geometry : null;
    this.batch = null;
    super.onDestroy(parent, afterDestroy);
    batch?.destroy();
    material?.destroy();
    geometry?.destroy();
  }
}

registerComponent("Instances", CanvasInstances);

/**
 * Many copies of one mesh drawn in one call.
 *
 * @example
 * ```html
 * <Instances
 *   geometry={{ type: "cone", radius: 0.6, height: 2, radialSegments: 8 }}
 *   material={{ baseColor: 0x2f6b3a, roughness: 0.9 }}
 *   items={trees}
 * />
 * ```
 */
export const Instances: ComponentFunction<InstancesProps> = (props) => createComponent("Instances", props);

export { CanvasInstances };
