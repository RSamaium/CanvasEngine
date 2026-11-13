import { beforeEach, describe, expect, test, vi } from "vitest";
import { signal } from "canvasengine";
import { createComponent } from "../../packages/core/src/engine/reactive";
import "../../packages/3d/src/index";
import { BloomEffect, OutlinePass } from "@pixi/3d/extras";
import { Container3D, CubeGeometry, Material3D, Quaternion, SphereGeometry, Vector3 } from "@pixi/3d";
import { Ticker } from "pixi.js";

/** A stand-in for the `<View3D>` component: a scene root and a pass registry. */
function fakeView() {
  const root = new Container3D();
  const registered = new Map<object, { passes: any[]; group: string }>();
  const instance = {
    isView3DComponent: true,
    childTarget3D: root,
    view: { root, camera: null },
    registerPasses: vi.fn((owner: object, passes: any[], group: string) => registered.set(owner, { passes, group })),
    unregisterPasses: vi.fn((owner: object) => registered.delete(owner)),
  };
  const element: any = { tag: "View3D", componentInstance: instance, parent: null, props: {} };
  return { root, instance, element, registered };
}

/** Creates a component and mounts it under `parent`, as the engine does. */
function mountUnder(parent: any, tag: string, props: Record<string, any>) {
  const element: any = createComponent(tag, props);
  element.parent = parent;
  element.componentInstance.onMount(element);
  return element;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("@canvasengine/3d components", () => {
  let view: ReturnType<typeof fakeView>;

  beforeEach(() => {
    view = fakeView();
  });

  describe("Mesh3D", () => {
    test("attaches to the scene root with its transform", () => {
      const element = mountUnder(view.element, "Mesh3D", {
        geometry: { type: "cube", width: 2 },
        position: [1, 2, 3],
        rotation: [0, Math.PI, 0],
        scale: 2,
      });
      const mesh = element.componentInstance;
      expect(view.root.children).toContain(mesh);
      expect([mesh.position.x, mesh.position.y, mesh.position.z]).toEqual([1, 2, 3]);
      expect(mesh.rotation.y).toBeCloseTo(Math.PI);
      expect(mesh.scale.x).toBe(2);
      expect(mesh.geometry).toBeInstanceOf(CubeGeometry);
    });

    test("follows a signal inside the position array", () => {
      const x = signal(0);
      const mesh = mountUnder(view.element, "Mesh3D", { position: [x, 1, 0] }).componentInstance;
      x.set(5);
      expect(mesh.position.x).toBe(5);
      expect(mesh.position.y).toBe(1);
    });

    test("builds the material, then patches colours in place", async () => {
      const color = signal(0xff0000);
      const mesh = mountUnder(view.element, "Mesh3D", {
        geometry: { type: "sphere" },
        material: { baseColor: color, roughness: 0.4 },
      }).componentInstance;
      await settle();
      const material = mesh.material;
      expect(material).toBeInstanceOf(Material3D);
      expect(material.roughness).toBeCloseTo(0.4);
      color.set(0x00ff00);
      expect(mesh.material).toBe(material);
      expect(material.baseColor).toBe(0x00ff00);
    });

    test("rebuilds the geometry when it changes", () => {
      const geometry = signal<any>({ type: "cube" });
      const mesh = mountUnder(view.element, "Mesh3D", { geometry }).componentInstance;
      geometry.set({ type: "sphere", radius: 2 });
      expect(mesh.geometry).toBeInstanceOf(SphereGeometry);
    });

    test("turns picking on when given an event handler", () => {
      const mesh = mountUnder(view.element, "Mesh3D", { click: () => {} }).componentInstance;
      expect(mesh.eventMode).toBe("static");
    });

    test("reads a frame from an object signal", () => {
      const frame = signal({ x: 0, y: 0, width: 96, height: 96 });
      const sprite = mountUnder(view.element, "Sprite3D", { frame, position: [0, 0, 0] }).componentInstance;
      frame.set({ x: 96, y: 192, width: 96, height: 96 });
      expect(sprite.fullProps.frame).toEqual({ x: 96, y: 192, width: 96, height: 96 });
    });

    test("leaves the scene on destroy", () => {
      const element = mountUnder(view.element, "Mesh3D", { geometry: { type: "cube" } });
      const mesh = element.componentInstance;
      mesh.onDestroy(view.element, () => {});
      expect(view.root.children).not.toContain(mesh);
      expect(mesh.destroyed).toBe(true);
    });
  });

  describe("Group3D", () => {
    test("holds its children", () => {
      const group = mountUnder(view.element, "Group3D", { position: [0, 2, 0] });
      const child = mountUnder(group, "Mesh3D", { position: [1, 0, 0] }).componentInstance;
      expect(group.componentInstance.children).toContain(child);
    });
  });

  describe("Lights", () => {
    test("applies light fields and shadow settings", () => {
      const light = mountUnder(view.element, "DirectionalLight", {
        intensity: 3,
        castShadow: true,
        shadow: { cascades: 2, maxDistance: 40, bias: 0.001, bounds: { min: [-5, 0, -5], max: [5, 5, 5] } },
      }).componentInstance;
      expect(light.intensity).toBe(3);
      expect(light.castShadow).toBe(true);
      expect(light.shadow.cascades).toBe(2);
      expect(light.shadow.maxDistance).toBe(40);
      expect(light.shadow.bias).toBe(0.001);
      expect(light.shadow.bounds.max.x).toBe(5);
    });
  });

  describe("Effects", () => {
    test("register their pass with the view", () => {
      const element = mountUnder(view.element, "Bloom", { threshold: 1, intensity: 2 });
      const entry = view.registered.get(element.componentInstance)!;
      expect(entry.group).toBe("effect");
      expect(entry.passes[0]).toBeInstanceOf(BloomEffect);
      expect(entry.passes[0].intensity).toBe(2);
    });

    test("update live options in place and toggle with enabled", () => {
      const intensity = signal(1);
      const enabled = signal(true);
      const element = mountUnder(view.element, "Bloom", { intensity, enabled });
      const effect = element.componentInstance.effect;
      intensity.set(3);
      enabled.set(false);
      expect(element.componentInstance.effect).toBe(effect);
      expect(effect.intensity).toBe(3);
      expect(effect.enabled).toBe(false);
    });

    test("rebuild for an option without a setter", () => {
      const width = signal(0.02);
      const element = mountUnder(view.element, "Outline", { width });
      const first = element.componentInstance.effect;
      width.set(0.05);
      expect(element.componentInstance.effect).not.toBe(first);
      expect(element.componentInstance.effect).toBeInstanceOf(OutlinePass);
    });

    test("unregister on destroy", () => {
      const element = mountUnder(view.element, "Fxaa", {});
      element.componentInstance.onDestroy(view.element, () => {});
      expect(view.registered.size).toBe(0);
    });
  });

  describe("Camera3D", () => {
    test("configures the view's camera", () => {
      const camera = new (class extends Container3D {
        fov = 60;
      })();
      view.instance.view.camera = camera as any;
      view.root.addChild(camera);
      mountUnder(view.element, "Camera3D", { position: [0, 5, 10], fov: 45 });
      expect(camera.fov).toBe(45);
      expect([camera.position.x, camera.position.y, camera.position.z]).toEqual([0, 5, 10]);
    });
  });
});

describe("View3D pass registry", () => {
  test("orders camera passes, then the passes prop, then effects", () => {
    const element: any = createComponent("View3D", { passes: [] });
    const instance = element.componentInstance;
    const custom = { name: "custom" } as any;
    instance.onUpdate({ passes: [custom] });
    const effect = { name: "effect" } as any;
    const camera = { name: "camera" } as any;
    instance.registerPasses({}, [effect], "effect");
    instance.registerPasses({}, [camera], "camera");
    expect(instance.view.passes.map((p: any) => p.name)).toEqual(["camera", "custom", "effect"]);
  });
});

describe("Instances", () => {
  test("writes one slot per item and hides the spares", async () => {
    const view = fakeView();
    const element = mountUnder(view.element, "Instances", {
      geometry: { type: "cube" },
      material: { baseColor: 0xffffff },
      items: [{ position: [1, 0, 0] }, { position: [2, 0, 0], color: 0xff0000 }, { visible: false }],
      capacity: 5,
    });
    await settle();
    const batch = element.componentInstance.batch;
    expect(batch.size).toBe(5);
    expect([0, 1, 2, 3, 4].map((i) => batch.getVisibleAt(i))).toEqual([true, true, false, false, false]);
  });
});

describe("Model3D bone attachment", () => {
  /**
   * A model stand-in: a skinned mesh scaled by 10, with a two-bone skeleton whose
   * "hand" bone sits 1 unit up from "root" (10 units once the mesh scale applies).
   */
  async function fakeRiggedModel() {
    const { Skeleton, Mesh3D } = await import("@pixi/3d");
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const skeleton = new Skeleton({
      parent: new Int16Array([-1, 0]),
      joints: new Int16Array([0, 1]),
      inverseBindMatrices: new Float32Array([...identity, ...identity]),
      labels: ["root", "hand"],
    });
    skeleton.setLocalTRS(1, 0, 1, 0, 0, 0, 0, 1);
    const model: any = new Container3D();
    const skinned = new Mesh3D({ skeleton } as any);
    skinned.scale.set(10, 10, 10);
    model.addChild(skinned);
    model.skeletons = [skeleton];
    return { model, skeleton };
  }

  test("follows a bone that exists only in the skeleton", async () => {
    const view = fakeView();
    const element = mountUnder(view.element, "Model3D", {});
    const component = element.componentInstance;
    const { model, skeleton } = await fakeRiggedModel();
    component.model = model;
    component.addChild(model);

    const sword = new Container3D();
    component.addChild(sword);
    component.attachToBone(sword, "hand");
    expect(sword.getGlobalTransform().elements[13]).toBeCloseTo(10);

    // The pose changes: the attached node follows on the next frame
    skeleton.setLocalTRS(1, 2, 1, 0, 0, 0, 0, 1);
    Ticker.shared.update(performance.now() + 1000);
    const world = sword.getGlobalTransform().elements;
    expect(world[12]).toBeCloseTo(20);
    expect(world[13]).toBeCloseTo(10);
    // The socket cancels the bone's scale: the sword keeps its own size
    const scale = new Vector3();
    sword.getGlobalTransform().decompose(new Vector3(), new Quaternion(), scale);
    expect(scale.x).toBeCloseTo(1);

    component.detachFromBone(sword);
    expect(component.children.some((child: any) => String(child.label).endsWith(":follower"))).toBe(false);
  });

  test("warns with the bone names when the bone is unknown", async () => {
    const view = fakeView();
    const component = mountUnder(view.element, "Model3D", {}).componentInstance;
    const { model } = await fakeRiggedModel();
    component.model = model;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    component.attachToBone(new Container3D(), "tail");
    expect(warn.mock.calls[0][0]).toContain("hand");
    warn.mockRestore();
  });
});
