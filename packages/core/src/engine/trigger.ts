import { effect, signal } from "@signe/reactive";

interface Listen<T = any> {
  config: T | undefined;
  seed: number;
}

interface Trigger<T = any> {
  start: () => void;
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
 * @param config - Optional configuration data to be passed when the trigger is activated
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
export function on(triggerSignal: any, callback: (config: any) => void) {
  if (!isTrigger(triggerSignal)) {
    throw new Error("In 'on(arg)' must have a trigger signal type");
  }
  effect(() => {
    const result = triggerSignal.listen();
    if (result?.seed) callback(result.config);
  });
}
