import { Color } from "pixi.js";
import { srgbToLinear, type BaseMaterial3D } from "@pixi/3d";
import { dissolveBit } from "@pixi/3d/extras";

export interface DissolveSettings {
  /** 0 draws the surface whole, 1 cuts all of it away */
  amount?: number;
  /** Colour of the glowing edge along the cut. Default: no edge */
  edgeColor?: number | string;
  /** Brightness of the edge; above 1 it glows, and feeds bloom. Default 4 */
  edgeStrength?: number;
  /** About how wide the holes are, in the mesh's own units. Default 0.25 */
  holeSize?: number;
}

/** `dissolve={0.4}` or `dissolve={{ amount, edgeColor, ... }}` */
export type DissolveInput = number | DissolveSettings;

export function normalizeDissolve(value: DissolveInput | undefined | null): DissolveSettings | null {
  if (value === undefined || value === null) return null;
  return typeof value === "number" ? { amount: value } : value;
}

/** Adds the dissolve shader bit to a copy of `material`. */
export function withDissolveBit(material: BaseMaterial3D): BaseMaterial3D {
  return (material as any).clone({ extraBits: [dissolveBit] });
}

/** Writes the dissolve settings into a material that has the dissolve bit. */
export function applyDissolve(material: BaseMaterial3D, settings: DissolveSettings) {
  const data = (material as any).data;
  if (!data) return;
  data.dissolve = Math.min(1, Math.max(0, settings.amount ?? 0));
  if (settings.edgeColor !== undefined) {
    const color = new Color(settings.edgeColor);
    const strength = settings.edgeStrength ?? 4;
    // Linear light: a strength above 1 makes the edge glow
    data.dissolveEdgeColor = [
      srgbToLinear(color.red) * strength,
      srgbToLinear(color.green) * strength,
      srgbToLinear(color.blue) * strength,
    ];
  } else {
    data.dissolveEdgeColor = [0, 0, 0];
  }
  data.dissolveHoleSize = settings.holeSize ?? 0;
}

export { dissolveBit };
