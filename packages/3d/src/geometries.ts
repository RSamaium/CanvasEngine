import { Color } from "pixi.js";
import { Geometry3D, srgbToLinear } from "@pixi/3d";

type Vec3 = [number, number, number];

/** Your own vertices. */
export interface CustomGeometrySpec {
  type: "custom";
  /** x, y, z of each vertex, flat (`[x0, y0, z0, x1, ...]`) or as `[x, y, z]` triples */
  positions: number[] | Vec3[] | Float32Array;
  /** One normal per vertex. Left out on triangles: smooth normals are computed. */
  normals?: number[] | Vec3[] | Float32Array;
  /** u, v of each vertex, flat or as `[u, v]` pairs */
  uvs?: number[] | [number, number][] | Float32Array;
  /** One colour per vertex: hex numbers (`0xff0000`), or linear RGBA floats. Needs `vertexColors: true` on the material. */
  colors?: number[] | Float32Array;
  /** Vertex indices; three per triangle, counter-clockwise seen from the front */
  indices?: number[] | Uint16Array | Uint32Array;
  /** `"triangle-list"` (default), `"line-list"`, `"line-strip"` or `"point-list"` */
  topology?: "triangle-list" | "triangle-strip" | "line-list" | "line-strip" | "point-list";
}

/** A polyline through points; draw it with a `"flat"` material. */
export interface LinesGeometrySpec {
  type: "lines";
  points: Vec3[];
  /** Joins the last point back to the first */
  closed?: boolean;
  colors?: number[];
}

/** Single points; draw them with a `"flat"` material. */
export interface PointsGeometrySpec {
  type: "points";
  points: Vec3[];
  colors?: number[];
}

/** A grid of `segments × segments` squares on the ground, raised by `height`. */
export interface TerrainGeometrySpec {
  type: "terrain";
  /** Size along X. Default 10 */
  width?: number;
  /** Size along Z. Default 10 */
  depth?: number;
  /** Squares per side, or `[alongX, alongZ]`. Default 32 */
  segments?: number | [number, number];
  /** Height at each point: `(x, z) => y`, or rows of heights (`heights[row][column]`, rows along Z) */
  height?: ((x: number, z: number) => number) | number[][];
  /** Colours by height: `[[height, color], ...]` sorted by height. Needs `vertexColors: true`. */
  colorStops?: [number, number][];
}

export type ProceduralGeometrySpec = CustomGeometrySpec | LinesGeometrySpec | PointsGeometrySpec | TerrainGeometrySpec;

export const PROCEDURAL_TYPES = ["custom", "lines", "points", "terrain"];

const flatten = (values: any, size: number): Float32Array => {
  if (values instanceof Float32Array) return values;
  const flat = Array.isArray(values[0]) ? (values as number[][]).flat() : (values as number[]);
  if (flat.length % size !== 0) throw new Error(`expected ${size} numbers per vertex`);
  return new Float32Array(flat);
};

/** Hex colours (sRGB) become linear RGBA floats; float arrays pass through. */
function toLinearColors(colors: number[] | Float32Array, vertexCount: number): Float32Array {
  if (colors instanceof Float32Array) return colors;
  if (colors.length === vertexCount * 4 && colors.every((value) => value <= 1)) return new Float32Array(colors);
  const out = new Float32Array(vertexCount * 4);
  const color = new Color();
  for (let i = 0; i < vertexCount; i++) {
    color.setValue(colors[Math.min(i, colors.length - 1)] ?? 0xffffff);
    out.set([srgbToLinear(color.red), srgbToLinear(color.green), srgbToLinear(color.blue), 1], i * 4);
  }
  return out;
}

const indexArray = (indices: number[] | Uint16Array | Uint32Array, vertexCount: number) => {
  if (indices instanceof Uint16Array || indices instanceof Uint32Array) return indices;
  return vertexCount > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
};

