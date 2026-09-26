import {
  Container,
  configureTeardown,
  createComponent,
  flushTeardown,
  h,
  loop,
  mount,
  pendingTeardownCount,
  registerComponent,
  signal,
} from "canvasengine";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TestBed } from "../../packages/core/testing";
import { destroyElement } from "../../packages/core/src/engine/reactive";
import { CanvasContainer } from "../../packages/core/src/components/Container";
import { DOMContainer } from "../../packages/core/src/components/DOMContainer";
import { registerDirective } from "../../packages/core/src/engine/directive";

const directiveDestroyed = vi.fn();
class TestInputDirective {
  onInit() {}
  onMount() {}
  onUpdate() {}
  onDestroy() {
    directiveDestroyed();
  }
}
registerDirective("testInput", TestInputDirective);

/** Container that records its lifecycle. */
class TeardownProbe extends CanvasContainer {
  static alive = 0;
  static destroyCalls = 0;
  static updatesAfterTeardown = 0;
  static onDestroyHook: ((probe: TeardownProbe) => void) | null = null;

  onInit(props: any) {
    TeardownProbe.alive++;
    return super.onInit(props);
  }

  onUpdate(props: any) {
    if (this.isTearingDown) TeardownProbe.updatesAfterTeardown++;
    return super.onUpdate(props);
  }

  async onDestroy(parent: any, afterDestroy?: () => void) {
    TeardownProbe.alive--;
    TeardownProbe.destroyCalls++;
    TeardownProbe.onDestroyHook?.(this);
    return super.onDestroy(parent, afterDestroy);
  }
}
registerComponent("TeardownProbe", TeardownProbe);

const Probe = (props: any = {}) => createComponent("TeardownProbe", props);

const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

beforeEach(() => {
  TeardownProbe.alive = 0;
  TeardownProbe.destroyCalls = 0;
  TeardownProbe.updatesAfterTeardown = 0;
  TeardownProbe.onDestroyHook = null;
  directiveDestroyed.mockClear();
});

afterEach(() => {
  configureTeardown({ deferred: false, budgetMs: 4 });
});

describe("teardown: the root leaves the stage once", () => {
  test("descendants are destroyed after the root left the stage", async () => {
    const root = await TestBed.createComponent(Container, {}, [
      Probe({ children: [Probe(), Probe()] }),
      Probe(),
    ]);
    const rootInstance = root.componentInstance as any;
    const stage = rootInstance.parent;
    const removedFromStage = vi.fn();
    stage.on("childRemoved", removedFromStage);

    const rootAttachedWhenDestroyed: boolean[] = [];
    TeardownProbe.onDestroyHook = () => {
      rootAttachedWhenDestroyed.push(rootInstance.parent !== null);
    };

    destroyElement(root);
    await flush();

    expect(rootAttachedWhenDestroyed).toEqual([false, false, false, false]);
    expect(removedFromStage).toHaveBeenCalledTimes(1);
    expect(TeardownProbe.alive).toBe(0);
  });

  test("an element with an exit hook stays on stage until the hook resolves", async () => {
    let finishExit!: () => void;
    const exit = new Promise<void>((resolve) => {
      finishExit = resolve;
    });
    const root = await TestBed.createComponent(Container, { onBeforeDestroy: () => exit }, [Probe()]);
    const rootInstance = root.componentInstance as any;
    const stage = rootInstance.parent;

    destroyElement(root);
    await flush();
    expect(stage.children).toContain(rootInstance);

    finishExit();
    await flush();
    expect(stage.children).not.toContain(rootInstance);
  });

  test("destroying a layout parent does not rebuild its layout", async () => {
    const root = await TestBed.createComponent(Container, {}, [
      Probe({ width: "50%" }),
      Probe({ width: "50%" }),
    ]);
    const rootInstance = root.componentInstance as any;
    const rehydrate = vi.spyOn(rootInstance, "rehydrateLayoutSubtree");
    const detach = vi.spyOn(rootInstance, "detachLayoutSubtree");

    destroyElement(root);
    await flush();

    expect(rehydrate).not.toHaveBeenCalled();
    expect(detach).not.toHaveBeenCalled();
  });
});

describe("teardown: no reactive propagation into the torn down tree", () => {
  test("a signal written by a destroy hook does not update the tree", async () => {
    const position = signal(0);
    const Writer = () => {
      mount(() => () => position.set(99));
      return h(Container);
    };

    const root = await TestBed.createComponent(Container, {}, [h(Writer), Probe({ x: position })]);
    const reader = (root.componentInstance as any).children[1];

    destroyElement(root);
    await flush();

    expect(reader.fullProps.x).toBe(0);
    expect(TeardownProbe.updatesAfterTeardown).toBe(0);
  });

  test("a loop in the torn down tree does not rebuild when its items change", async () => {
    const items = signal([1, 2]);
    const render = vi.fn(() => Probe());
    const Writer = () => {
      mount(() => () => items.set([1, 2, 3, 4]));
      return h(Container);
    };

    const root = await TestBed.createComponent(Container, {}, [
      h(Writer),
      h(Container, {}, loop(items, render)),
    ]);
    expect(render).toHaveBeenCalledTimes(2);

    destroyElement(root);
    await flush();

    expect(render).toHaveBeenCalledTimes(2);
    expect(TeardownProbe.alive).toBe(0);
  });
});

