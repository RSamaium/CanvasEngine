import { ArrayChange, ObjectChange, Signal, WritableArraySignal, WritableObjectSignal, isComputed, isSignal, signal, computed } from "@signe/reactive";
import { isAnimatedSignal, AnimatedSignal } from "./animation";
import {
  Observable,
  Subject,
  Subscription,
  defer,
  from,
  map,
  of,
  share,
  shareReplay,
  switchMap,
  debounceTime,
  distinctUntilChanged,
  bufferTime,
  filter,
  throttleTime,
  combineLatest,
} from "rxjs";
import { ComponentInstance } from "../components/DisplayObject";
import { Directive, applyDirective } from "./directive";
import { isObject, isPromise, set } from "./utils";

export interface Props {
  [key: string]: any;
}

type NestedSignalObjects = {
  [Key in string]: NestedSignalObjects | Signal<any>;
};

export interface Element<T = ComponentInstance> {
  tag: string;
  props: Props;
  componentInstance: T;
  propSubscriptions: Subscription[];
  effectSubscriptions: Subscription[];
  effectMounts: (() => void)[];
  effectUnmounts: ((element?: Element) => void)[];
  propObservables: NestedSignalObjects | undefined;
  parent: Element | null;
  context?: {
    [key: string]: any;
  };
  directives: {
    [key: string]: Directive;
  };
  destroy: () => void;
  allElements: Subject<void>;
  isFrozen: boolean;
}

type FlowResult = {
  elements: Element[];
  prev?: Element;
  fullElements?: Element[];
  reorder?: boolean;
};

type FlowObservable = Observable<FlowResult>;

export interface LoopOptions<T> {
  track?: (item: T, index: number | string) => string | number;
}

const components: { [key: string]: any } = {};

export const isElement = (value: any): value is Element => {
  return (
    value &&
    typeof value === "object" &&
    "tag" in value &&
    "props" in value &&
    "componentInstance" in value
  );
};

export const isPrimitive = (value) => {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  );
};

const DOM_ROUTING_MAP: Record<string, string> = {
  Sprite: "DOMSprite",
};

const DOM_ALLOWED_TAGS = new Set(["DOMContainer", "DOMElement", "DOMSprite"]);
const DOM_UNSUPPORTED_TAGS = new Set([
  "Canvas",
  "Container",
  "Graphics",
  "Rect",
  "Circle",
  "Ellipse",
  "Triangle",
  "Svg",
  "Mesh",
  "Scene",
  "ParticlesEmitter",
  "Sprite",
  "Video",
  "Text",
  "TilingSprite",
  "Viewport",
  "NineSliceSprite",
  "Button",
  "Joystick",
  "FocusContainer",
]);

const hasDomAncestor = (element: Element | null): boolean => {
  let current = element;
  while (current) {
    if (current.tag === "DOMContainer" || current.tag === "DOMElement") {
      return true;
    }
    current = current.parent;
  }
  return false;
};

const cleanupElementForRouting = (element: Element) => {
  element.propSubscriptions?.forEach((sub) => sub.unsubscribe());
  element.effectSubscriptions?.forEach((sub) => sub.unsubscribe());
  element.effectUnmounts?.forEach((fn) => fn?.());
};

const routeDomComponent = (parent: Element, child: Element): Element => {
  if (!hasDomAncestor(parent)) {
    return child;
  }
  if (DOM_ALLOWED_TAGS.has(child.tag)) {
    return child;
  }
  const routedTag = DOM_ROUTING_MAP[child.tag];
  if (routedTag) {
    cleanupElementForRouting(child);
    const routedProps = child.propObservables ?? child.props;
    return createComponent(routedTag, routedProps);
  }
  if (DOM_UNSUPPORTED_TAGS.has(child.tag)) {
    throw new Error(
      `Component ${child.tag} is not implemented for DOMContainer context yet. Only Sprite is supported.`
    );
  }
  return child;
};

export function registerComponent(name, component) {
  components[name] = component;
}

// Track if components have been registered to avoid duplicate imports
let componentsRegistered = false;

/**
 * Registers all default CanvasEngine components.
 * 
 * This function imports and registers all core components that are available by default.
 * It's called automatically by bootstrapCanvas() if no custom component configuration is provided.
 * 
 * Components register themselves when their modules are imported, so this function ensures
 * all component modules are loaded. Since components call registerComponent() at module load time,
 * importing them will automatically register them synchronously.
 * 
 * @example
 * ```typescript
 * // Register all default components manually
 * registerAllComponents();
 * 
 * // Now you can use any component
 * const sprite = createComponent('Sprite', { image: 'hero.png' });
 * ```
 */
export function registerAllComponents() {
  if (componentsRegistered) {
    return;
  }

  // Components are registered when their modules are imported
  // Since bootstrap.ts imports all components, they should already be registered
  // when bootstrapCanvas() is called. This function just marks that registration
  // has been attempted. If components aren't registered yet, they will be when
  // bootstrap.ts imports them (which happens before bootstrapCanvas() is called).
  componentsRegistered = true;
}

/**
 * Checks if all dependencies are ready (not undefined).
 * Handles signals synchronously and promises asynchronously.
 * For reactive signals, sets up subscriptions to mount when all become ready.
 * 
 * @param deps - Array of signals, promises, or direct values
 * @returns Promise<boolean> - true if all dependencies are ready
 */
