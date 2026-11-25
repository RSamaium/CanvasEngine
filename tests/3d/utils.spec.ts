import { describe, expect, test } from "vitest";
import { deepMerge, mergeVec3, resolveObjectChanges, toVec3 } from "../../packages/3d/src/utils";
import { buildGeometry, canPatchMaterial } from "../../packages/3d/src/builders";
import { CubeGeometry, SphereGeometry } from "@pixi/3d";

describe("3d utils", () => {
  describe("toVec3", () => {
    test("reads arrays, objects and numbers", () => {
      expect(toVec3([1, 2, 3])).toEqual({ x: 1, y: 2, z: 3 });
      expect(toVec3({ x: 1, z: 3 })).toEqual({ x: 1, y: 0, z: 3 });
      expect(toVec3(2)).toEqual({ x: 2, y: 2, z: 2 });
      expect(toVec3(undefined)).toBeUndefined();
    });

    test("uses the fallback for missing axes", () => {
      expect(toVec3([2], 1)).toEqual({ x: 2, y: 1, z: 1 });
    });
  });

  test("mergeVec3 keeps the current value of missing object axes", () => {
    expect(mergeVec3({ x: 1, y: 2, z: 3 }, { y: 5 })).toEqual({ x: 1, y: 5, z: 3 });
    expect(mergeVec3({ x: 1, y: 2, z: 3 }, [0, 0, 0])).toEqual({ x: 0, y: 0, z: 0 });
  });

  test("deepMerge merges nested plain objects and replaces the rest", () => {
    const merged = deepMerge({ material: { baseColor: 1, roughness: 0.5 }, position: [0, 0, 0] }, { material: { baseColor: 2 }, position: [1, 1, 1] });
    expect(merged).toEqual({ material: { baseColor: 2, roughness: 0.5 }, position: [1, 1, 1] });
  });

  describe("resolveObjectChanges", () => {
    test("turns init and reset records into the object", () => {
      const frame = { x: 96, y: 0, width: 96, height: 96 };
      expect(resolveObjectChanges({ frame: { type: "reset", value: frame } }, {})).toEqual({ frame });
      expect(resolveObjectChanges({ frame: { type: "init", value: frame } }, {})).toEqual({ frame });
    });

    test("merges an update record into the previous object", () => {
      const previous = { frame: { x: 0, y: 0, width: 96, height: 96 } };
      const props = resolveObjectChanges({ frame: { type: "update", key: "x", value: 192 } }, previous);
      expect(props.frame).toEqual({ x: 192, y: 0, width: 96, height: 96 });
    });

    test("removes a key on a remove record", () => {
      const previous = { camera: { fov: 50, near: 1 } };
      expect(resolveObjectChanges({ camera: { type: "remove", key: "near", value: 1 } }, previous).camera).toEqual({ fov: 50 });
    });

    test("leaves ordinary props alone", () => {
      const props = { geometry: { type: "cube", width: 2 }, material: { type: "toon", value: 3, bands: 2 } };
      expect(resolveObjectChanges(props, {})).toBe(props);
    });
  });
});

describe("3d builders", () => {
  test("buildGeometry builds a primitive from its spec", () => {
    const built = buildGeometry({ type: "cube", width: 2 });
    expect(built?.geometry).toBeInstanceOf(CubeGeometry);
    expect(built?.owned).toBe(true);
  });

  test("buildGeometry passes a Geometry3D through, not owned", () => {
    const sphere = new SphereGeometry({ radius: 1 });
    expect(buildGeometry(sphere)).toEqual({ geometry: sphere, owned: false });
  });

  test("buildGeometry returns null for an unknown type", () => {
    expect(buildGeometry({ type: "pyramid" as any })).toBeNull();
  });

  test("canPatchMaterial accepts only fields a material takes live", () => {
    expect(canPatchMaterial({ baseColor: 0xff0000, roughness: 0.2 })).toBe(true);
    expect(canPatchMaterial({ emissive: { color: 0xff0000 } })).toBe(false);
    expect(canPatchMaterial({ type: "flat" })).toBe(false);
  });
});

describe("procedural geometries", async () => {
  const { buildProceduralGeometry, computeNormals } = await import("../../packages/3d/src/geometries");

  test("custom: computes smooth normals for triangles", async () => {
    const geometry: any = buildProceduralGeometry({
      type: "custom",
      positions: [[0, 0, 0], [1, 0, 0], [0, 0, -1]],
      indices: [0, 1, 2],
    });
    // Normals are stored quantized: read them back as floats
    const { getAttributeData } = await import("@pixi/3d");
    const normals = Array.from(getAttributeData(geometry, "aNormal", 3));
    // Counter-clockwise seen from above: the face points up
    expect(normals.slice(0, 3).map((v) => Math.round(v))).toEqual([0, 1, 0]);
  });

  test("custom: hex colours become linear RGBA", () => {
    const geometry: any = buildProceduralGeometry({
      type: "custom",
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      colors: [0xffffff, 0x000000, 0xff0000],
    });
    const colors = Array.from(geometry.attributes.aColor.buffer.data as Float32Array).slice(0, 12);
    expect(colors.slice(0, 4)).toEqual([1, 1, 1, 1]);
    expect(colors.slice(8, 12)).toEqual([1, 0, 0, 1]);
  });

  test("lines: joins the points, and closes the loop when asked", () => {
    const open: any = buildProceduralGeometry({ type: "lines", points: [[0, 0, 0], [1, 0, 0], [1, 1, 0]] });
    expect(Array.from(open.indices)).toEqual([0, 1, 1, 2]);
    const closed: any = buildProceduralGeometry({ type: "lines", points: [[0, 0, 0], [1, 0, 0], [1, 1, 0]], closed: true });
    expect(Array.from(closed.indices)).toEqual([0, 1, 1, 2, 2, 0]);
  });

  test("terrain: one vertex per grid point, raised by the height function", () => {
    const geometry: any = buildProceduralGeometry({ type: "terrain", width: 2, depth: 2, segments: 2, height: (x: number) => x });
    const positions = geometry.positions as Float32Array;
    expect(positions.length / 3).toBe(9);
    expect(geometry.indices.length).toBe(2 * 2 * 6);
    // First vertex at x = -1 has height -1
    expect([positions[0], positions[1], positions[2]]).toEqual([-1, -1, -1]);
  });

  test("terrain: flat ground normals point up", () => {
    const geometry: any = buildProceduralGeometry({ type: "terrain", segments: 1 });
    const normals = computeNormals(geometry.positions, geometry.indices);
    expect(Math.round(normals[1])).toBe(1);
  });
});

describe("dissolve", async () => {
  const { applyDissolve, normalizeDissolve } = await import("../../packages/3d/src/dissolve");

  test("normalizes a number or settings", () => {
    expect(normalizeDissolve(0.5)).toEqual({ amount: 0.5 });
    expect(normalizeDissolve({ amount: 1, edgeColor: 0xff0000 })).toEqual({ amount: 1, edgeColor: 0xff0000 });
    expect(normalizeDissolve(undefined)).toBeNull();
  });

  test("writes amount, edge colour in linear light and hole size", () => {
    const material: any = { data: {} };
    applyDissolve(material, { amount: 2, edgeColor: 0xff0000, edgeStrength: 3, holeSize: 25 });
    expect(material.data.dissolve).toBe(1);
    expect(material.data.dissolveEdgeColor).toEqual([3, 0, 0]);
    expect(material.data.dissolveHoleSize).toBe(25);
  });
});
