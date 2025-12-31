import { describe, expect, test } from "vitest";
import { signal } from "canvasengine";
import { createTabindexNavigator } from "../../packages/core/src/utils/tabindex";

describe("createTabindexNavigator", () => {
  test("wraps values within bounds", () => {
    const tabindex = signal(0);
    const nav = createTabindexNavigator(tabindex, { count: () => 3 }, "wrap");

    nav.set(2);
    expect(tabindex()).toBe(2);

    nav.set(3);
    expect(tabindex()).toBe(0);

    nav.set(-1);
    expect(tabindex()).toBe(2);
  });

  test("clamps values within bounds", () => {
    const tabindex = signal(0);
    const nav = createTabindexNavigator(tabindex, { min: 0, max: 2 }, "clamp");

    nav.set(10);
    expect(tabindex()).toBe(2);

    nav.set(-5);
    expect(tabindex()).toBe(0);
  });

  test("ignores out-of-bounds values in none mode", () => {
    const tabindex = signal(1);
    const nav = createTabindexNavigator(tabindex, { min: 0, max: 2 }, "none");

    nav.set(5);
    expect(tabindex()).toBe(1);

    nav.set(2);
    expect(tabindex()).toBe(2);
  });

  test("no-ops when count is not positive", () => {
    const tabindex = signal(1);
    const nav = createTabindexNavigator(tabindex, { count: () => 0 }, "wrap");

    nav.next(1);
    expect(tabindex()).toBe(1);
  });
});