export async function checkDependencies(
  deps: any[]
): Promise<boolean> {
  const values = await Promise.all(
    deps.map(async (dep) => {
      if (isSignal(dep)) {
        return dep(); // Read current signal value
      } else if (isPromise(dep)) {
        return await dep; // Await promise resolution
      }
      return dep; // Direct value
    })
  );
  return values.every((v) => v !== undefined);
}

export function waitForDependencies(deps: any[]): Promise<void> {
  return new Promise(async (resolve) => {
    const ready = await checkDependencies(deps);
    if (ready) {
      resolve();
      return;
    }

    const signalDeps = deps.filter((dep) => isSignal(dep));
    if (signalDeps.length === 0) {
      return;
    }

    const signalObservables = signalDeps.map((sig) => sig.observable);
    const subscription = combineLatest(signalObservables).subscribe(async () => {
      const allReady = await checkDependencies(deps);
      if (allReady) {
        subscription.unsubscribe();
        resolve();
      }
    });
  });
}

/**
 * Checks if an element is currently frozen.
 * An element is frozen when the `freeze` prop is set to `true` (either as a boolean or Signal<boolean>),
 * or when any of its parent elements are frozen (recursive freeze propagation).
 * 
 * @param element - The element to check
 * @returns `true` if the element is frozen, `false` otherwise
 */
export function isElementFrozen(element: Element): boolean {
  if (!element) return false;

  // Check if this element itself is frozen
  const freezeProp = element.propObservables?.freeze ?? element.props?.freeze;

  if (freezeProp !== undefined && freezeProp !== null) {
    // Handle Signal<boolean>
    if (isSignal(freezeProp)) {
      if (freezeProp() === true) {
        return true;
      }
    } else if (freezeProp === true) {
      // Handle direct boolean
      return true;
    }
  }

  // Check if any parent is frozen (recursive check)
  if (element.parent) {
    return isElementFrozen(element.parent);
  }

  return false;
}

/**
 * Pauses or resumes all animatedSignals in an element based on freeze state.
 * 
 * @param element - The element containing animatedSignals
 * @param shouldPause - Whether to pause (true) or resume (false) animations
 */
function handleAnimatedSignalsFreeze(element: Element, shouldPause: boolean) {
  if (!element.propObservables) return;

  const processValue = (value: any) => {
    if (isSignal(value) && isAnimatedSignal(value as any)) {
      const animatedSig = value as unknown as AnimatedSignal<any>;
      if (shouldPause) {
        animatedSig.pause();
      } else {
        animatedSig.resume();
      }
    } else if (isObject(value) && !isElement(value)) {
      // Recursively process nested objects
      Object.values(value).forEach(processValue);
    }
  };

  Object.values(element.propObservables).forEach(processValue);
}

export function destroyElement(element: Element | Element[]) {
  if (Array.isArray(element)) {
    element.forEach((e) => destroyElement(e));
    return;
  }
  if (!element) {
    return;
  }
  if (element.props?.children) {
    for (let child of element.props.children) {
      destroyElement(child)
    }
  }
  for (let name in element.directives) {
    element.directives[name].onDestroy?.(element);
  }
  if (element.componentInstance && element.componentInstance.onDestroy) {
    element.componentInstance.onDestroy(element.parent as any, () => {
      element.propSubscriptions?.forEach((sub) => sub.unsubscribe());
      element.effectSubscriptions?.forEach((sub) => sub.unsubscribe());
      element.effectUnmounts?.forEach((fn) => {
        if (isPromise(fn)) {
          (fn as unknown as Promise<any>).then((retFn) => {
            retFn?.();
          });
        } else {
          fn?.();
        }
      });
    });
  } else {
    // If componentInstance is undefined or doesn't have onDestroy, still clean up subscriptions
    element.propSubscriptions?.forEach((sub) => sub.unsubscribe());
    element.effectSubscriptions?.forEach((sub) => sub.unsubscribe());
    element.effectUnmounts?.forEach((fn) => fn?.());
  }
}

/**
 * Creates a virtual element or a representation thereof, with properties that can be dynamically updated based on BehaviorSubjects.
 *
 * @param {string} tag - The tag name of the element to create.
 * @param {Object} props - An object containing properties for the element. Each property can either be a direct value
 *                         or an array where the first element is a function that returns a value based on input parameters,
 *                         and the second element is an array of BehaviorSubjects. The property is updated dynamically
 *                         using the combineLatest RxJS operator to wait for all BehaviorSubjects to emit.
 * @returns {Object} An object representing the created element, including tag name and dynamic properties.
 */
