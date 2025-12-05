import { effect, signal } from "@signe/reactive";

export interface Listen<T = any> {
  config: T | undefined;
  seed: {
    config: T | undefined;
    value: number;
    resolve: (value: any) => void;
  };
}

export interface Trigger<T = any> {
  start: () => Promise<void>;
  listen: () => Listen<T> | undefined;
}

/**
 * Checks if the given argument is a Trigger object
 * @param arg - The value to check
 * @returns True if the argument is a Trigger object
 */
export function isTrigger(arg: any): arg is Trigger<any> {
  return arg?.start && arg?.listen;
}

/**
 * Creates a new trigger that can be used to pass data between components
 * @param globalConfig - Optional configuration data to be passed when the trigger is activated
 * @returns A Trigger object with start and listen methods
 * @example
 * ```ts
 * const myTrigger = trigger()
 * 
 * on(myTrigger, (data) => {
 *   console.log('Triggered with data:', data)
 * })
 * 
 * myTrigger.start({ message: 'Hello' })
 * ```
 */
export function trigger<T = any>(globalConfig?: T): Trigger<T> {
  const _signal = signal({
    config: globalConfig,
    value: 0,
    resolve: (value: any) => void 0,
  });
  return {
    start: (config?: T) => {
      return new Promise((resolve: (value: any) => void) => {
        _signal.set({
          config: {
            ...globalConfig,
            ...config,
          },
          resolve,
          value: Math.random(),
        });
      });
    },
    listen: (): Listen<T> | undefined => {
      return {
        config: globalConfig,
        seed: _signal(),
      };
    },
  };
}

/**
 * Subscribes to a trigger and executes a callback when the trigger is activated
 * @param triggerSignal - The trigger to subscribe to
 * @param callback - Function to execute when the trigger is activated
 * @throws Error if triggerSignal is not a valid trigger
 * @example
 * ```ts
 * const click = trigger()
 * 
 * on(click, () => {
 *   console.log('Click triggered')
 * })
 * ```
 */
export function on(triggerSignal: any, callback: (config: any) => void | Promise<void>) {
  if (!isTrigger(triggerSignal)) {
    throw new Error("In 'on(arg)' must have a trigger signal type");
  }
  effect(() => {
    const result = triggerSignal.listen();
    if (result?.seed.value) {
      const ret = callback(result?.seed.config);
      if (ret && typeof ret.then === 'function') {
        ret.then(result?.seed.resolve);
      }
    }
  });
}
