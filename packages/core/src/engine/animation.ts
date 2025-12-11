import { effect, signal, type WritableSignal, type Signal } from "@signe/reactive";
import { animate as animatePopmotion } from "popmotion";
import { Tick } from "../directives/Scheduler";
import { Subscription } from "rxjs";

/**
 * Gets the global tick signal from the engine context.
 * This is automatically set by the Canvas component when it initializes.
 * 
 * @returns The global tick signal if available, undefined otherwise
 */
function getGlobalTickSignal(): Signal<Tick> | undefined {
  return (globalThis as any).__CANVAS_ENGINE_TICK__;
}

export interface AnimateOptions<T> {
  duration?: number;
  ease?: (t: number) => number;
  onUpdate?: (value: T) => void;
  onComplete?: () => void;
  tick?: Signal<Tick>;
}

export interface AnimatedState<T> {
  current: T;
  start: T;
  end: T;
}

export interface AnimatedSignal<T> extends Omit<WritableSignal<T>, 'set'> {
  (): T;
  set: (newValue: T, options?: AnimateOptions<T>) => Promise<void>;
  animatedState: WritableSignal<AnimatedState<T>>;
  update: (updater: (value: T) => T) => void;
  pause: () => void;
  resume: () => void;
}

export function isAnimatedSignal(signal: WritableSignal<any>): boolean {
  return (signal as unknown as AnimatedSignal<any>).animatedState !== undefined;
}

/**
 * Creates a popmotion driver that uses the engine's tick system.
 * The driver subscribes to the tick signal and calls the update function with deltaTime on each tick.
 * 
 * @param tickSignal - The tick signal from the engine context
 * @returns A driver function for popmotion
 * @example
 * ```ts
 * const driver = createTickDriver(context.tick);
 * animate({
 *   to: 100,
 *   driver: driver
 * });
 * ```
 */
function createTickDriver(tickSignal: Signal<Tick>) {
  return (update: (delta: number) => void) => {
    let subscription: Subscription | undefined;
    let lastTimestamp: number | null = null;
    
    const start = () => {
      if (subscription) return;

      subscription = (tickSignal.observable as any).subscribe((result: any) => {
        const tick = result?.value ?? result;
        if (!tick) return;

        if (lastTimestamp === null) {
          lastTimestamp = tick.timestamp;
          return;
        }

        const delta = tick.deltaTime;
        lastTimestamp = tick.timestamp;
        update(delta);
      });
    };

    const stop = () => {
      subscription?.unsubscribe();
      subscription = undefined;
      lastTimestamp = null;
    };

    return { start, stop };
  };
}

/**
 * Creates an animated signal with the given initial value and animation options.
 * It's a writable signal that can be animated using popmotion. Properties of the animated signal are:
 * - current: the current value of the signal.
 * - start: the start value of the animation.
 * - end: the end value of the animation.
 * 
 * If a tick signal is provided in options, the animation will use the engine's tick system.
 * Otherwise, it will automatically use the global tick signal from the Canvas context if available.
 * If no tick signal is available, it will use requestAnimationFrame by default.
 * 
 * @param initialValue The initial value of the signal.
 * @param options The animation options. Can include a `tick` signal to use a specific tick system.
 * @returns The animated signal.
 * @example
 * ```ts
 * // Automatically uses the Canvas tick system if available, otherwise requestAnimationFrame
 * const animatedValue = animatedSignal(0, { duration: 1000 });
 * animatedValue.set(10);
 * 
 * // Explicitly using a specific tick signal
 * mount((element) => {
 *   const tickSignal = element.props.context.tick;
 *   const animatedValue = animatedSignal(0, { duration: 1000, tick: tickSignal });
 *   animatedValue.set(10);
 * });
 * ```
 */
