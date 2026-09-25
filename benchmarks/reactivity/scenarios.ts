import { computed, effect, signal } from "../../packages/core/node_modules/@signe/reactive/dist/index.js";
import {
  createComponent,
  destroyElement,
  loop,
  registerComponent,
  type Element,
} from "../../packages/core/src/engine/reactive";

/**
 * Minimal display object: keeps the engine cost visible without Pixi.
 * `live` and `destroyCalls` let the profiler report leaked or twice
 * destroyed instances.
 */
export class BenchDisplayObject {
  static live = 0;
  static destroyCalls = 0;

  children: BenchDisplayObject[] = [];
  parent: BenchDisplayObject | null = null;
  text = "";
  x = 0;
  y = 0;

  onInit(props: Record<string, unknown>) {
    BenchDisplayObject.live++;
    Object.assign(this, props);
  }

  onUpdate(props: Record<string, unknown>) {
    Object.assign(this, props);
  }

  onMount(element: Element, index?: number) {
    const parent = element.parent?.componentInstance as BenchDisplayObject | undefined;
    if (!parent) return;
    this.parent = parent;
    if (index === undefined || index < 0 || index >= parent.children.length) {
      parent.children.push(this);
    } else {
      parent.children.splice(index, 0, this);
    }
  }

  onDestroy(_parent?: unknown, afterDestroy?: () => void) {
    BenchDisplayObject.live--;
    BenchDisplayObject.destroyCalls++;
    afterDestroy?.();
    if (!this.parent) return;
    const index = this.parent.children.indexOf(this);
    if (index >= 0) {
      this.parent.children.splice(index, 1);
    }
    this.parent = null;
  }
}

registerComponent("BenchContainer", BenchDisplayObject);
registerComponent("BenchText", BenchDisplayObject);

export type Scenario = {
  name: string;
  description: string;
  run: () => void;
};

const itemTree = (id: number, x = 0) =>
  createComponent("BenchContainer", {
    x,
    children: [
      createComponent("BenchText", { text: `name-${id}` }),
      createComponent("BenchText", { text: `hp-${id}` }),
    ],
  });

/** Mounts `child` under a root element the way a scene is mounted. */
const mountRoot = (child: unknown) =>
  createComponent("BenchContainer", {
    isRoot: true,
    context: {},
    children: [child],
  });

export const scenarios: Scenario[] = [
  {
    name: "signals:create:1000",
    description: "Create and read 1000 signals",
    run() {
      const signals = Array.from({ length: 1000 }, (_, index) => signal(index));
      let total = 0;
      for (const value of signals) {
        total += value();
      }
      if (total < 0) throw new Error("unreachable");
    },
  },
  {
    name: "signals:computed-chain:1000-updates",
    description: "Propagate 1000 updates through a computed chain",
    run() {
      const source = signal(0);
      const doubled = computed(() => source() * 2);
      const tripled = computed(() => doubled() * 3);
      let current = 0;
      const subscription = effect(() => {
        current = tripled();
      });

      for (let index = 0; index < 1000; index++) {
        source.set(index);
      }

      subscription.subscription.unsubscribe();
      if (current < 0) throw new Error("unreachable");
    },
  },
  {
    name: "components:prop-update:1000",
    description: "Update one signal prop on 1000 components",
    run() {
      const values = Array.from({ length: 1000 }, (_, index) => signal(`item-${index}`));
      const elements = values.map((value) => createComponent("BenchText", { text: value }));

      for (let index = 0; index < values.length; index++) {
        values[index].set(`updated-${index}`);
      }

      destroyElement(elements);
    },
  },
  {
    name: "loop:initial:1000",
    description: "Render a 1000 item loop",
    run() {
      const items = signal(Array.from({ length: 1000 }, (_, index) => index));
      const subscription = loop(items, (item) =>
        createComponent("BenchText", { text: `item-${item}` })
      ).subscribe();

      subscription.unsubscribe();
    },
  },
  {
    name: "loop:append-remove:1000",
    description: "Push then splice 100 items on a 1000 item loop",
    run() {
      const items = signal(Array.from({ length: 1000 }, (_, index) => index));
      const subscription = loop(items, (item) =>
        createComponent("BenchText", { text: `item-${item}` })
      ).subscribe();

      for (let index = 0; index < 100; index++) {
        items().push(1000 + index);
      }
      for (let index = 0; index < 100; index++) {
        items().splice(items().length - 1, 1);
      }

      subscription.unsubscribe();
    },
  },
  {
    // A tracked list re-emitted every frame with mostly unchanged items
    // (e.g. a projectile list where one entry is added per frame).
    name: "loop:track:reemit-unchanged:500x60",
    description: "Re-emit a 500 item tracked list 60 times, one new item each time",
    run() {
      const initial = Array.from({ length: 500 }, (_, index) => ({ id: index }));
      const items = signal(initial);
      const subscription = loop(items, (item) =>
        createComponent("BenchContainer", { x: item.id }),
        { track: (item) => item.id }
      ).subscribe();

      let current = initial;
      for (let frame = 0; frame < 60; frame++) {
        current = [...current, { id: 500 + frame }];
        items.set(current);
      }

      subscription.unsubscribe();
    },
  },
  {
    // Every item gets a new object each frame: measures the patch path.
    name: "loop:track:patch-all:100x60",
    description: "Replace every item of a 100 item tracked list, 60 times",
    run() {
      const items = signal(Array.from({ length: 100 }, (_, index) => ({ id: index, x: 0 })));
      const subscription = loop(items, (item) => itemTree(item.id, item.x), {
        track: (item) => item.id,
      }).subscribe();

      for (let frame = 1; frame <= 60; frame++) {
        items.set(items().map((item) => ({ id: item.id, x: frame })));
      }

      subscription.unsubscribe();
    },
  },
  {
    // Same as patch-all, but items also read a signal shared by the scene
    // (camera zoom, name visibility...) that changes every frame. Leaked
    // throwaway elements would keep reacting to it.
    name: "loop:track:patch-all-shared-signal:100x60",
    description: "patch-all where every element also reads a shared signal updated each frame",
    run() {
      const zoom = signal(1);
      const items = signal(Array.from({ length: 100 }, (_, index) => ({ id: index, x: 0 })));
      const subscription = loop(items, (item) =>
        createComponent("BenchContainer", {
          x: item.x,
          scale: zoom,
          children: [createComponent("BenchText", { text: `item-${item.id}`, scale: zoom })],
        }),
        { track: (item) => item.id }
      ).subscribe();

      for (let frame = 1; frame <= 60; frame++) {
        items.set(items().map((item) => ({ id: item.id, x: frame })));
        zoom.set(1 + frame / 100);
      }

      subscription.unsubscribe();
    },
  },
  {
    // Replacing a scene: mount a 100 item tree under a root, then destroy it.
    name: "teardown:mounted-tree:100",
    description: "Mount 100 items (3 elements each) under a root, then destroy the root",
    run() {
      const items = signal(Array.from({ length: 100 }, (_, index) => ({ id: index })));
      const root = mountRoot(loop(items, (item) => itemTree(item.id), { track: (item) => item.id }));
      destroyElement(root);
    },
  },
];

export function selectScenarios(filter?: string): Scenario[] {
  if (!filter) return scenarios;
  const parts = filter.split(",").map((part) => part.trim()).filter(Boolean);
  return scenarios.filter((scenario) => parts.some((part) => scenario.name.includes(part)));
}
