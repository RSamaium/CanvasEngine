import { describe, expect, test } from "vitest";
import { Container } from "pixi.js";
import { getYoga, getYogaConfig, setYoga, setYogaConfig } from "../../packages/core/node_modules/@pixi/layout/dist/index.mjs";
import { ensureYoga } from "../../packages/core/src/engine/yoga";

describe("ensureYoga", () => {
  test("loads Yoga when the layout system did not run", async () => {
    setYoga(undefined as any);
    setYogaConfig(undefined as any);

    await ensureYoga();

    expect(getYoga()).toBeDefined();
    expect(getYogaConfig()).toBeDefined();
    const container = new Container();
    expect(() => { container.layout = {}; }).not.toThrow();
    expect(container.layout).not.toBeNull();
  });

  test("keeps an already loaded Yoga instance", async () => {
    await ensureYoga();
    const yoga = getYoga();
    const config = getYogaConfig();

    await ensureYoga();

    expect(getYoga()).toBe(yoga);
    expect(getYogaConfig()).toBe(config);
  });
});
