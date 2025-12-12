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
        const newValue = Math.random();
        _signal.set({
          config: {
            ...globalConfig,
            ...config,
          },
          resolve,
          value: newValue,
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
 * @returns Subscription that can be unsubscribed to stop listening
 * @throws Error if triggerSignal is not a valid trigger
 * @example
 * ```ts
 * const click = trigger()
 * 
 * const subscription = on(click, () => {
 *   console.log('Click triggered')
 * })
 * 
 * // Later, to stop listening:
 * subscription.unsubscribe()
 * ```
 */
export function on(triggerSignal: any, callback: (config: any) => void | Promise<void>) {
  if (!isTrigger(triggerSignal)) {
    throw new Error("In 'on(arg)' must have a trigger signal type");
  }
  let lastValue: number | undefined;

  const effectResult = effect(() => {
    const result = triggerSignal.listen();
    const seed = result?.seed;

    if (!seed) return;

    // Only run callback when the trigger value actually changes
    if (lastValue === undefined) {
      lastValue = seed.value;
      return;
    }
    if (seed.value === lastValue) {
      return;
    }
    lastValue = seed.value;

    try {
      const ret = callback(result?.seed.config);
      if (ret && typeof ret.then === 'function') {
        ret.then((value: any) => seed.resolve(value)).catch(() => seed.resolve(undefined));
      } else {
        seed.resolve(ret);
      }
    } catch (err) {
      seed.resolve(undefined);
    }
  });

  return effectResult.subscription;
}
