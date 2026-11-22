import { createComponent, registerComponent, type ComponentFunction } from "canvasengine";
import { BaseMaterial3D, Geometry3D, Mesh3D as PixiMesh3D } from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";
import { buildGeometry, buildMaterial, canPatchMaterial, type GeometrySpec, type MaterialSpec } from "./builders";
import { applyDissolve, normalizeDissolve, withDissolveBit, type DissolveInput } from "./dissolve";

export type { GeometrySpec, MaterialSpec };

export interface Mesh3DProps extends Node3DProps {
  /** `{ type: "cube", width, height, depth }`, `{ type: "sphere", radius }`... or a Geometry3D */
  geometry?: GeometrySpec | Geometry3D;
  /** `{ baseColor, roughness, metallic, emissive }`... or any material instance */
  material?: MaterialSpec | BaseMaterial3D;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Faces the camera: `"none"` (default), `"spherical"` or `"cylindrical"` (stays upright) */
  billboardMode?: "none" | "spherical" | "cylindrical";
  /** Cuts the surface away with noise: 0 whole, 1 gone, or `{ amount, edgeColor, edgeStrength, holeSize }` */
  dissolve?: DissolveInput;
}

/**
 * Mixin for components that own a geometry and a material built from props:
 * Mesh3D, and the screens of Surface3D and Monitor3D.
 */
export function MeshComponent(Base: new (...args: any[]) => PixiMesh3D): any {
  return class extends Node3D(Base) {
    _ownsGeometry = false;
    _ownsMaterial = false;
    _materialSpec: MaterialSpec | null = null;
    _materialVersion = 0;
    /** The material copy that carries the dissolve shader bit */
    _dissolveMaterial: BaseMaterial3D | null = null;

    applyProps3D(props: Mesh3DProps, initial: boolean) {
      super.applyProps3D(props, initial);
      if (props.geometry !== undefined) this.setGeometrySpec(this.fullProps.geometry);
      if (props.material !== undefined) this.setMaterialSpec(props.material, this.fullProps.material, initial);
      if (props.castShadow !== undefined) this.castShadow = props.castShadow;
      if (props.receiveShadow !== undefined) this.receiveShadow = props.receiveShadow;
      if (props.billboardMode !== undefined) this.billboardMode = props.billboardMode;
      if ("dissolve" in props) this.syncDissolve();
    }

    /** Gives the material the dissolve bit the first time `dissolve` is set, then writes its values. */
    syncDissolve() {
      const settings = normalizeDissolve(this.fullProps.dissolve);
      const material = this.material as BaseMaterial3D | null;
      if (!material || (!settings && !this._dissolveMaterial)) return;
      if (settings && material !== this._dissolveMaterial) {
        const copy = withDissolveBit(material);
        const owned = this._ownsMaterial;
        this.material = copy;
        this._ownsMaterial = true;
        this._dissolveMaterial = copy;
        if (owned) material.destroy();
      }
      if (this._dissolveMaterial) applyDissolve(this._dissolveMaterial, settings ?? { amount: 0 });
    }

    setGeometrySpec(spec: GeometrySpec | Geometry3D | undefined) {
      if (!spec) return;
      const built = buildGeometry(spec);
      if (!built) return;
      const previous = this._ownsGeometry ? this.geometry : null;
      this.geometry = built.geometry;
      this._ownsGeometry = built.owned;
      if (previous && previous !== built.geometry) previous.destroy();
    }

    /**
     * `patch` is what changed, `spec` the full merged spec. Colours, metallic, roughness
     * and alpha are written in place; other changes build a new material.
     */
    setMaterialSpec(patch: MaterialSpec | BaseMaterial3D, spec: MaterialSpec | BaseMaterial3D, initial: boolean) {
      if (spec instanceof BaseMaterial3D) {
        this._materialVersion++;
        this.replaceMaterial(spec, false);
        this._materialSpec = null;
        return;
      }
      if (!initial && this._ownsMaterial && this._materialSpec && canPatchMaterial(patch as MaterialSpec)) {
        const material = this.material as any;
        for (const key of Object.keys(patch)) material[key] = (patch as any)[key];
        this._materialSpec = { ...spec };
        return;
      }
      this._materialSpec = { ...spec };
      const version = ++this._materialVersion;
      buildMaterial(spec)
        .then((material) => {
          // A newer spec arrived while textures loaded
          if (version !== this._materialVersion || this.destroyed) {
            material.destroy();
            return;
          }
          this.replaceMaterial(material, true);
          // Opt-in passes live on the mesh, but re-apply them for a new material
          this.applyPassFlag("outline", this.fullProps.outlined);
          this.applyPassFlag("wireframe", this.fullProps.wireframe);
        })
        .catch((error) => console.warn("<Mesh3D> material:", error));
    }

    replaceMaterial(material: BaseMaterial3D, owned: boolean) {
      const previous = this._ownsMaterial ? this.material : null;
      this.material = material;
      this._ownsMaterial = owned;
      this._dissolveMaterial = null;
      if (previous && previous !== material) previous.destroy();
      if (this.fullProps.dissolve !== undefined) this.syncDissolve();
    }

    onDestroy(parent: any, afterDestroy?: () => void) {
      this._materialVersion++;
      const geometry = this._ownsGeometry ? this.geometry : null;
      const material = this._ownsMaterial ? this.material : null;
      super.onDestroy(parent, afterDestroy);
      geometry?.destroy();
      material?.destroy();
    }
  };
}

class CanvasMesh3D extends MeshComponent(PixiMesh3D) {}

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
 *   click={() => console.log("hit")}
 * />
 * ```
 */
export const Mesh3D: ComponentFunction<Mesh3DProps> = (props) => createComponent("Mesh3D", props);

export { CanvasMesh3D };
