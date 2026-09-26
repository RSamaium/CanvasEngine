import { Container as PixiContainer } from "pixi.js";
import { Container, h } from "canvasengine";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TestBed } from "../../packages/core/testing";

const visibleSetter = () => Object.getOwnPropertyDescriptor(PixiContainer.prototype, "visible")?.set;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("@pixi/layout visible accessor", () => {
  test("creating many layouts does not redefine the visible accessor", async () => {
    await TestBed.createComponent(Container, { flexDirection: "column" });
    const first = new PixiContainer();
    (first as any).layout = { width: 10 };
    const installed = visibleSetter();

    for (let i = 0; i < 20; i++) {
      const container = new PixiContainer();
      (container as any).layout = { width: 10 };
    }

    // Each redefinition would install a new setter function
    expect(visibleSetter()).toBe(installed);
  });

  test("hiding a laid out child still removes it from its parent layout", async () => {
    const root = await TestBed.createComponent(Container, { flexDirection: "column" }, [
      h(Container, { width: 10, height: 10 }),
      h(Container, { width: 10, height: 10 }),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const parent = root.componentInstance as any;
    const [first] = parent.children;
    const childCount = () => parent.layout.yoga.getChildCount();
    expect(childCount()).toBe(2);

    first.visible = false;
    expect(childCount()).toBe(1);

    first.visible = true;
    expect(childCount()).toBe(2);
  });

  test("removing a layout still restores the original accessor, and creating one installs the hook again", async () => {
    await TestBed.createComponent(Container, { flexDirection: "column" });
    const withLayout = new PixiContainer();
    (withLayout as any).layout = { width: 10 };
    const hook = visibleSetter();

    (withLayout as any).layout = null;
    const restored = visibleSetter();
    expect(restored).not.toBe(hook);

    const another = new PixiContainer();
    (another as any).layout = { width: 10 };
    expect(visibleSetter()).not.toBe(restored);
  });
});
