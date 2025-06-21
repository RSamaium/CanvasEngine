import { ArrayChange, ObjectChange, Signal, WritableArraySignal, WritableObjectSignal, isComputed, isSignal, signal, computed } from "@signe/reactive";
import {
  Observable,
  Subject,
  Subscription,
  defer,
  from,
  map,
  of,
  share,
  switchMap,
  debounceTime,
  distinctUntilChanged,
  bufferTime,
  filter,
  throttleTime,
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
}

type FlowResult = {
  elements: Element[];
  prev?: Element;
  fullElements?: Element[];
};

type FlowObservable = Observable<FlowResult>;

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

export function registerComponent(name, component) {
  components[name] = component;
}

function destroyElement(element: Element | Element[]) {
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
      element.effectUnmounts?.forEach((fn) => fn?.());
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
            return;
          }
          element.propSubscriptions.push(
            _value.observable.subscribe((value) => {
              _set(path, key, value);
              if (element.directives[key]) {
                element.directives[key].onUpdate?.(value, element);
              }
              if (key == "tick") {
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

  function onMount(parent: Element, element: Element, index?: number) {
    element.props.context = parent.props.context;
    element.parent = parent;
    element.componentInstance.onMount?.(element, index);
    for (let name in element.directives) {
      element.directives[name].onMount?.(element);
    }
    element.effectMounts.forEach((fn: any) => {
      element.effectUnmounts.push(fn(element));
    });
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
    for (let child of element.props.children) {
      if (!child) continue;
      await createElement(element, child)
    }
  };

  async function createElement(parent: Element, child: Element) {
    if (isPromise(child)) {
      child = await child;
    }
    if (child instanceof Observable) {
      child.subscribe(
        ({
          elements: comp,
          prev,
        }: {
          elements: Element[];
          prev?: Element;
        }) => {
          // if prev, insert element after this
          const components = comp.filter((c) => c !== null);
          if (prev) {
            components.forEach((c) => {
              const index = parent.props.children.indexOf(prev.props.key);
              onMount(parent, c, index + 1);
              propagateContext(c);
            });
            return;
          }
          components.forEach((component) => {
            if (!Array.isArray(component)) {
              onMount(parent, component);
              propagateContext(component);
            } else {
              component.forEach((comp) => {
                onMount(parent, comp);
                propagateContext(comp);
              });
            }
          });
          elementsListen.next(undefined)
        }
      );
    } else {
      onMount(parent, child);
      await propagateContext(child);
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
  createElementFn: (item: T, index: number | string) => Element | null
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

    const isArraySignal = (signal: any): signal is WritableArraySignal<T[]> => 
      Array.isArray(signal());

    return new Observable<FlowResult>(subscriber => {
      const subscription = isArraySignal(itemsSubject)
        ? itemsSubject.observable.subscribe(change => {
            if (isFirstSubscription) {
              isFirstSubscription = false;
              elements.forEach(el => el.destroy());
              elements = [];
              elementMap.clear();

              const items = itemsSubject();
              if (items) {
                items.forEach((item, index) => {
                  const element = createElementFn(item, index);
                  if (element) {
                    elements.push(element);
                    elementMap.set(index, element);
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

              const items = itemsSubject();
              if (items) {
                items.forEach((item, index) => {
                  const element = createElementFn(item, index);
                  if (element) {
                    elements.push(element);
                    elementMap.set(index, element);
                  }
                });
              }
            } else if (change.type === 'add' && change.index !== undefined) {
              const newElements = change.items.map((item, i) => {
                const element = createElementFn(item as T, change.index! + i);
                if (element) {
                  elementMap.set(change.index! + i, element);
                }
                return element;
              }).filter((el): el is Element => el !== null);
              
              elements.splice(change.index, 0, ...newElements);
            } else if (change.type === 'remove' && change.index !== undefined) {
              const removed = elements.splice(change.index, 1);
              removed.forEach(el => {
                destroyElement(el)
                elementMap.delete(change.index!);
              });
            } else if (change.type === 'update' && change.index !== undefined && change.items.length === 1) {
              const index = change.index;
              const newItem = change.items[0];

              // Check if the previous item at this index was effectively undefined or non-existent
              if (index >= elements.length || elements[index] === undefined || !elementMap.has(index)) {
                // Treat as add operation
                const newElement = createElementFn(newItem as T, index);
                if (newElement) {
                  elements.splice(index, 0, newElement); // Insert at the correct index
                  elementMap.set(index, newElement);
                  // Adjust indices in elementMap for subsequent elements might be needed if map relied on exact indices
                  // This simple implementation assumes keys are stable or createElementFn handles context correctly
                } else {
                     console.warn(`Element creation returned null for index ${index} during add-like update.`);
                }
              } else {
                // Treat as a standard update operation
                const oldElement = elements[index];
                destroyElement(oldElement)
                const newElement = createElementFn(newItem as T, index);
                if (newElement) {
                  elements[index] = newElement;
                  elementMap.set(index, newElement);
                } else {
                  // Handle case where new element creation returns null
                  elements.splice(index, 1);
                  elementMap.delete(index);
                }
              }
            }

            subscriber.next({
              elements: [...elements] // Create a new array to ensure change detection
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
                  const element = createElementFn(value, key);
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
                  const element = createElementFn(value, key);
                  if (element) {
                    elements.push(element);
                    elementMap.set(key, element);
                  }
                });
              }
            } else if (change.type === 'add' && change.key && change.value !== undefined) {
              const element = createElementFn(change.value as T, key);
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
                const newElement = createElementFn(change.value as T, key);
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

      return subscription;
    });
  });
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
  return new Observable<{elements: Element[], type?: "init" | "remove"}>(subscriber => {
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