describe("teardown: deferred mode", () => {
  test("the tree leaves the stage at once and is destroyed later", async () => {
    configureTeardown({ deferred: true });
    const root = await TestBed.createComponent(Container, {}, [
      Probe({ children: [Probe(), Probe()] }),
      Probe(),
    ]);
    const rootInstance = root.componentInstance as any;
    const stage = rootInstance.parent;

    destroyElement(root);

    expect(stage.children).not.toContain(rootInstance);
    expect(TeardownProbe.alive).toBe(4);
    expect(pendingTeardownCount()).toBe(1);

    await vi.waitFor(() => expect(pendingTeardownCount()).toBe(0));
    expect(TeardownProbe.alive).toBe(0);
    expect(TeardownProbe.destroyCalls).toBe(4);
  });

  test("runs one task per chunk with no budget, children before their parent", async () => {
    configureTeardown({ deferred: true, budgetMs: 0 });
    const items = signal(Array.from({ length: 20 }, (_, index) => index));
    const root = await TestBed.createComponent(Container, {}, [Probe({ id: "parent", children: [loop(items, () => Probe())] })]);
    await flush();
    const order: string[] = [];
    TeardownProbe.onDestroyHook = (probe) => order.push(probe.fullProps.id ?? "child");

    destroyElement(root);
    const pendingAfterEachChunk: number[] = [];
    while (pendingTeardownCount() > 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      pendingAfterEachChunk.push(pendingTeardownCount());
    }

    // Each chunk runs one task: the count never drops by more than one
    for (let i = 1; i < pendingAfterEachChunk.length; i++) {
      expect(pendingAfterEachChunk[i - 1] - pendingAfterEachChunk[i]).toBeLessThanOrEqual(1);
    }
    expect(order).toHaveLength(21);
    expect(order[order.length - 1]).toBe("parent");
    expect(TeardownProbe.alive).toBe(0);
  });

  test("elements waiting in the queue take no updates", async () => {
    configureTeardown({ deferred: true });
    const position = signal(0);
    const root = await TestBed.createComponent(Container, {}, [Probe({ x: position })]);
    const probe = (root.componentInstance as any).children[0];

    destroyElement(root);
    position.set(42);

    expect(probe.x).toBe(0);
    expect(TeardownProbe.updatesAfterTeardown).toBe(0);
    flushTeardown();
  });

  test("directives of the whole tree stop at once, only once", async () => {
    configureTeardown({ deferred: true });
    const items = signal([1, 2]);
    const root = await TestBed.createComponent(Container, {}, [
      Probe({ testInput: true, children: [Probe({ testInput: true })] }),
      h(Container, {}, loop(items, () => Probe({ testInput: true }))),
    ]);
    await flush();

    destroyElement(root);
    expect(directiveDestroyed).toHaveBeenCalledTimes(4);

    flushTeardown();
    expect(directiveDestroyed).toHaveBeenCalledTimes(4);
    expect(TeardownProbe.alive).toBe(0);
  });

  test("DOM elements are hidden at once", async () => {
    configureTeardown({ deferred: true });
    const root = await TestBed.createComponent(Container, {}, [h(DOMContainer, {})]);
    const domContainer = (root.componentInstance as any).children[0];

    destroyElement(root);
    expect(domContainer.element.style.display).toBe("none");
    flushTeardown();
  });

  test("a signal written by a destroy hook does not update the tree", async () => {
    configureTeardown({ deferred: true, budgetMs: 0 });
    const position = signal(0);
    const Writer = () => {
      mount(() => () => position.set(99));
      return h(Container);
    };
    const root = await TestBed.createComponent(Container, {}, [h(Writer), Probe({ x: position })]);
    const reader = (root.componentInstance as any).children[1];

    destroyElement(root);
    await vi.waitFor(() => expect(pendingTeardownCount()).toBe(0));

    expect(reader.fullProps.x).toBe(0);
    expect(TeardownProbe.updatesAfterTeardown).toBe(0);
  });

  test("turning deferred mode off flushes the queue", async () => {
    configureTeardown({ deferred: true });
    const root = await TestBed.createComponent(Container, {}, [Probe(), Probe()]);

    destroyElement(root);
    expect(TeardownProbe.alive).toBe(2);

    configureTeardown({ deferred: false });
    expect(pendingTeardownCount()).toBe(0);
    expect(TeardownProbe.alive).toBe(0);
  });
});
