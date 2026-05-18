import {
  Observable,
  Subject,
  Subscription
} from "rxjs";
import { isSignal } from "@signe/reactive";
import type { Element } from "./reactive";
import { destroyElement, isElementFrozen, waitForDependencies } from "./reactive";
import { isPromise } from "./utils";
import { Tick } from "../directives/Scheduler";
import { Container } from "../components";

type MountCallback = (element: Element) => any;
type MountFunction = (fn: MountCallback) => void;

// Define ComponentFunction type
export type ComponentFunction<P = {}> = (props: P) => Element | Promise<Element>;
type HotFlowResult = { elements: Element[] };
type HotComponentRecord = {
  component: ComponentFunction<any>;
  updates: Subject<void>;
  wrapper?: ComponentFunction<any>;
};

const HOT_COMPONENT_PROPS = "__canvasEngineHotProps";
const HOT_COMPONENT_UPDATE_PROPS = "__canvasEngineUpdateHotProps";
const DEFINE_PROPS_SIGNALS = "__canvasEngineDefinePropsSignals";

export let currentSubscriptionsTracker: ((subscription: Subscription) => void) | null = null;
export let currentDefinePropsTracker: ((signals: Record<string, any>) => void) | null = null;
export let mountTracker: MountFunction | null = null;

const readSignalValue = (value: any) => isSignal(value) ? value() : value;

const patchDefinePropsSignals = (target: Element, source: Element) => {
  const targetSignals = (target as any)[DEFINE_PROPS_SIGNALS];
  const sourceSignals = (source as any)[DEFINE_PROPS_SIGNALS];

  if (!targetSignals || !sourceSignals) {
    return;
  }

  Object.entries(sourceSignals as Record<string, any>).forEach(([key, sourceSignal]) => {
    const targetSignal = targetSignals[key];
    if (targetSignal && typeof targetSignal.set === "function") {
      targetSignal.set(readSignalValue(sourceSignal));
    }
  });
};

const getHotComponentRegistry = (): Map<string, HotComponentRecord> => {
  const hotGlobal = globalThis as any;
  if (!hotGlobal.__CANVAS_ENGINE_HOT_COMPONENTS__) {
    hotGlobal.__CANVAS_ENGINE_HOT_COMPONENTS__ = new Map<string, HotComponentRecord>();
  }
  return hotGlobal.__CANVAS_ENGINE_HOT_COMPONENTS__;
};

/**
 * Registers a mount function to be called when the component is mounted.
 * To unmount the component, the function must return a function that will be called by the engine.
 * 
 * @param {(element: Element) => void} fn - The function to be called on mount.
 * @example
 * ```ts
  * mount((el) => {
 * console.log('mounted', el);
 * });
 * ```
 * Unmount the component by returning a function:
 * ```ts
  * mount((el) => {
 * console.log('mounted', el);
 *   return () => {
 * console.log('unmounted', el);
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
 * console.log('tick', tickValue, el);
 * });
 * ```
 */
