import { describe, expect, test } from "vitest";
import { Container, Texture } from "pixi.js";
import { signal } from "canvasengine";
import { Afterimage } from "../../packages/core/src/directives/Afterimage";

function setup(props: any) {
  const parent = new Container();
  const instance: any = new Container();
  instance.texture = Texture.WHITE;
  instance.anchor = { x: 0.5, y: 1, copyFrom() {} };
  parent.addChild(instance);
  const tick = signal({ deltaTime: 16 });
  const element: any = { props: { afterimage: props, context: { tick } }, componentInstance: instance };
  const directive = new Afterimage();
  directive.onInit(element);
  directive.onMount(element);
  // the tick signal ignores an unchanged value, so each step differs by a tiny amount
  let n = 0;
  const step = (dt = 50) => tick.set({ deltaTime: dt + 0.001 * ++n });
  return { parent, instance, directive, step };
}

describe("afterimage directive", () => {
  test("leaves a ghost per interval while the sprite moves, then fades them out", () => {
    const { parent, instance, step } = setup({ interval: 40, duration: 200 });
    step();
    expect(parent.children.length).toBe(1);
    instance.x += 10;
    step();
    expect(parent.children.length).toBe(2);
    instance.x += 10;
    step();
    expect(parent.children.length).toBe(3);
    for (let i = 0; i < 6; i++) step(50);
    expect(parent.children.length).toBe(1);
  });

  test("does nothing while disabled or standing still", () => {
    const enabled = signal(false);
    const { parent, instance, step } = setup({ interval: 40, enabled });
    instance.x += 10;
    step();
    expect(parent.children.length).toBe(1);
    enabled.set(true);
    step();
    expect(parent.children.length).toBe(1);
    instance.x += 10;
    step();
    expect(parent.children.length).toBe(2);
    step();
    expect(parent.children.length).toBe(2);
  });

  test("removes its ghosts on destroy", () => {
    const { parent, instance, directive, step } = setup({ interval: 40 });
    step();
    instance.x += 10;
    step();
    directive.onDestroy();
    expect(parent.children.length).toBe(1);
  });
});