export function createComponent(tag: string, props?: Props): Element {
  if (!components[tag]) {
    throw new Error(`Component ${tag} is not registered`);
  }
  const instance = new components[tag]();
  const element: Element = {
    tag,
    props: {},
    componentInstance: instance,
    propSubscriptions: [],
    propObservables: props,
    parent: null,
    directives: {},
    effectUnmounts: [],
    effectSubscriptions: [],
    effectMounts: [],
    destroy() {
      destroyElement(this);
    },
    allElements: new Subject(),
    isFrozen: false,
  };

  // Iterate over each property in the props object
  if (props) {
    const recursiveProps = (props, path = "") => {
      const _set = (path, key, value) => {
        if (path == "") {
          element.props[key] = value;
          return;
        }
        set(element.props, path + "." + key, value);
      };

      Object.entries(props).forEach(([key, value]: [string, unknown]) => {
        if (isSignal(value)) {
          const _value = value as Signal<any>;
          if ("dependencies" in _value && _value.dependencies.size == 0) {
            _set(path, key, _value());
            // Handle freeze prop initialization
            if (key === "freeze") {
              element.isFrozen = _value() === true;
            }
            return;
          }

          // Handle freeze prop as signal
          if (key === "freeze") {
            element.isFrozen = _value() === true;

            // Pause/resume animatedSignals based on initial freeze state
            handleAnimatedSignalsFreeze(element, element.isFrozen);

            element.propSubscriptions.push(
              _value.observable.subscribe((freezeValue) => {
                const wasFrozen = element.isFrozen;
                element.isFrozen = freezeValue === true;

                // Handle animatedSignal pause/resume when freeze state changes
                if (wasFrozen !== element.isFrozen) {
                  handleAnimatedSignalsFreeze(element, element.isFrozen);
                }
              })
            );
            return;
          }

          element.propSubscriptions.push(
            _value.observable.subscribe((value) => {
              // Block updates if element is frozen
              if (isElementFrozen(element)) {
                // Pause animatedSignal if it's an animated signal
                if (isAnimatedSignal(_value as any)) {
                  (_value as unknown as AnimatedSignal<any>).pause();
                }
                return;
              }

              // Resume animatedSignal if it was paused
              if (isAnimatedSignal(_value as any)) {
                (_value as unknown as AnimatedSignal<any>).resume();
              }

              _set(path, key, value);
              if (element.directives[key]) {
                element.directives[key].onUpdate?.(value, element);
              }
              if (key == "tick") {
                // Block tick updates if element is frozen
                if (isElementFrozen(element)) {
                  return;
                }
                return
              }
              instance.onUpdate?.(
                path == ""
                  ? {
                    [key]: value,
                  }
                  : set({}, path + "." + key, value)
              );
            })
          );
        } else {
          // Handle freeze prop as direct boolean
          if (key === "freeze") {
            element.isFrozen = value === true;

            // Pause/resume animatedSignals based on freeze state
            handleAnimatedSignalsFreeze(element, element.isFrozen);
          }
          if (isObject(value) && key != "context" && !isElement(value)) {
            recursiveProps(value, (path ? path + "." : "") + key);
          } else {
            _set(path, key, value);
          }
        }
      });
    };
    recursiveProps(props);
  }

  instance.onInit?.(element.props);

  const elementsListen = new Subject<any>()

  if (props?.isRoot) {
    element.allElements = elementsListen
    element.props.context.rootElement = element;
    element.componentInstance.onMount?.(element);
    propagateContext(element);
  }

  if (props) {
    for (let key in props) {
      const directive = applyDirective(element, key);
      if (directive) element.directives[key] = directive;
    }
  }

  /**
   * Checks if all dependencies are ready (not undefined).
   * Handles signals synchronously and promises asynchronously.
   * For reactive signals, sets up subscriptions to mount when all become ready.
   * 
   * @param deps - Array of signals, promises, or direct values
   * @returns Promise<boolean> - true if all dependencies are ready
   */


  /**
   * Sets up subscriptions to reactive signal dependencies.
   * When all signals become defined, mounts the component.
   */
  /**
   * Sets up subscriptions to reactive signal dependencies.
   * When all signals become defined, mounts the component.
   */
  function setupDependencySubscriptions(
    parent: Element,
    element: Element,
    deps: any[],
    index?: number
  ) {
    const signalDeps = deps.filter((dep) => isSignal(dep));
    const promiseDeps = deps.filter((dep) => isPromise(dep));

    if (signalDeps.length === 0) {
      // No reactive signals, nothing to subscribe to
      return;
    }

    // Create observables from signals
    const signalObservables = signalDeps.map((sig) => sig.observable);

    // Combine all signal observables
    const subscription = combineLatest(signalObservables).subscribe(
      async () => {
        // Check if all dependencies are now ready
        const allReady = await checkDependencies(deps);
        if (allReady) {
          // Unsubscribe - we only need to mount once
          subscription.unsubscribe();
          // Remove from subscriptions
          const idx = element.propSubscriptions.indexOf(subscription);
          if (idx > -1) {
            element.propSubscriptions.splice(idx, 1);
          }
          // Now mount the component
          performMount(parent, element, index);
          propagateContext(element);
        }
      }
    );

    // Store subscription for cleanup
    element.propSubscriptions.push(subscription);
  }

  /**
   * Performs the actual mounting of the component.
   */
  function performMount(parent: Element, element: Element, index?: number) {
    element.componentInstance.onMount?.(element, index);
    for (let name in element.directives) {
      element.directives[name].onMount?.(element);
    }
    element.effectMounts.forEach((fn: any) => {
      element.effectUnmounts.push(fn(element));
    });
  }

  async function onMount(parent: Element, element: Element, index?: number) {
    let actualParent = parent;
    while (actualParent?.tag === 'fragment') {
      actualParent = actualParent.parent;
    }

    element.props.context = actualParent.props.context;
    element.parent = actualParent;

    // Inherit freeze state from parent if element doesn't have its own freeze prop
    if (!element.propObservables?.freeze && !element.props?.freeze && isElementFrozen(actualParent)) {
      element.isFrozen = true;
    }

    // Check dependencies before mounting
    if (element.props.dependencies && Array.isArray(element.props.dependencies)) {
      const deps = element.props.dependencies;
      const ready = await checkDependencies(deps);
      if (!ready) {
        // Set up subscriptions for reactive signals to trigger mount later
        setupDependencySubscriptions(actualParent, element, deps, index);
        return;
      }
    }

    performMount(actualParent, element, index);
  };

  async function propagateContext(element) {
    if (element.props.attach) {
      const isReactiveAttach = isSignal(element.propObservables?.attach)
      if (!isReactiveAttach) {
        element.props.children.push(element.props.attach)
      }
      else {
        await new Promise((resolve) => {
          let lastElement = null
          element.propSubscriptions.push(element.propObservables.attach.observable.subscribe(async (args) => {
            const value = args?.value ?? args
            if (!value) {
              throw new Error(`attach in ${element.tag} is undefined or null, add a component`)
            }
            if (lastElement) {
              destroyElement(lastElement)
            }
            lastElement = value
            await createElement(element, value)
            resolve(undefined)
          }))
        })
      }
    }
    if (!element.props.children) {
      return;
    }
    for (let i = 0; i < element.props.children.length; i++) {
      const child = element.props.children[i];
      if (!child) continue;
      await createElement(element, child, i)
    }
  };

  /**
 * Creates and mounts a child element to a parent element.
 * Handles different types of children: Elements, Promises resolving to Elements, and Observables.
 * 
 * @description This function is designed to handle reactive child components that can be:
 * - Direct Element instances
 * - Promises that resolve to Elements (for async components)
 * - Observables that emit Elements, arrays of Elements, or FlowObservable results
 * - Nested observables within arrays or FlowObservable results (handled recursively)
 * 
 * For Observables, it subscribes to the stream and automatically mounts/unmounts elements
 * as they are emitted. The function handles nested observables recursively, ensuring that
 * observables within arrays or FlowObservable results are also properly subscribed to.
 * All subscriptions are stored in the parent's effectSubscriptions for automatic cleanup.
 * 
 * @param {Element} parent - The parent element to mount the child to
 * @param {Element | Observable<any> | Promise<Element>} child - The child to create and mount
 * 
 * @example
 * ```typescript
 * // Direct element
 * await createElement(parent, childElement);
 * 
 * // Observable of elements (from cond, loop, etc.)
 * await createElement(parent, cond(signal(visible), () => h(Container)));
 * 
 * // Observable that emits arrays containing other observables
 * await createElement(parent, observableOfObservables);
 * 
 * // Promise resolving to element
 * await createElement(parent, import('./MyComponent').then(mod => h(mod.default)));
 * ```
 */
  async function createElement(parent: Element, child: Element | Observable<any> | Promise<Element>, childOrder?: number) {
    if (isPromise(child)) {
      child = await child;
    }

    const childGroups = ((parent as any).__childGroups ??= []);
    const resolvedOrder =
      childOrder ??
      (parent.props.children ? parent.props.children.indexOf(child as any) : -1);
    const childGroup = {
      order: resolvedOrder >= 0 ? resolvedOrder : childGroups.length,
      mounted: new Map<any, Element>(),
    };
    childGroups.push(childGroup);

    const getMountedIndex = (element?: Element): number | undefined => {
      const children = (parent.componentInstance as any)?.children;
      if (!element || !children) return;
      const index = children.indexOf(element.componentInstance);
      return index >= 0 ? index : undefined;
    };

    const getNextGroupIndex = (): number | undefined => {
      const nextGroups = childGroups
        .filter((group) => group !== childGroup && group.order > childGroup.order)
        .sort((a, b) => a.order - b.order);

      for (const group of nextGroups) {
        for (const mounted of group.mounted.values()) {
          const index = getMountedIndex(mounted);
          if (index !== undefined) return index;
        }
      }
    };

    const getInsertIndex = (
      sourceIndex: number,
      orderedSources: any[]
    ): number | undefined => {
      for (let i = sourceIndex + 1; i < orderedSources.length; i++) {
        const index = getMountedIndex(childGroup.mounted.get(orderedSources[i]));
        if (index !== undefined) return index;
      }
      return getNextGroupIndex();
    };

    const collectMountedInstances = (
      element: Element,
      instances: any[],
      childIndex: Map<any, number>,
      seen = new Set<Element>()
    ) => {
      if (!element || seen.has(element)) return;
      seen.add(element);

      const instance = element.componentInstance as any;
      if (childIndex.has(instance)) {
        instances.push(instance);
        return;
      }

      const nestedGroups = ((element as any).__childGroups ?? [])
        .slice()
        .sort((a, b) => a.order - b.order);
      for (const group of nestedGroups) {
        for (const mounted of group.mounted.values()) {
          collectMountedInstances(mounted, instances, childIndex, seen);
        }
      }
    };

    const reorderMountedChildGroups = () => {
      if (childGroups.length < 2) return;

      const parentInstance = parent.componentInstance as any;
      const children = parentInstance?.children;
      if (!children || typeof parentInstance.addChildAt !== "function") return;

      const childIndex = new Map<any, number>();
      children.forEach((child, index) => {
        childIndex.set(child, index);
      });

      const orderedInstances: any[] = [];
      const orderedGroups = childGroups
        .slice()
        .sort((a, b) => a.order - b.order);

      for (const group of orderedGroups) {
        for (const mounted of group.mounted.values()) {
          collectMountedInstances(mounted, orderedInstances, childIndex);
        }
      }

      const mountedIndices = orderedInstances
        .map((instance) => childIndex.get(instance))
        .filter((index): index is number => index !== undefined);
      if (!mountedIndices.length) return;

      let targetIndex = Math.min(...mountedIndices);
      for (const instance of orderedInstances) {
        if (children[targetIndex] !== instance) {
          parentInstance.addChildAt(instance, targetIndex);
        }
        targetIndex++;
      }
    };

    const mountElementAtDeclaredOrder = (
      element: Element,
      sourceIndex: number,
      orderedSources: any[]
    ) => {
      const mountResult = onMount(parent, element, getInsertIndex(sourceIndex, orderedSources));
      void Promise.resolve(mountResult).then(reorderMountedChildGroups);
      return mountResult;
    };

    if (child instanceof Observable) {
      const mountedFlowElements = childGroup.mounted;
      const flowEffectSubscriptions = ((child as any).effectSubscriptions ?? []) as Subscription[];
      const flowEffectMounts = ((child as any).effectMounts ?? []) as Array<(element?: Element) => any>;

      const applyFlowEffects = (element: Element) => {
        if (!flowEffectMounts.length) {
          return;
        }

        element.effectMounts = [
          ...flowEffectMounts,
          ...(element.effectMounts ?? []),
        ];
      };

      const createFragmentOwner = (): Element => ({
        tag: 'fragment',
        props: { children: [] },
        componentInstance: {} as any,
        propSubscriptions: [],
        effectSubscriptions: [],
        effectMounts: [],
        effectUnmounts: [],
        propObservables: {},
        parent,
        directives: {},
        destroy() { destroyElement(this) },
        allElements: new Subject(),
        isFrozen: false
      });

      const mountFlowElement = (
        element: Element,
        sourceIndex: number,
        orderedSources: any[],
        shouldReorder = false
      ) => {
        const mounted = mountedFlowElements.get(element);
        if (mounted) {
          if (shouldReorder) {
            const insertIndex = getInsertIndex(sourceIndex, orderedSources);
            const parentInstance = mounted.parent?.componentInstance as any;
            const childInstance = mounted.componentInstance as any;
            if (
              insertIndex !== undefined &&
              parentInstance &&
              typeof parentInstance.addChildAt === "function" &&
              parentInstance.children?.includes(childInstance)
            ) {
              parentInstance.addChildAt(childInstance, insertIndex);
            }
          }
          return;
        }

        const routed = routeDomComponent(parent, element);
        applyFlowEffects(routed);
        mountedFlowElements.set(element, routed);
        mountElementAtDeclaredOrder(routed, sourceIndex, orderedSources);
        propagateContext(routed);
      };

      const syncFlowElements = (nextElements: Set<any>) => {
        mountedFlowElements.forEach((mounted, source) => {
          if (nextElements.has(source)) {
            return;
          }
          mountedFlowElements.delete(source);
          if (mounted !== source) {
            destroyElement(mounted);
          }
        });
      };

      const processFlowComponent = (
        component: any,
        nextElements: Set<any>,
        index: number,
        orderedSources: any[],
        shouldReorder = false
      ) => {
        if (component instanceof Observable) {
          nextElements.add(component);
          if (!mountedFlowElements.has(component)) {
            const owner = createFragmentOwner();
            mountedFlowElements.set(component, owner);
            void createElement(owner, component);
          }
          return;
        }
        if (Array.isArray(component)) {
          component.forEach((comp) =>
            processFlowComponent(comp, nextElements, index, orderedSources, shouldReorder)
          );
          return;
        }
        if (!isElement(component)) {
          return;
        }

        nextElements.add(component);
        mountFlowElement(component, index, orderedSources, shouldReorder);
      };

      // Subscribe to the observable and handle the emitted values
      const subscription = child.subscribe(
        (value: any) => {
          // Handle different types of observable emissions
          if (value && typeof value === 'object' && 'elements' in value) {
            // Handle FlowObservable result (from loop, cond, etc.)
            const {
              elements: comp,
              prev,
              reorder,
            }: {
              elements: Element[];
              prev?: Element;
              reorder?: boolean;
            } = value;

            const components = comp.filter((c) => c !== null);
            const nextElements = new Set<any>();
            if (prev) {
              components.forEach((c) => {
                const index = parent.props.children.indexOf(prev.props.key);
                processFlowComponent(c, nextElements, index + 1, components);
              });
              syncFlowElements(nextElements);
              return;
            }
            components.forEach((component, index) => {
              processFlowComponent(component, nextElements, index, components, reorder);
            });
            syncFlowElements(nextElements);
          } else if (isElement(value)) {
            // Handle direct Element emission
            const routed = routeDomComponent(parent, value);
            applyFlowEffects(routed);
            childGroup.mounted.set(value, routed);
            mountElementAtDeclaredOrder(routed, 0, [value]);
            propagateContext(routed);
          } else if (Array.isArray(value)) {
            // Handle array of elements (which can also be observables)
            const nextElements = new Set<any>();
            value.forEach((element, index) => {
              processFlowComponent(element, nextElements, index, value);
            });
            syncFlowElements(nextElements);
          }
          elementsListen.next(undefined);
        }
      );

      subscription.add(() => {
        mountedFlowElements.forEach((mounted) => {
          destroyElement(mounted);
        });
        mountedFlowElements.clear();
        flowEffectSubscriptions.forEach((sub) => sub.unsubscribe());
      });

      // Store subscription for cleanup
      parent.effectSubscriptions.push(subscription);
    } else if (isElement(child)) {
      const routed = routeDomComponent(parent, child);
      childGroup.mounted.set(child, routed);
      mountElementAtDeclaredOrder(routed, 0, [child]);
      await propagateContext(routed);
    }
  }

  // Return the created element representation
  return element;
}

