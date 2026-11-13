import { Assets, Texture } from "pixi.js";
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
  PhongMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry,
} from "@pixi/3d";
import { ToonMaterial } from "@pixi/3d/extras";
import { isPlainObject } from "./utils";

export const GEOMETRIES = {
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
  /** `"pbr"` (default, lit), `"flat"` (unlit), `"phong"` or `"toon"` (cel shading) */
  type?: "pbr" | "flat" | "phong" | "toon";
  baseColor?: number | string;
  metallic?: number;
  roughness?: number;
  alpha?: number;
  alphaMode?: "opaque" | "blend" | "mask";
  doubleSided?: boolean;
  /** Glow: `{ color, strength }`; a strength above 1 feeds bloom */
  emissive?: { color?: number | string; strength?: number; texture?: string | Texture };
  /** Image URL or Texture used as base colour */
  texture?: string | Texture;
  /** Any other material option. A `...Texture` or `texture` option may be an image URL. */
  [option: string]: any;
}

const MATERIALS = {
  pbr: Material3D,
  flat: FlatMaterial,
  phong: PhongMaterial,
  toon: ToonMaterial,
} as const;

/** Material fields that a built material accepts as plain property writes. */
export const LIVE_MATERIAL_FIELDS = [
  "baseColor",
  "metallic",
  "roughness",
  "alpha",
  "alphaMode",
  "alphaCutoff",
  "normalScale",
  "occlusionStrength",
  "ior",
];

/** Builds a geometry from `{ type, ...options }`, or returns a Geometry3D as is. */
export function buildGeometry(spec: GeometrySpec | Geometry3D): { geometry: Geometry3D; owned: boolean } | null {
  if (spec instanceof Geometry3D) return { geometry: spec, owned: false };
  const { type, ...options } = spec ?? ({} as GeometrySpec);
  const GeometryClass = GEOMETRIES[type];
  if (!GeometryClass) {
    console.warn(`unknown geometry type "${type}"`);
    return null;
  }
  return { geometry: new GeometryClass(options as any), owned: true };
}

const isTextureKey = (key: string) => key === "texture" || key.endsWith("Texture");

/** Loads every texture given as a URL, at any depth of the spec. */
async function loadTextures(value: any): Promise<any> {
  if (Array.isArray(value)) return Promise.all(value.map(loadTextures));
  if (!isPlainObject(value)) return value;
  const out: Record<string, any> = {};
  await Promise.all(
    Object.entries(value).map(async ([key, item]) => {
      if (isTextureKey(key) && typeof item === "string") out[key] = await Assets.load<Texture>(item);
      else out[key] = await loadTextures(item);
    }),
  );
  return out;
}

/**
 * Builds a material from a plain spec. `texture` maps to `baseColorTexture`, and
 * textures given as URLs are loaded first.
 */
export async function buildMaterial(spec: MaterialSpec): Promise<BaseMaterial3D> {
  const { type = "pbr", texture, ...rest } = await loadTextures(spec);
  const MaterialClass = MATERIALS[type as keyof typeof MATERIALS];
  if (!MaterialClass) throw new Error(`unknown material type "${type}"`);
  const options: Record<string, any> = { ...rest };
  if (texture) options.baseColorTexture = texture;
  return new (MaterialClass as any)(options);
}

/** True when every changed key can be written into the existing material. */
export function canPatchMaterial(patch: Record<string, any>): boolean {
  return Object.keys(patch).every((key) => LIVE_MATERIAL_FIELDS.includes(key));
}

export { BaseMaterial3D, Texture };
