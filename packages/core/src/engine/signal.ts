import {
  Observable,
  Subscription
} from "rxjs";
import type { Element } from "./reactive";
import { Tick } from "../directives/Scheduler";
import { Container } from "../components";

type MountFunction = (fn: (element: Element) => void) => void;

// Define ComponentFunction type
export type ComponentFunction<P = {}> = (props: P) => Element | Promise<Element>;

export let currentSubscriptionsTracker: ((subscription: Subscription) => void) | null = null;
export let mountTracker: MountFunction | null = null;

/**
 * Registers a mount function to be called when the component is mounted.
 * To unmount the component, the function must return a function that will be called by the engine.
 * 
 * @param {(element: Element) => void} fn - The function to be called on mount.
 * @example
 * ```ts
 * mount((el) => {
 *   console.log('mounted', el);
 * });
 * ```
 * Unmount the component by returning a function:
 * ```ts
 * mount((el) => {
 *   console.log('mounted', el);
 *   return () => {
 *     console.log('unmounted', el);
 *   }
 * });
 * ```
 */
export function mount(fn: (element: Element) => void) {
  mountTracker?.(fn);
}

/**
 * Registers a tick function to be called on each tick of the component's context.
 * @param {(tickValue: Tick, element: Element) => void} fn - The function to be called on each tick.
 * @example
 * ```ts
 * tick((tickValue, el) => {
 *   console.log('tick', tickValue, el);
 * });
 * ```
 */
export function tick(fn: (tickValue: Tick, element: Element) => void) {
  mount((el: Element) => {
    const { context } = el.props
    let subscription: Subscription | undefined
    if (context.tick) {
      subscription = context.tick.observable.subscribe(({ value }) => {
        fn(value, el)
      })
    }
    return () => {
      subscription?.unsubscribe()
    }
  })
}

/**
 * Add tracking for subscriptions and mounts, then create an element from a component function.
 * @template C
 * @param {C} componentFunction - The component function to create an element from.
 * @param {Parameters<C>[0]} [props={}] - The props to pass to the component function.
 * @param {...any[]} children - The children elements of the component.
 * @returns {ReturnType<C>}
 * @example
 * ```ts
 * const el = h(MyComponent, {
 *   x: 100,
 *   y: 100,
 * });
 * ```
 * 
 * with children:
 * ```ts
 * const el = h(MyComponent, {
 *   x: 100,
 *   y: 100,
 * }, 
 *   h(MyChildComponent, {
 *     x: 50,
 *     y: 50,
 *   }),
 * );
 * ```
 */
export function h<C extends ComponentFunction<any>>(
  componentFunction: C | Element,
  props: Parameters<C>[0] = {} as Parameters<C>[0],
  ...children: any[]
): ReturnType<C> {
  const allSubscriptions = new Set<Subscription>();
  const allMounts = new Set<MountFunction>();

  currentSubscriptionsTracker = (subscription) => {
    allSubscriptions.add(subscription);
  };

  mountTracker = (fn: any) => {
    allMounts.add(fn);
  };

  if (children[0] instanceof Array) {
    children = children[0]
  }

  let component: Element

  if (Array.isArray(componentFunction)) {
    if (componentFunction.length === 1) {
      component = componentFunction[0]
    }
    else {
      component = h(Container, {}, ...componentFunction) as Element
    }
  }
  else if ('tag' in componentFunction) {
    component = componentFunction
  }
  else if (componentFunction instanceof Observable) {
    component = componentFunction as any
  }
  else {
    component = componentFunction({ ...props, children }) as Element;
  }

  if (!component) {
    component = {} as any
  }

  component.effectSubscriptions = Array.from(allSubscriptions);
  component.effectMounts = [
    ...Array.from(allMounts),
    ...((component as any).effectMounts ?? [])
  ];

  // Copy dependencies prop to the returned element so it can be used for delayed mounting
  if (props?.dependencies) {
    component.props = component.props || {};
    component.props.dependencies = props.dependencies;
  }

  // call mount hook for root component
  if (component instanceof Promise) {
    component.then((component) => {
      if (component.props.isRoot) {
        allMounts.forEach((fn) => fn(component));
      }
    })
  }

  currentSubscriptionsTracker = null;
  mountTracker = null;

  return component as ReturnType<C>;
}
