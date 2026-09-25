import { loop, Container, FocusContainer, h, signal, createComponent, registerComponent } from "canvasengine";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { TestBed } from "../../packages/core/testing";
import { destroyElement } from "../../packages/core/src/engine/reactive";
import { CanvasContainer } from "../../packages/core/src/components/Container";

/**
 * Container that counts live instances, so tests can detect element trees
 * that are created but never destroyed.
 */
class LeakProbe extends CanvasContainer {
  static alive = 0;
  static destroyCalls = 0;

  onInit(props: any) {
    LeakProbe.alive++;
    return super.onInit(props);
  }

  async onDestroy(parent: any, afterDestroy?: () => void) {
    LeakProbe.alive--;
    LeakProbe.destroyCalls++;
    return super.onDestroy(parent, afterDestroy);
  }
}
registerComponent("LeakProbe", LeakProbe);

const Probe = (props: any = {}) => createComponent("LeakProbe", props);

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

beforeEach(() => {
  LeakProbe.alive = 0;
  LeakProbe.destroyCalls = 0;
});

describe("teardown", () => {
  test("tears each loop element down once when its parent is destroyed", async () => {
    const items = signal([{ id: 0 }, { id: 1 }, { id: 2 }]);
    const element = await TestBed.createComponent(
      Container,
      {},
      loop(items, () => Probe(), { track: (item: any) => item.id })
    );

    destroyElement(element);
    await flush();

    expect(LeakProbe.destroyCalls).toBe(3);
  });
});

describe("loop with track: unchanged items", () => {
  test("does not call createElementFn again for items whose reference is unchanged", async () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const items = signal([a, b]);
    const render = vi.fn((item: any) => h(Container, { x: item.id }));

    await TestBed.createComponent(Container, {}, loop(items, render, { track: (item) => item.id }));
    expect(render).toHaveBeenCalledTimes(2);

    // Appending re-emits the whole array: only the new item must render
    items.set([a, b, { id: 3 }]);
    await flush();
    expect(render).toHaveBeenCalledTimes(3);

    // Reordering and removing unchanged items renders nothing
    items.set([b, a]);
    await flush();
    expect(render).toHaveBeenCalledTimes(3);
  });

  test("re-renders an existing key when its item reference changes", async () => {
    const items = signal([{ id: 1, x: 10 }]);
    const render = vi.fn((item: any) => h(Container, { x: item.x }));

    const container = await TestBed.createComponent(Container, {}, loop(items, render, { track: (item) => item.id }));
    const child = container.componentInstance.children[0];

    items.set([{ id: 1, x: 20 }]);
    await vi.waitFor(() => expect(child.x).toBe(20));

    expect(render).toHaveBeenCalledTimes(2);
    expect(container.componentInstance.children[0]).toBe(child);
  });

  test("re-renders when the index moves and the callback reads the index", async () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const items = signal([a, b]);
    const render = vi.fn((item: any, index: number) => h(Container, { x: index }));

    const container = await TestBed.createComponent(Container, {}, loop(items, render, { track: (item) => item.id }));
    const [first, second] = container.componentInstance.children;

    items.set([b, a]);
    await flush();

    expect(render).toHaveBeenCalledTimes(4);
    expect(first.x).toBe(1);
    expect(second.x).toBe(0);
  });

  test("array update operation skips unchanged item and patches changed item", async () => {
    const a = { id: 1, x: 1 };
    const items = signal([a]);
    const render = vi.fn((item: any) => h(Container, { x: item.x }));

    const container = await TestBed.createComponent(Container, {}, loop(items, render, { track: (item) => item.id }));
    const child = container.componentInstance.children[0];

    items()[0] = a;
    await flush();
    expect(render).toHaveBeenCalledTimes(1);

    items()[0] = { id: 1, x: 5 };
    await vi.waitFor(() => expect(child.x).toBe(5));
    expect(render).toHaveBeenCalledTimes(2);
  });

  test("duplicated keys do not mount the same element twice", async () => {
    const items = signal([{ id: 1 }]);
    const container = await TestBed.createComponent(
      Container,
      {},
      loop(items, (item: any) => h(Container, { x: item.id }), { track: (item) => item.id })
    );

    items.set([{ id: 1 }, { id: 1 }]);
    await flush();

    const children = container.componentInstance.children;
    expect(children.length).toBe(2);
    expect(children[0]).not.toBe(children[1]);
  });
});

describe("loop with track: no leaked elements", () => {
  test("destroys the throwaway tree built to patch an existing key", async () => {
    const items = signal([{ id: 1, x: 0 }]);
    await TestBed.createComponent(
      Container,
      {},
      loop(items, (item: any) => Probe({ x: item.x, children: [Probe()] }), { track: (item) => item.id })
    );
    expect(LeakProbe.alive).toBe(2);

    for (let frame = 1; frame <= 50; frame++) {
      items.set([{ id: 1, x: frame }]);
    }
    await flush();

    // One mounted item with one child, whatever the number of updates
    expect(LeakProbe.alive).toBe(2);
  });

  test("keeps mounted children attached to the tracked element after a patch", async () => {
    const items = signal([{ id: 1, x: 0 }]);
    const container = await TestBed.createComponent(
      Container,
      {},
      loop(items, (item: any) => Probe({ x: item.x, children: [Probe()] }), { track: (item) => item.id })
    );
    const mountedChild = container.componentInstance.children[0].children[0];

    items.set([{ id: 1, x: 1 }]);
    await flush();
    items.set([]);
    await flush();

    // Removing the item must destroy the child that was actually mounted
    expect(mountedChild.destroyed).toBe(true);
    expect(LeakProbe.alive).toBe(0);
  });
});

describe("FocusContainer child subscriptions", () => {
  test("releases loop children when the container is destroyed", async () => {
    const items = signal([{ id: 0 }, { id: 1 }]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const element = await TestBed.createComponent(
      FocusContainer,
      { tabindex: 0 },
      [loop(items, (item: any) => Probe({ tabindex: item.id }))],
      { enableLayout: false }
    );
    // Wait for the deferred registerChildren
    await flush();
    expect(LeakProbe.alive).toBe(2);

    destroyElement(element);
    await flush();
    expect(LeakProbe.alive).toBe(0);

    // Updates after destruction must not reach the destroyed container
    items.set([{ id: 0 }, { id: 1 }, { id: 2 }]);
    await flush();
    expect(LeakProbe.alive).toBe(0);
    expect(warn.mock.calls.flat().join(" ")).not.toContain("not found");
    warn.mockRestore();
  });

  test("does not register children when destroyed before the deferred registration", async () => {
    const items = signal([{ id: 0 }]);
    const element = await TestBed.createComponent(
      FocusContainer,
      { tabindex: 0 },
      [loop(items, (item: any) => Probe({ tabindex: item.id }))],
      { enableLayout: false }
    );

    destroyElement(element);
    await flush();
    expect(LeakProbe.alive).toBe(0);
  });
});
