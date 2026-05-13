import { describe, expect, test, vi } from "vitest";
import { Container, Rectangle, Texture } from "pixi.js";
import { signal } from "canvasengine";
import { Clip, Occlusion, Outline } from "../../packages/core/src/directives/SpriteEffects";

function createElement(instance: any, props: any) {
  const tick = signal({ deltaRatio: 1 });
  return {
    tag: "Sprite",
    props: {
      ...props,
      context: {
        tick,
      },
    },
    componentInstance: instance,
    directives: {},
    propSubscriptions: [],
    effectSubscriptions: [],
    effectMounts: [],
    effectUnmounts: [],
  } as any;
}

function createMaskableInstance(bounds = new Rectangle(0, 0, 32, 32)) {
  const parent = new Container();
  const instance: any = {
    parent,
    mask: null,
    x: 0,
    y: 0,
    width: bounds.width,
    height: bounds.height,
    texture: Texture.WHITE,
    rotation: 0,
    scale: { x: 1, y: 1 },
    pivot: { x: 0, y: 0 },
    skew: { x: 0, y: 0 },
    getBounds: vi.fn(() => bounds),
    setMask: vi.fn(function (options) {
      instance.mask = options.mask ?? null;
      instance._maskOptions = options;
    }),
  };
  return instance;
}

function findGhostSprite(parent: Container, texture: Texture) {
  return parent.children.find((child: any) => child.texture === texture) as any;
}

describe("Sprite effects directives", () => {
  test("outline adds updates and removes only its own filter", () => {
    const existingFilter = { name: "existing" };
    const enabled = signal(true);
    const instance: any = { filters: [existingFilter] };
    const element = createElement(instance, {
      outline: {
        enabled,
        color: 0xffcc00,
        thickness: 3,
        quality: 0.2,
        alpha: 0.8,
      },
    });
    const directive = new Outline();

    directive.onInit(element);
    directive.onMount(element);

    expect(instance.filters).toHaveLength(2);
    expect(instance.filters[0]).toBe(existingFilter);
    expect(instance.filters[1].thickness).toBe(3);
    expect(instance.filters[1].alpha).toBe(0.8);

    enabled.set(false);

    expect(instance.filters).toEqual([existingFilter]);
    directive.onDestroy(element);
    expect(instance.filters).toEqual([existingFilter]);
  });

  test("clip applies an inverse mask for hide mode and restores the previous mask", () => {
    const previousMask = { name: "previous-mask" };
    const instance = createMaskableInstance();
    instance.mask = previousMask;
    const element = createElement(instance, {
      clip: {
        mode: "hide",
        shape: { type: "rect", x: 0, y: 16, width: 32, height: 16 },
      },
    });
    const directive = new Clip();

    directive.onInit(element);
    directive.onMount(element);

    const maskOptions = instance.setMask.mock.lastCall?.[0];
    expect(maskOptions.mask).toBeTruthy();
    expect(maskOptions.inverse).toBe(true);
    expect(instance.parent.children).toContain(instance.mask);

    directive.onDestroy(element);

    expect(instance.setMask).toHaveBeenLastCalledWith({ mask: previousMask, inverse: false });
    expect(instance.parent.children).not.toContain(instance.mask);
  });

  test("clip applies a normal mask for keep mode", () => {
    const instance = createMaskableInstance();
    const element = createElement(instance, {
      clip: {
        mode: "keep",
        shape: { type: "rect", x: 0, y: 0, width: 32, height: 16 },
      },
    });
    const directive = new Clip();

    directive.onInit(element);
    directive.onMount(element);

    const maskOptions = instance.setMask.mock.lastCall?.[0];
    expect(maskOptions.mask).toBeTruthy();
    expect(maskOptions.inverse).toBe(false);
  });

  test("occlusion shows a low-alpha masked sprite copy for intersections", () => {
    const target = createMaskableInstance(new Rectangle(0, 0, 32, 32));
    let obstacleBounds = new Rectangle(16, 8, 32, 16);
    const obstacle = createElement(
      {
        getBounds: vi.fn(() => obstacleBounds),
      },
      {}
    );
    const element = createElement(target, {
      occlusion: {
        obstacles: obstacle,
        alpha: 0.28,
      },
    });
    const directive = new Occlusion();

    directive.onInit(element);
    directive.onMount(element);

    const ghost = findGhostSprite(target.parent, target.texture);
    expect(ghost).toBeTruthy();
    expect(ghost?.visible).toBe(true);
    expect(ghost?.alpha).toBe(0.28);
    expect(ghost?.mask).toBeTruthy();
    expect(target.setMask).not.toHaveBeenCalled();

    obstacleBounds = new Rectangle(100, 100, 16, 16);
    directive.onUpdate(null, element);

    expect(ghost?.visible).toBe(false);
  });

  test("occlusion can use hitbox bounds", () => {
    const target = createMaskableInstance(new Rectangle(0, 0, 64, 64));
    target.hitbox = { w: 16, h: 16 };
    const obstacle = createElement(
      {
        getBounds: vi.fn(() => new Rectangle(24, 48, 16, 16)),
      },
      {}
    );
    const element = createElement(target, {
      occlusion: {
        obstacles: obstacle,
        bounds: "hitbox",
      },
    });
    const directive = new Occlusion();

    directive.onInit(element);
    directive.onMount(element);

    const ghost = findGhostSprite(target.parent, target.texture);
    expect(ghost).toBeTruthy();
    expect(ghost?.visible).toBe(true);
    expect(ghost?.mask).toBeTruthy();
  });
});
