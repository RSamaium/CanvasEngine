import { Fx } from "./fx";

export function Particle(options) {
  const { emit, ...props } = options;
  return Fx({
    ...props,
    trigger: props.trigger ?? emit,
  });
}