/** Smooth normals: each vertex gets the average of the faces around it. */
export function computeNormals(positions: Float32Array, indices?: ArrayLike<number>): Float32Array {
  const normals = new Float32Array(positions.length);
  const count = indices ? indices.length : positions.length / 3;
  const index = (i: number) => (indices ? indices[i] : i);
  for (let i = 0; i + 2 < count; i += 3) {
    const a = index(i) * 3, b = index(i + 1) * 3, c = index(i + 2) * 3;
    const abx = positions[b] - positions[a], aby = positions[b + 1] - positions[a + 1], abz = positions[b + 2] - positions[a + 2];
    const acx = positions[c] - positions[a], acy = positions[c + 1] - positions[a + 1], acz = positions[c + 2] - positions[a + 2];
    // Counter-clockwise faces point toward the viewer
    const nx = aby * acz - abz * acy, ny = abz * acx - abx * acz, nz = abx * acy - aby * acx;
    for (const v of [a, b, c]) {
      normals[v] += nx;
      normals[v + 1] += ny;
      normals[v + 2] += nz;
    }
  }
  for (let v = 0; v < normals.length; v += 3) {
    const length = Math.hypot(normals[v], normals[v + 1], normals[v + 2]) || 1;
    normals[v] /= length;
    normals[v + 1] /= length;
    normals[v + 2] /= length;
  }
  return normals;
}

function customGeometry(spec: CustomGeometrySpec): Geometry3D {
  const positions = flatten(spec.positions, 3);
  const vertexCount = positions.length / 3;
  const topology = spec.topology ?? "triangle-list";
  const indices = spec.indices ? indexArray(spec.indices, vertexCount) : undefined;
  const isTriangles = topology.startsWith("triangle");
  const normals = spec.normals ? flatten(spec.normals, 3) : isTriangles ? computeNormals(positions, indices) : undefined;
  return new Geometry3D({
    positions,
    normals,
    uvs: spec.uvs ? flatten(spec.uvs, 2) : undefined,
    colors: spec.colors ? toLinearColors(spec.colors, vertexCount) : undefined,
    indices,
    topology: topology as any,
  });
}

function linesGeometry(spec: LinesGeometrySpec): Geometry3D {
  const count = spec.points.length;
  const indices: number[] = [];
  for (let i = 0; i < count - 1; i++) indices.push(i, i + 1);
  if (spec.closed && count > 2) indices.push(count - 1, 0);
  return customGeometry({ type: "custom", positions: spec.points, colors: spec.colors, indices, topology: "line-list" });
}

function pointsGeometry(spec: PointsGeometrySpec): Geometry3D {
  return customGeometry({ type: "custom", positions: spec.points, colors: spec.colors, topology: "point-list" });
}

function colorAt(stops: [number, number][], height: number): number {
  let color = stops[0][1];
  for (const [stopHeight, stopColor] of stops) if (height >= stopHeight) color = stopColor;
  return color;
}

function terrainGeometry(spec: TerrainGeometrySpec): Geometry3D {
  const width = spec.width ?? 10;
  const depth = spec.depth ?? 10;
  const [segX, segZ] = Array.isArray(spec.segments) ? spec.segments : [spec.segments ?? 32, spec.segments ?? 32];
  const height = spec.height;
  const heightAt = (column: number, row: number, x: number, z: number) => {
    if (typeof height === "function") return height(x, z);
    if (Array.isArray(height)) {
      const r = Math.round((row / segZ) * (height.length - 1));
      const line = height[r] ?? [];
      return line[Math.round((column / segX) * (line.length - 1))] ?? 0;
    }
    return 0;
  };

  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  for (let row = 0; row <= segZ; row++) {
    for (let column = 0; column <= segX; column++) {
      const x = (column / segX - 0.5) * width;
      const z = (row / segZ - 0.5) * depth;
      const y = heightAt(column, row, x, z);
      positions.push(x, y, z);
      uvs.push(column / segX, row / segZ);
      if (spec.colorStops?.length) colors.push(colorAt(spec.colorStops, y));
    }
  }
  const indices: number[] = [];
  for (let row = 0; row < segZ; row++) {
    for (let column = 0; column < segX; column++) {
      const a = row * (segX + 1) + column;
      const b = a + 1;
      const c = a + segX + 1;
      const d = c + 1;
      // Counter-clockwise seen from above (+Y)
      indices.push(a, c, b, b, c, d);
    }
  }
  return customGeometry({
    type: "custom",
    positions,
    uvs,
    indices,
    colors: colors.length ? colors : undefined,
  });
}

/** Builds a geometry for the `custom`, `lines`, `points` and `terrain` types. */
export function buildProceduralGeometry(spec: ProceduralGeometrySpec): Geometry3D {
  switch (spec.type) {
    case "lines": return linesGeometry(spec);
    case "points": return pointsGeometry(spec);
    case "terrain": return terrainGeometry(spec);
    default: return customGeometry(spec);
  }
}
