import { Assets, type Texture } from "pixi.js";
import { createComponent, registerComponent, type ComponentFunction } from "canvasengine";
import {
  BaseMaterial3D,
  CapsuleGeometry,
  ConeGeometry,
  CubeGeometry,
  CylinderGeometry,
  FlatMaterial,
  Geometry3D,
  IcosahedronGeometry,
  Material3D,
  Mesh3D as PixiMesh3D,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry,
} from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";

const GEOMETRIES = {
  cube: CubeGeometry,
  sphere: SphereGeometry,
  plane: PlaneGeometry,
  cylinder: CylinderGeometry,
  cone: ConeGeometry,
  capsule: CapsuleGeometry,
  torus: TorusGeometry,
  torusKnot: TorusKnotGeometry,
  icosahedron: IcosahedronGeometry,
} as const;

export type GeometrySpec = { type: keyof typeof GEOMETRIES; [option: string]: any };

export interface MaterialSpec {
  /** `'pbr'` (Material3D, lit) by default, or `'flat'` (unlit) */
  type?: "pbr" | "flat";
  baseColor?: number | string;
  metallic?: number;
  roughness?: number;
  alpha?: number;
  alphaMode?: "opaque" | "blend" | "mask";
  doubleSided?: boolean;
  /** Glow: `{ color, strength }`; a strength above 1 feeds bloom */
  emissive?: { color?: number | string; strength?: number };
  /** Image URL or Texture used as base colour */
  texture?: string | Texture;
  [option: string]: any;
}

export interface Mesh3DProps extends Node3DProps {
  /** `{ type: "cube", width, height, depth }`, `{ type: "sphere", radius }`... or a Geometry3D */
  geometry?: GeometrySpec | Geometry3D;
  /** `{ baseColor, roughness, metallic, emissive }`... or any material instance */
  material?: MaterialSpec | BaseMaterial3D;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** Material fields that a live material accepts as plain property writes. */
const LIVE_MATERIAL_FIELDS = ["baseColor", "metallic", "roughness", "alpha", "alphaMode"];

class CanvasMesh3D extends Node3D(PixiMesh3D) {
  #ownsGeometry = false;
  #ownsMaterial = false;
  #materialSpec: MaterialSpec | null = null;
  #materialVersion = 0;

  applyProps3D(props: Mesh3DProps, initial: boolean) {
    super.applyProps3D(props, initial);
    if (props.geometry !== undefined) this.#setGeometry(this.fullProps.geometry);
    if (props.material !== undefined) this.#setMaterial(props.material, this.fullProps.material, initial);
    if (props.castShadow !== undefined) this.castShadow = props.castShadow;
    if (props.receiveShadow !== undefined) this.receiveShadow = props.receiveShadow;
  }

  #setGeometry(spec: GeometrySpec | Geometry3D | undefined) {
    if (!spec) return;
    if (this.#ownsGeometry) this.geometry?.destroy();
    if (spec instanceof Geometry3D) {
      this.geometry = spec;
      this.#ownsGeometry = false;
      return;
    }
    const { type, ...options } = spec;
    const GeometryClass = GEOMETRIES[type];
    if (!GeometryClass) {
      console.warn(`<Mesh3D> unknown geometry type "${type}"`);
      return;
    }
    this.geometry = new GeometryClass(options as any);
    this.#ownsGeometry = true;
  }

  /**
   * `patch` is what changed, `spec` the full merged spec. Colours, metallic and roughness
   * are written in place; other changes (type, emissive, texture) rebuild the material.
   */
  #setMaterial(patch: MaterialSpec | BaseMaterial3D, spec: MaterialSpec | BaseMaterial3D, initial: boolean) {
    if (spec instanceof BaseMaterial3D) {
      this.#replaceMaterial(spec, false);
      this.#materialSpec = null;
      return;
    }
    const canPatch =
      !initial &&
      this.#ownsMaterial &&
      this.#materialSpec &&
      Object.keys(patch).every((key) => LIVE_MATERIAL_FIELDS.includes(key));
    if (canPatch) {
      const material = this.material as any;
      for (const key of Object.keys(patch)) material[key] = (patch as any)[key];
      this.#materialSpec = { ...spec };
      return;
    }
    this.#materialSpec = { ...spec };
    this.#buildMaterial(spec);
  }

  async #buildMaterial(spec: MaterialSpec) {
    const version = ++this.#materialVersion;
    const { type = "pbr", texture, ...options } = spec;
    let baseColorTexture: Texture | undefined;
    if (typeof texture === "string") {
      baseColorTexture = await Assets.load(texture);
      // A newer spec arrived during the load
      if (version !== this.#materialVersion || this.destroyed) return;
    } else if (texture) {
      baseColorTexture = texture;
    }
    if (baseColorTexture) (options as any).baseColorTexture = baseColorTexture;
    const material = type === "flat" ? new FlatMaterial(options as any) : new Material3D(options as any);
    this.#replaceMaterial(material, true);
  }

  #replaceMaterial(material: BaseMaterial3D, owned: boolean) {
    const previous = this.#ownsMaterial ? this.material : null;
    this.material = material;
    this.#ownsMaterial = owned;
    if (previous && previous !== material) previous.destroy();
  }

  onDestroy(parent: any, afterDestroy?: () => void) {
    const geometry = this.#ownsGeometry ? this.geometry : null;
    const material = this.#ownsMaterial ? this.material : null;
    super.onDestroy(parent, afterDestroy);
    geometry?.destroy();
    material?.destroy();
  }
}

registerComponent("Mesh3D", CanvasMesh3D);

/**
 * A 3D mesh: a geometry and a material.
 *
 * @example
 * ```html
 * <Mesh3D
 *   geometry={{ type: "sphere", radius: 1.2 }}
 *   material={{ baseColor: color, roughness: 0.3, metallic: 0.2 }}
 *   position={[3, 1.2, 0]}
 *   castShadow
 *   click={() => console.log("hit")}
 * />
 * ```
 */
export const Mesh3D: ComponentFunction<Mesh3DProps> = (props) => createComponent("Mesh3D", props);

export { CanvasMesh3D };
