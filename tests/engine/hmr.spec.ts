import { bootstrapCanvas, Canvas, Container, createHotComponent, h, mount } from "canvasengine";
import { describe, expect, test, vi } from "vitest";
import { TestBed } from "../../packages/core/testing";

describe("component HMR", () => {
  test("remounts only the hot component subtree", async () => {
    const mounted = vi.fn();
    const unmounted = vi.fn();
    const hotId = `hmr-test-${Date.now()}-${Math.random()}`;

    const HotChild = createHotComponent(hotId, () => {
      mount(() => {
        mounted("v1");
        return () => unmounted("v1");
      });
      return h(Container, { x: 1 });
    });

    function Parent() {
      return h(Container, {}, h(HotChild));
    }

    const parent = await TestBed.createComponent(Parent);

    expect(parent.componentInstance.children.length).toBe(1);
    expect(parent.componentInstance.children[0].x).toBe(1);
    expect(mounted).toHaveBeenCalledWith("v1");

    createHotComponent(hotId, () => {
      mount(() => {
        mounted("v2");
        return () => unmounted("v2");
      });
      return h(Container, { x: 2 });
    });

    await vi.waitFor(() => {
      expect(parent.componentInstance.children.length).toBe(1);
      expect(parent.componentInstance.children[0].x).toBe(2);
    });

    expect(unmounted).toHaveBeenCalledWith("v1");
    expect(mounted).toHaveBeenCalledWith("v2");
  });

  test("updates a hot root component without recreating the Pixi application", async () => {
    const hotId = `hmr-root-test-${Date.now()}-${Math.random()}`;

    const HotRoot = createHotComponent(hotId, () => {
      return h(Canvas, { tickStart: false }, h(Container, { x: 1 }));
    });

    const root = document.getElementById("root");
    const { app, hmrSubscription } = await bootstrapCanvas(root, HotRoot);

    expect(app.stage.children[0].x).toBe(1);

    createHotComponent(hotId, () => {
      return h(Canvas, { tickStart: false }, h(Container, { x: 2 }));
    });

    await vi.waitFor(() => {
      expect(app.stage.children[0].x).toBe(2);
    });

    hmrSubscription?.unsubscribe();
  });
});
