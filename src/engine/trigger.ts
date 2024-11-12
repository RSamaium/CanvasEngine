import { effect, signal } from "@signe/reactive";

interface Listen<T = any> {
  config: T | undefined;
  seed: number;
}

interface Trigger<T = any> {
  start: () => void;
  listen: () => Listen<T> | undefined;
}

export function isTrigger(arg: any): arg is Trigger<any> {
  return arg?.start && arg?.listen;
}

export function trigger<T = any>(config?: T): Trigger<T> {
  const _signal = signal(0);
  return {
    start: () => {
      _signal.set(Math.random());
    },
    listen: (): Listen<T> | undefined => {
      return {
        config,
        seed: _signal(),
      };
    },
  };
}

export function on(triggerSignal: any, callback: (config: any) => void) {
  if (!isTrigger(triggerSignal)) {
    throw new Error("In 'on(arg)' must have a trigger signal type");
  }
  effect(() => {
    const result = triggerSignal.listen();
    if (result?.seed) callback(result.config);
  });
}