/**
 * Observes a BehaviorSubject containing an array or object of items and dynamically creates child elements for each item.
 *
 * @param {WritableArraySignal<T> | WritableObjectSignal<T>} itemsSubject - A signal that emits an array or object of items.
 * @param {Function} createElementFn - A function that takes an item and returns an element representation.
 * @returns {Observable} An observable that emits the list of created child elements.
 */
export function loop<T>(
  itemsSubject: any,
  createElementFn: (item: T, index: number | string) => Element | null,
  options: LoopOptions<T> = {}
): FlowObservable {

  if (isComputed(itemsSubject) && itemsSubject.dependencies.size == 0) {
    itemsSubject = signal(itemsSubject());
  }
  else if (!isSignal(itemsSubject)) {
    itemsSubject = signal(itemsSubject);
  }

  return defer(() => {
    let elements: Element[] = [];
    let elementMap = new Map<string | number, Element>();
    let isFirstSubscription = true;
    const getTrackKey = (item: T, index: number | string) =>
      options.track ? options.track(item, index) : index;

    const ensureElement = (itemResult: any): Element | null => {
      if (!itemResult) return null;
      if (isElement(itemResult)) return itemResult;
      return {
        tag: 'fragment',
        props: { children: Array.isArray(itemResult) ? itemResult : [itemResult] },
        componentInstance: {} as any,
        propSubscriptions: [],
        effectSubscriptions: [],
        effectMounts: [],
        effectUnmounts: [],
        propObservables: {},
        parent: null,
        directives: {},
        destroy() { destroyElement(this) },
        allElements: new Subject(),
        isFrozen: false
      };
    }

    const isArraySignal = (signal: any): signal is WritableArraySignal<T[]> =>
      Array.isArray(signal());

    const cleanupUntrackedElement = (element: Element | null) => {
      if (!element) return;
      element.propSubscriptions?.forEach((sub) => sub.unsubscribe());
      element.effectSubscriptions?.forEach((sub) => sub.unsubscribe());
      element.effectUnmounts?.forEach((fn) => fn?.());
    };

    const patchTrackedElement = (target: Element, source: Element) => {
      const nextProps = { ...source.props };
      const nextPropObservables = source.propObservables;

      if (target.props.context) {
        nextProps.context = target.props.context;
      }
      if (target.props.children && !source.props.children) {
        nextProps.children = target.props.children;
      }

      target.props = nextProps;
      target.propObservables = nextPropObservables;
      target.componentInstance.onUpdate?.(nextProps);
      Object.entries(target.directives).forEach(([name, directive]) => {
        if (name in nextProps) {
          directive.onUpdate?.(nextProps[name], target);
        }
      });

      cleanupUntrackedElement(source);
    };

    const removeElementFromMap = (element: Element) => {
      for (const [key, mappedElement] of elementMap.entries()) {
        if (mappedElement === element) {
          elementMap.delete(key);
          return;
        }
      }
    };

    const rebuildArrayElements = (items: T[] | undefined | null) => {
      if (!options.track) {
        elements.forEach(el => destroyElement(el));
        elements = [];
        elementMap.clear();

        if (items) {
          items.forEach((item, index) => {
            const element = ensureElement(createElementFn(item, index));
            if (element) {
              elements.push(element);
              elementMap.set(index, element);
            }
          });
        }
        return;
      }

      const previousMap = elementMap;
      const nextElements: Element[] = [];
      const nextMap = new Map<string | number, Element>();
      const usedElements = new Set<Element>();

      if (items) {
        items.forEach((item, index) => {
          const key = getTrackKey(item, index);
          const existing = previousMap.get(key);
          const nextElement = ensureElement(createElementFn(item, index));

          if (existing) {
            if (nextElement) {
              patchTrackedElement(existing, nextElement);
            }
            nextElements.push(existing);
            nextMap.set(key, existing);
            usedElements.add(existing);
            return;
          }

          if (nextElement) {
            nextElements.push(nextElement);
            nextMap.set(key, nextElement);
            usedElements.add(nextElement);
          }
        });
      }

      elements.forEach((element) => {
        if (!usedElements.has(element)) {
          destroyElement(element);
        }
      });

      elements = nextElements;
      elementMap = nextMap;
    };

    return new Observable<FlowResult>(subscriber => {
      const subscription = isArraySignal(itemsSubject)
        ? itemsSubject.observable.subscribe(change => {
          if (isFirstSubscription) {
            isFirstSubscription = false;
            rebuildArrayElements(itemsSubject());
            subscriber.next({
              elements: [...elements],
              reorder: Boolean(options.track)
            });
            return;
          }

          // Handle computed signals that emit array values directly (not ArrayChange objects)
          // When a computed emits, `change` is the array itself, not an object with `type`
          const isDirectArrayChange = Array.isArray(change) || (change && typeof change === 'object' && !('type' in change));

          if (change.type === 'init' || change.type === 'reset' || isDirectArrayChange) {
            rebuildArrayElements(itemsSubject());
          } else if (change.type === 'add' && change.index !== undefined) {
            const newElements = change.items.map((item, i) => {
              const index = change.index! + i;
              const element = ensureElement(createElementFn(item as T, index));
              if (element) {
                elementMap.set(getTrackKey(item as T, index), element);
              }
              return element;
            }).filter((el): el is Element => el !== null);

            elements.splice(change.index, 0, ...newElements);
          } else if (change.type === 'remove' && change.index !== undefined) {
            const removed = elements.splice(change.index, 1);
            removed.forEach(el => {
              destroyElement(el)
              removeElementFromMap(el);
            });
          } else if (change.type === 'update' && change.index !== undefined && change.items.length === 1) {
            const index = change.index;
            const newItem = change.items[0];
            const key = getTrackKey(newItem as T, index);

            // Check if the previous item at this index was effectively undefined or non-existent
            if (index >= elements.length || elements[index] === undefined || !elementMap.has(key)) {
              // Treat as add operation
              const newElement = ensureElement(createElementFn(newItem as T, index));
              if (newElement) {
                elements.splice(index, 0, newElement); // Insert at the correct index
                elementMap.set(key, newElement);
                // Adjust indices in elementMap for subsequent elements might be needed if map relied on exact indices
                // This simple implementation assumes keys are stable or createElementFn handles context correctly
              } else {
                console.warn(`Element creation returned null for index ${index} during add-like update.`);
              }
            } else {
              // Treat as a standard update operation
              const oldElement = elementMap.get(key) ?? elements[index];
              const newElement = ensureElement(createElementFn(newItem as T, index));
              if (options.track && oldElement && newElement) {
                patchTrackedElement(oldElement, newElement);
                elements[index] = oldElement;
                elementMap.set(key, oldElement);
              } else if (newElement) {
                destroyElement(oldElement)
                elements[index] = newElement;
                elementMap.set(key, newElement);
              } else {
                // Handle case where new element creation returns null
                destroyElement(oldElement)
                elements.splice(index, 1);
                elementMap.delete(key);
              }
            }
          }

          subscriber.next({
            elements: [...elements], // Create a new array to ensure change detection
            reorder: Boolean(options.track)
          });
        })
        : (itemsSubject as WritableObjectSignal<T>).observable.subscribe(change => {
          const key = change.key as string | number
          if (isFirstSubscription) {
            isFirstSubscription = false;
            elements.forEach(el => destroyElement(el));
            elements = [];
            elementMap.clear();

            const items = (itemsSubject as WritableObjectSignal<T>)();
            if (items) {
              Object.entries(items).forEach(([key, value]) => {
                const element = ensureElement(createElementFn(value as T, key));
                if (element) {
                  elements.push(element);
                  elementMap.set(key, element);
                }
              });
            }
            subscriber.next({
              elements: [...elements]
            });
            return;
          }

          if (change.type === 'init' || change.type === 'reset') {
            elements.forEach(el => destroyElement(el));
            elements = [];
            elementMap.clear();

            const items = (itemsSubject as WritableObjectSignal<T>)();
            if (items) {
              Object.entries(items).forEach(([key, value]) => {
                const element = ensureElement(createElementFn(value as T, key));
                if (element) {
                  elements.push(element);
                  elementMap.set(key, element);
                }
              });
            }
          } else if (change.type === 'add' && change.key && change.value !== undefined) {
            const element = ensureElement(createElementFn(change.value as T, key));
            if (element) {
              elements.push(element);
              elementMap.set(key, element);
            }
          } else if (change.type === 'remove' && change.key) {
            const index = elements.findIndex(el => elementMap.get(key) === el);
            if (index !== -1) {
              const [removed] = elements.splice(index, 1);
              destroyElement(removed)
              elementMap.delete(key);
            }
          } else if (change.type === 'update' && change.key && change.value !== undefined) {
            const index = elements.findIndex(el => elementMap.get(key) === el);
            if (index !== -1) {
              const oldElement = elements[index];
              destroyElement(oldElement)
              const newElement = ensureElement(createElementFn(change.value as T, key));
              if (newElement) {
                elements[index] = newElement;
                elementMap.set(key, newElement);
              }
            }
          }

          subscriber.next({
            elements: [...elements] // Create a new array to ensure change detection
          });
        });

      return () => {
        subscription.unsubscribe();
        elements.forEach(el => destroyElement(el));
      };
    });
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
}

/**
 * Conditionally creates and destroys elements based on condition signals with support for else if and else.
 *
 * @description This function creates conditional rendering with support for multiple conditions (if/else if/else pattern).
 * It evaluates conditions in order and renders the first matching condition's element.
 * The function maintains full reactivity with signals and ensures proper cleanup of elements.
 *
 * @param {Signal<boolean> | boolean | (() => boolean)} condition - A signal, boolean, or function that determines whether to create an element.
 * @param {Function} createElementFn - A function that returns an element or a promise that resolves to an element.
 * @param {...Array} additionalConditions - Additional conditions for else if and else cases.
 *   Can be:
 *   - A function for else case: `() => Element | Promise<Element>`
 *   - An array for else if case: `[Signal<boolean> | boolean | (() => boolean), () => Element | Promise<Element>]`
 * @returns {Observable} An observable that emits the created element based on the matching condition.
 *
 * @example
 * ```typescript
 * // Simple if/else
 * cond(
 *   signal(isVisible),
 *   () => h(Container),
 *   () => h(Text, { text: 'Hidden' }) // else
 * );
 *
 * // Multiple else if + else
 * cond(
 *   signal(status === 'loading'),
 *   () => h(LoadingSpinner),
 *   [signal(status === 'error'), () => h(ErrorMessage)], // else if
 *   [signal(status === 'success'), () => h(SuccessMessage)], // else if
 *   () => h(DefaultMessage) // else
 * );
 * ```
 */
export function cond(
  condition: Signal<boolean> | boolean | (() => boolean),
  createElementFn: () => Element | Promise<Element>,
  ...additionalConditions: Array<
    | (() => Element | Promise<Element>) // else final
    | [Signal<boolean> | boolean | (() => boolean), () => Element | Promise<Element>] // else if
  >
): FlowObservable {
  let currentElement: Element | null = null;
  let currentConditionIndex = -1;

  // Parse additional conditions
  const elseIfConditions: Array<{
    condition: Signal<boolean>;
    elementFn: () => Element | Promise<Element>;
  }> = [];
  let elseElementFn: (() => Element | Promise<Element>) | null = null;

  // Convert function conditions to computed signals
  const convertConditionToSignal = (cond: Signal<boolean> | boolean | (() => boolean)): Signal<boolean> => {
    if (isSignal(cond)) {
      return cond as Signal<boolean>;
    } else if (typeof cond === 'function') {
      return computed(cond as () => boolean);
    } else {
      return signal(cond as boolean);
    }
  };

  // Process additional conditions
  for (const param of additionalConditions) {
    if (Array.isArray(param)) {
      // else if case: [condition, elementFn]
      elseIfConditions.push({
        condition: convertConditionToSignal(param[0]),
        elementFn: param[1],
      });
    } else if (typeof param === 'function') {
      // else case: elementFn (should be the last one)
      elseElementFn = param;
      break; // Stop processing after else
    }
  }

  // Collect all conditions with their element functions
  const allConditions = [
    { condition: convertConditionToSignal(condition), elementFn: createElementFn },
    ...elseIfConditions,
  ];

  // All conditions are now signals, so we always use the reactive path
  return new Observable<{ elements: Element[], type?: "init" | "remove" }>(subscriber => {
    const subscriptions: Subscription[] = [];

    const evaluateConditions = () => {
      // Find the first matching condition
      let matchingIndex = -1;
      for (let i = 0; i < allConditions.length; i++) {
        const condition = allConditions[i].condition;
        const conditionValue = condition();

        if (conditionValue) {
          matchingIndex = i;
          break;
        }
      }

      // If no condition matches and we have an else, use else
      const shouldUseElse = matchingIndex === -1 && elseElementFn;
      const newConditionIndex = shouldUseElse ? -2 : matchingIndex; // -2 for else, -1 for nothing

      // Only update if the condition changed
      if (newConditionIndex !== currentConditionIndex) {
        // Destroy current element if it exists
        if (currentElement) {
          destroyElement(currentElement);
          currentElement = null;
        }

        currentConditionIndex = newConditionIndex;

        if (shouldUseElse) {
          // Render else element
          let _el = elseElementFn!();
          if (isPromise(_el)) {
            from(_el as Promise<Element>).subscribe(el => {
              currentElement = el;
              subscriber.next({
                type: "init",
                elements: [el],
              });
            });
          } else {
            currentElement = _el as Element;
            subscriber.next({
              type: "init",
              elements: [currentElement],
            });
          }
        } else if (matchingIndex >= 0) {
          // Render matching condition element
          let _el = allConditions[matchingIndex].elementFn();
          if (isPromise(_el)) {
            from(_el as Promise<Element>).subscribe(el => {
              currentElement = el;
              subscriber.next({
                type: "init",
                elements: [el],
              });
            });
          } else {
            currentElement = _el as Element;
            subscriber.next({
              type: "init",
              elements: [currentElement],
            });
          }
        } else {
          // No matching condition and no else
          subscriber.next({
            elements: [],
          });
        }
      }
    };

    // Subscribe to all signal conditions
    allConditions.forEach(({ condition }) => {
      const signalCondition = condition as WritableObjectSignal<boolean>;
      subscriptions.push(
        signalCondition.observable.subscribe(() => {
          evaluateConditions();
        })
      );
    });

    // Initial evaluation
    evaluateConditions();

    // Return cleanup function
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      if (currentElement) {
        destroyElement(currentElement);
      }
    };
  }).pipe(share());
}
