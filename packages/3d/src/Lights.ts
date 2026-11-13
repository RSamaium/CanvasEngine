import { createComponent, registerComponent, type ComponentFunction } from "canvasengine";
import {
  AmbientLight as PixiAmbientLight,
  DirectionalLight as PixiDirectionalLight,
  PointLight as PixiPointLight,
  Box,
  SpotLight as PixiSpotLight,
  Vector3,
} from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";
import { toVec3, type Vec3Input } from "./utils";

export interface LightProps extends Node3DProps {
  color?: number | string;
  intensity?: number;
  castShadow?: boolean;
  /** Point and spot lights: reach in world units */
  range?: number;
  /** Point and spot lights: size of the emitter */
  radius?: number;
  /** Spot lights: cone angle in radians */
  coneAngle?: number;
  /** Spot lights: softness of the cone edge, 0 to 1 */
  penumbra?: number;
  /** Shadow settings of a light with `castShadow` */
  shadow?: ShadowSettings;
}

export interface ShadowSettings {
  /** Depth offset against shadow acne (stripes on lit surfaces) */
  bias?: number;
  /** Offset along the surface normal, in world units */
  normalBias?: number;
  /**
   * Directional light: the world box the shadow covers, `{ min: [x, y, z], max: [x, y, z] }`.
   * Without it, the box fits the shadow casters.
   */
  bounds?: { min: Vec3Input; max: Vec3Input } | Box;
  /** Directional light: split the shadow in 1 to 4 cascades, sharper near the camera */
  cascades?: 1 | 2 | 3 | 4;
  /** With cascades: distance from the camera the shadow reaches */
  maxDistance?: number;
  /** With cascades: 0 splits evenly, 1 gives more detail near the camera */
  lambda?: number;
  /** Redraw rate: `1` every frame, `N` every Nth frame, `"manual"` only after `refreshShadows()` */
  update?: number | number[] | "manual";
}

const LIGHT_FIELDS = ["color", "intensity", "castShadow", "range", "radius", "coneAngle", "penumbra"] as const;

function toBox(bounds: ShadowSettings["bounds"]): Box | undefined {
  if (!bounds || bounds instanceof Box) return bounds as Box | undefined;
  const min = toVec3(bounds.min)!;
  const max = toVec3(bounds.max)!;
  return new Box(new Vector3(min.x, min.y, min.z), new Vector3(max.x, max.y, max.z));
}

/** Lights look down their local -Z: aim them with `rotation` or `lookAt`. */
function LightComponent(Base: any): any {
  return class extends Node3D(Base) {
    applyProps3D(props: LightProps, initial: boolean) {
      super.applyProps3D(props, initial);
      for (const key of LIGHT_FIELDS) {
        if (props[key] !== undefined && key in this) (this as any)[key] = props[key];
      }
      if (props.shadow !== undefined) this.#applyShadow(this.fullProps.shadow ?? {});
    }

    #applyShadow(settings: ShadowSettings) {
      const shadow = (this as any).shadow;
      if (!shadow) return;
      for (const key of ["bias", "normalBias", "cascades", "maxDistance", "lambda", "update"] as const) {
        if (key in settings) shadow[key] = settings[key];
      }
      if ("bounds" in settings) shadow.bounds = toBox(settings.bounds);
      (this as any).refreshShadows?.();
    }
  };
}

registerComponent("DirectionalLight", LightComponent(PixiDirectionalLight));
registerComponent("PointLight", LightComponent(PixiPointLight));
registerComponent("SpotLight", LightComponent(PixiSpotLight));
registerComponent("AmbientLight", LightComponent(PixiAmbientLight));

/** Sun-like light; direct light intensities near 3 light a surface fully. */
export const DirectionalLight: ComponentFunction<LightProps> = (props) => createComponent("DirectionalLight", props);
export const PointLight: ComponentFunction<LightProps> = (props) => createComponent("PointLight", props);
export const SpotLight: ComponentFunction<LightProps> = (props) => createComponent("SpotLight", props);
/** Flat fill light; prefer the View3D `environment` hemisphere for soft fill. */
export const AmbientLight: ComponentFunction<LightProps> = (props) => createComponent("AmbientLight", props);
