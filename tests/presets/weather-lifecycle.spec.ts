import { describe, expect, test, vi } from "vitest";

const registered = vi.hoisted(() => new Map<string, any>());

vi.mock("canvasengine", async importOriginal => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    registerComponent: (name: string, component: any) => {
      registered.set(name, component);
      actual.registerComponent(name, component);
    },
  };
});

await import("../../packages/presets/src/Weathers");

const LAYERS = ["RainTextureLayer", "RainImpactLayer", "WeatherParticleLayer"];

const createTick = () => {
  const subscribers = new Set<(event: any) => void>();
  return {
    observable: {
      subscribe(fn: (event: any) => void) {
        subscribers.add(fn);
        return { unsubscribe: () => subscribers.delete(fn) };
      },
    },
    emit: () => subscribers.forEach(fn => fn({ value: { deltaTime: 16 } })),
    get size() {
      return subscribers.size;
    },
  };
};

const createElement = (tick: ReturnType<typeof createTick>) => ({
  tag: "Layer",
  parent: null,
  props: { context: { tick }, effect: "leaves" },
  propObservables: {},
});

describe("Weather layer lifecycle", () => {
  test.each(LAYERS)("%s does not subscribe when destroyed while mounting", async name => {
    const Layer = registered.get(name);
    const tick = createTick();
    const layer = new Layer();

    const mounting = layer.onMount(createElement(tick));
    await layer.onDestroy(null);
    await mounting;

    expect(tick.size).toBe(0);
    expect(() => tick.emit()).not.toThrow();
  });

  test.each(LAYERS)("%s keeps a single subscription across overlapping mounts", async name => {
    const Layer = registered.get(name);
    const tick = createTick();
    const layer = new Layer();
    const element = createElement(tick);

    await Promise.all([layer.onMount(element), layer.onMount(element)]);
    expect(tick.size).toBe(1);

    await layer.onMount(element);
    expect(tick.size).toBe(1);

    await layer.onDestroy(null);
    expect(tick.size).toBe(0);
  });
});
