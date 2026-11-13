import { createComponent, registerComponent, type ComponentFunction } from "canvasengine";
import {
  AmbientLight as PixiAmbientLight,
  DirectionalLight as PixiDirectionalLight,
  PointLight as PixiPointLight,
  SpotLight as PixiSpotLight,
} from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";

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
}

const LIGHT_FIELDS = ["color", "intensity", "castShadow", "range", "radius", "coneAngle", "penumbra"] as const;

/** Lights look down their local -Z: aim them with `rotation` or `lookAt`. */
function LightComponent(Base: any): any {
  return class extends Node3D(Base) {
    applyProps3D(props: LightProps, initial: boolean) {
      super.applyProps3D(props, initial);
      for (const key of LIGHT_FIELDS) {
        if (props[key] !== undefined && key in this) (this as any)[key] = props[key];
      }
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
