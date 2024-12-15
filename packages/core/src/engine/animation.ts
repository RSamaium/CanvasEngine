import { effect, signal, type WritableSignal } from "@signe/reactive";
import { animate as animatePopmotion } from "popmotion";

interface AnimateOptions<T> {
  duration?: number;
  ease?: (t: number) => number;
  onUpdate?: (value: T) => void;
}

export interface AnimatedState<T> {
  current: T;
  start: T;
  end: T;
}

export interface AnimatedSignal<T> extends Omit<WritableSignal<T>, 'set'> {
  (): T;
  set: (newValue: T) => void;
  animatedState: WritableSignal<AnimatedState<T>>;
  update: (updater: (value: T) => T) => void;
}

export function isAnimatedSignal(signal: WritableSignal<any>): boolean {
  return (signal as unknown as AnimatedSignal<any>).animatedState !== undefined;
}

/**
 * Creates an animated signal with the given initial value and animation options.
 * It's a writable signal that can be animated using popmotion. Properties of the animated signal are:
 * - current: the current value of the signal.
 * - start: the start value of the animation.
 * - end: the end value of the animation.
 * 
 * @param initialValue The initial value of the signal.
 * @param options The animation options.
 * @returns The animated signal.
 * @example
 * const animatedValue = animatedSignal(0, { duration: 1000 });
 * animatedValue.set(10);
 * animatedValue.update((value) => value + 1);
 * console.log(animatedValue()); // 11
 * 
 * animatedValue.animatedState() // { current: 10, start: 10, end: 11 }
 */
export function animatedSignal<T>(initialValue: T, options: AnimateOptions<T> = {}): AnimatedSignal<T> {
  const state: AnimatedState<T> = {
    current: initialValue,
    start: initialValue,
    end: initialValue,
  };
  let animation

  const publicSignal = signal(initialValue);
  const privateSignal = signal(state);

  effect(() => {
    const currentState = privateSignal();
    publicSignal.set(currentState.current);
  });

  function animatedSignal(): AnimatedState<T>;
  function animatedSignal(newValue: T): void;
  function animatedSignal(newValue?: T): AnimatedState<T> | void {
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

    if (animation) {
      animation.stop();
    }

    animation = animatePopmotion({
       // TODO
       duration: 20,
      ...options,
      from: prevState.current,
      to: newValue,
      onUpdate: (value) => {
        privateSignal.update(s => ({ ...s, current: value as T }));
        if (options.onUpdate) {
          options.onUpdate(value as T);
        }
      },
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
  fn.set = (newValue: T) => {
    animatedSignal(newValue);
  }

  return fn as any
}