export function animatedSignal<T>(initialValue: T, options: AnimateOptions<T> = {}): AnimatedSignal<T> {
  const state: AnimatedState<T> = {
    current: initialValue,
    start: initialValue,
    end: initialValue,
  };
  const DEFAULT_DURATION = 20;
  let animation: { stop: () => void } | null = null;
  let isPaused = false;

  const publicSignal = signal(initialValue);
  const privateSignal = signal(state);

  effect(() => {
    const currentState = privateSignal();
    publicSignal.set(currentState.current);
  });

  function animatedSignal(): AnimatedState<T>;
  function animatedSignal(newValue: T): void;
  function animatedSignal(newValue: T, animationConfig: AnimateOptions<T>): void;
  function animatedSignal(newValue?: T, animationConfig: AnimateOptions<T> = {}): AnimatedState<T> | void {
    if (newValue === undefined) {
      return privateSignal();
    }
    
    const prevState = privateSignal();
    const newState: AnimatedState<T> = {
      current: prevState.current,
      start: prevState.current,
      end: newValue,
    };

    privateSignal.set(newState);

    // Stop any running animation
    if (animation) {
      animation.stop();
      animation = null;
    }

    isPaused = false;
    const mergedConfig = { ...options, ...animationConfig };
    const duration = mergedConfig.duration ?? DEFAULT_DURATION;
    const ease = mergedConfig.ease ?? ((t: number) => t);
    const tickSignal = mergedConfig.tick || getGlobalTickSignal();

    const startValue = prevState.current;
    const endValue = newValue;

    const onCompleteCb = animationConfig.onComplete ?? options.onComplete;
    

    animation = animatePopmotion({
      from: startValue as any,
      to: endValue as any,
      duration,
      ease,
      
      onUpdate: (value: any) => {
        if (isPaused) return;
        const nextValue = value as T;
        privateSignal.update(s => ({ ...s, current: nextValue }));
        mergedConfig.onUpdate?.(nextValue);
        animationConfig.onUpdate?.(nextValue);
      },
      onComplete: () => {
        privateSignal.update(s => ({ ...s, current: endValue }));
        onCompleteCb?.();
      }
    });
     
  }

  const fn = function() {
    return privateSignal().current
  }

  for (const key in publicSignal) {
    fn[key] = publicSignal[key]
  }

  fn.animatedState = privateSignal
  fn.update = (updater: (value: T) => any) => {
    animatedSignal(updater(privateSignal().current));
  }
  fn.set = async (newValue: T, animationConfig: AnimateOptions<T> = {}) => {
    return new Promise<void>((resolve) => {
      const userOnComplete = animationConfig.onComplete;
      animatedSignal(newValue, {
        ...animationConfig,
        onComplete: () => {
          if (userOnComplete) {
            userOnComplete();
          } else if (options.onComplete) {
            options.onComplete();
          }
          resolve();
        }
      });
    });
  }
  fn.pause = () => {
    if (isPaused) return;
    isPaused = true;
    if (animation) {
      animation.stop();
      animation = null;
    }
  }
  fn.resume = () => {
    if (!isPaused) return;
    isPaused = false;
    const currentState = privateSignal();
    if (currentState.current !== currentState.end) {
      animatedSignal(currentState.end, options);
    }
  }

  return fn as any
}

/**
 * Executes a sequence of animations. If an array is provided as an element in the sequence,
 * those animations will be executed in parallel.
 * 
 * @param sequence Array of animation functions or arrays of animation functions for parallel execution
 * @returns Promise that resolves when all animations are complete
 * @example
 * ```ts
 * await animatedSequence([
 *   () => value1.set(10),
 *   [
 *     () => value2.set(20),
 *     () => value3.set(30)
 *   ],
 *   () => value1.set(0)
 * ])
 * ```
 */
export async function animatedSequence(sequence: ((() => Promise<void>) | (() => Promise<void>)[])[]) {
  for (const item of sequence) {
    if (Array.isArray(item)) {
      await Promise.all(item.map(fn => fn()));
    } else {
      await item();
    }
  }
}