export function tick(fn: (tickValue: Tick, element: Element) => void) {
  mount((el: Element) => {
    const { context } = el.props
    let subscription: Subscription | undefined
    if (context.tick) {
      subscription = context.tick.observable.subscribe(({ value }: { value: Tick }) => {
        // Block tick if element is frozen
        if (isElementFrozen(el)) {
          return;
        }
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
 * h(MyChildComponent, {
      *     x: 50,
      *     y: 50,
      *   }),
 * );
 * ```
 */
function _h<C extends ComponentFunction<any>>(
  componentFunction: C | Element,
  props: Parameters<C>[0] = {} as Parameters<C>[0],
  children: any[]
): ReturnType<C> {
  if (children[0] instanceof Array) {
    children = children[0]
  }

  let component: Element

  if (Array.isArray(componentFunction)) {
    if (componentFunction.length === 1) {
      component = componentFunction[0]
    }
    else {
      component = _h(Container, {}, componentFunction) as Element
    }
  }
  else if ('tag' in componentFunction) {
    component = componentFunction
  }
  else if (componentFunction instanceof Observable) {
    component = componentFunction as any
  }
  else {
    component = createTrackedComponent(componentFunction, { ...props, children }) as Element;
  }

  if (!component) {
    component = {} as any
  }

  // Copy dependencies prop to the returned element so it can be used for delayed mounting
  if (props?.dependencies) {
    component.props = component.props || {};
    component.props.dependencies = props.dependencies;
  }

  return component as ReturnType<C>;
}

function createTrackedComponent<C extends ComponentFunction<any>>(
  componentFunction: C,
  props: Parameters<C>[0]
): ReturnType<C> {
  const allSubscriptions = new Set<Subscription>();
  const allMounts = new Set<MountCallback>();
  let allDefinePropSignals: Record<string, any> | null = null;

  currentSubscriptionsTracker = (subscription) => {
    allSubscriptions.add(subscription);
  };

  currentDefinePropsTracker = (signals) => {
    allDefinePropSignals = {
      ...(allDefinePropSignals ?? {}),
      ...signals,
    };
  };

  mountTracker = (fn: any) => {
    allMounts.add(fn);
  };

  let component: ReturnType<C> = undefined as any;
  try {
    component = componentFunction(props) as ReturnType<C>;
  } finally {
    currentSubscriptionsTracker = null;
    currentDefinePropsTracker = null;
    mountTracker = null;
  }

  const applyTrackedEffects = (element: Element) => {
    if (!element) return;
    element.effectSubscriptions = [
      ...Array.from(allSubscriptions),
      ...((element as any).effectSubscriptions ?? [])
    ];
    element.effectMounts = [
      ...Array.from(allMounts),
      ...((element as any).effectMounts ?? [])
    ];
    if (allDefinePropSignals) {
      (element as any)[DEFINE_PROPS_SIGNALS] = allDefinePropSignals;
    }
  };

  if (component instanceof Promise) {
    component.then((element) => {
      applyTrackedEffects(element);
      if (element?.props?.isRoot) {
        allMounts.forEach((fn) => fn(element));
      }
    });
  } else if (component instanceof Observable) {
    (component as any).effectSubscriptions = [
      ...Array.from(allSubscriptions),
      ...((component as any).effectSubscriptions ?? [])
    ];
    (component as any).effectMounts = [
      ...Array.from(allMounts),
      ...((component as any).effectMounts ?? [])
    ];
    if (allDefinePropSignals) {
      (component as any)[DEFINE_PROPS_SIGNALS] = allDefinePropSignals;
    }
  } else {
    applyTrackedEffects(component as Element);
  }

  return component;
}

export function createHotComponent<P>(
  id: string,
  component: ComponentFunction<P>
): ComponentFunction<P> {
  const registry = getHotComponentRegistry();
  let record = registry.get(id);

  if (!record) {
    record = {
      component,
      updates: new Subject<void>(),
    };
    registry.set(id, record);
  } else {
    record.component = component;
    record.updates.next();
  }

  if (!record.wrapper) {
    record.wrapper = ((props: P) => {
      let currentProps = props;

      const observable = new Observable<HotFlowResult>((subscriber) => {
        let disposed = false;
        let currentElement: Element | null = null;

        const patchElement = (target: Element, source: Element) => {
          if (target.tag !== source.tag) {
            return false;
          }

          const nextProps = { ...source.props };
          if (target.props.context) {
            nextProps.context = target.props.context;
          }
          if (target.props.children && !source.props.children) {
            nextProps.children = target.props.children;
          }

          patchDefinePropsSignals(target, source);

          target.props = nextProps;
          target.propObservables = source.propObservables;
          target.componentInstance.onUpdate?.(nextProps);
          Object.entries(target.directives).forEach(([name, directive]) => {
            if (name in nextProps) {
              directive.onUpdate?.(nextProps[name], target);
            }
          });

          source.propSubscriptions?.forEach((sub) => sub.unsubscribe());
          source.effectSubscriptions?.forEach((sub) => sub.unsubscribe());
          source.effectUnmounts?.forEach((fn) => fn?.());

          return true;
        };

        const emit = (preserveCurrentElement = false) => {
          const rendered = createTrackedComponent(record!.component, currentProps);
          const next = (element: Element | null | undefined) => {
            if (!disposed) {
              if (
                preserveCurrentElement &&
                currentElement &&
                element &&
                patchElement(currentElement, element)
              ) {
                subscriber.next({ elements: [currentElement] });
                return;
              }

              subscriber.next({ elements: element ? [element] : [] });
              if (currentElement && currentElement !== element) {
                destroyElement(currentElement);
              }
              currentElement = element ?? null;
            }
          };

          if (rendered instanceof Promise) {
            rendered.then(next).catch((error) => subscriber.error(error));
          } else {
            next(rendered as Element);
          }
        };

        emit();
        (observable as any)[HOT_COMPONENT_UPDATE_PROPS] = (nextProps: P) => {
          currentProps = nextProps;
          emit(true);
        };

        const subscription = record!.updates.subscribe(() => emit());

        return () => {
          disposed = true;
          if (currentElement) {
            destroyElement(currentElement);
            currentElement = null;
          }
          subscription.unsubscribe();
        };
      }) as any;

      (observable as any)[HOT_COMPONENT_PROPS] = props;

      return observable;
    }) as ComponentFunction<any>;
  }

  return record.wrapper as ComponentFunction<P>;
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
 * h(MyChildComponent, {
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
  if (props?.dependencies) {
    const hasPromise = props.dependencies.some(isPromise);
    if (!hasPromise) {
      const allReady = props.dependencies.every((dep: any) => {
        if (isSignal(dep)) return dep() !== undefined;
        return dep !== undefined;
      });
      if (allReady) {
        return _h(componentFunction, props, children);
      }
    }

    return new Observable(subscriber => {
      waitForDependencies(props.dependencies).then(() => {
        const el = _h(componentFunction, props, children);
        subscriber.next(el);
      });
    }) as any;
  }
  return _h(componentFunction, props, children);
}
