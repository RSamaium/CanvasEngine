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
