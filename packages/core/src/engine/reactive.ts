import { Signal, WritableArraySignal, WritableObjectSignal, isSignal } from "@signe/reactive";
import {
  Observable,
  Subject,
  Subscription,
  defer,
  from,
  map,
  of,
  switchMap,
} from "rxjs";
import { ComponentInstance } from "../components/DisplayObject";
import { Directive, applyDirective } from "./directive";
import { isObject, isPromise, set } from "./utils";

export interface Props {
  [key: string]: any;
}

export type ArrayChange<T> = {
  type: "add" | "remove" | "update" | "init" | "reset";
  index?: number;
  items: T[];
};

export type ObjectChange<T> = {
  type: "add" | "remove" | "update" | "init" | "reset";
  key?: string;
  value?: T;
  items: T[];
};

type ElementObservable<T> = Observable<
  (ArrayChange<T> | ObjectChange<T>) & {
    value: Element | Element[];
  }
>;

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
  element.propSubscriptions.forEach((sub) => sub.unsubscribe());
  element.effectSubscriptions.forEach((sub) => sub.unsubscribe());
  for (let name in element.directives) {
    element.directives[name].onDestroy?.();
  }
  element.componentInstance.onDestroy?.(element.parent as any);
  element.effectUnmounts.forEach((fn) => fn?.());
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
                element.directives[key].onUpdate?.(value);
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
  itemsSubject: WritableArraySignal<T[]> | WritableObjectSignal<T>,
  createElementFn: (item: T, index: number | string) => Element | null
): FlowObservable {
  let elements: Element[] = [];

  const isArraySignal = '_subject' in itemsSubject && 'items' in (itemsSubject as any)._subject;

  const addAt = (items: T[], insertIndex: number | string, keys?: string[]): Element[] => {
    return items.map((item, index) => {
      const key = keys ? keys[index] : (typeof insertIndex === 'number' ? insertIndex + index : insertIndex);
      const element = createElementFn(item, key);
      if (typeof insertIndex === 'number') {
        elements.splice(insertIndex + index, 0, element);
      } else {
        elements.push(element);
      }
      return element;
    });
  };

  const getInitialItems = () => {
    if (isArraySignal) {
      return {
        items: (itemsSubject as any)._subject.items as T[],
        keys: undefined as string[] | undefined
      };
    } else {
      const entries = Object.entries((itemsSubject as any)._subject.value.value) as [string, T][];
      return {
        items: entries.map(([_, value]) => value),
        keys: entries.map(([key]) => key)
      };
    }
  };

  return defer(() => {
    const { items, keys } = getInitialItems();
    let initialItems = [...items];
    let initialKeys = keys ? [...keys] : undefined;
    let init = true;
    return (itemsSubject.observable as Observable<ArrayChange<T> | ObjectChange<T>>).pipe(
      map((event: ArrayChange<T> | ObjectChange<T>): FlowResult => {
        const { type, items } = event;
        const index = 'index' in event ? event.index : (event as ObjectChange<T>).key;

        if (init) {
          if (elements.length > 0) {
            return {
              elements: elements,
              fullElements: elements,
            };
          }
          const newElements = addAt(initialItems, 0, initialKeys);
          initialItems = [];
          initialKeys = undefined;
          init = false;
          return {
            elements: newElements,
            fullElements: elements,
          };
        } else if (type == "reset") {
          if (elements.length != 0) {
            elements.forEach((element) => {
              destroyElement(element);
            });
            elements = [];
          }
          if (!isArraySignal) {
            const entries = Object.entries((itemsSubject as any)._subject.value.value) as [string, T][];
            const newElements = addAt(
              entries.map(([_, value]) => value),
              0,
              entries.map(([key]) => key)
            );
            return {
              elements: newElements,
              fullElements: elements,
            };
          }
          const newElements = addAt(items as T[], 0);
          return {
            elements: newElements,
            fullElements: elements,
          };
        } else if (type == "add" && index != undefined) {
          const lastElement = typeof index === 'number' ? elements[index - 1] : elements[elements.length - 1];
          let newElements: Element[];
          if (!isArraySignal && typeof index === 'string') {
            // For object updates, create a single element with the new value
            const value = (event as ObjectChange<T>).value;
            if (value !== undefined) {
              newElements = [createElementFn(value, index)];
              elements.push(newElements[0]);
            } else {
              newElements = [];
            }
          } else {
            // For array updates, use addAt with the items array
            newElements = addAt(items as T[], index);
          }
          return {
            prev: lastElement,
            elements: newElements,
            fullElements: elements,
          };
        } else if (type == "remove") {
          if (!isArraySignal && typeof index === 'string') {
            // For object property deletion
            const elementIndex = elements.findIndex(el => {
              return el.props.text === index || el.props.key === index;
            });
            if (elementIndex !== -1) {
              const currentElement = elements[elementIndex];
              destroyElement(currentElement);
              elements.splice(elementIndex, 1);
            }
          } else if (typeof index === 'number') {
            // For array element deletion
            const currentElement = elements[index];
            destroyElement(currentElement);
            elements.splice(index, 1);
          }
          return {
            elements: [],
            fullElements: elements,
          };
        }
        return {
          elements: [],
          fullElements: elements,
        };
      })
    );
  });
}

/**
 * Conditionally creates and destroys elements based on a condition signal.
 *
 * @param {Signal<boolean> | boolean} condition - A signal or boolean that determines whether to create an element.
 * @param {Function} createElementFn - A function that returns an element or a promise that resolves to an element.
 * @returns {Observable} An observable that emits the created or destroyed element.
 */
export function cond(
  condition: Signal<boolean> | boolean,
  createElementFn: () => Element | Promise<Element>
): FlowObservable {
  let element: Element | null = null;
  
  if (isSignal(condition)) {
    const signalCondition = condition as WritableObjectSignal<boolean>;
    return new Observable<{elements: Element[], type?: "init" | "remove"}>(subscriber => {
      return signalCondition.observable.subscribe(bool => {
        if (bool) {
          let _el = createElementFn();
          if (isPromise(_el)) {
            from(_el as Promise<Element>).subscribe(el => {
              element = el;
              subscriber.next({
                type: "init",
                elements: [el],
              });
            });
          } else {
            element = _el as Element;
            subscriber.next({
              type: "init",
              elements: [element],
            });
          }
        } else if (element) {
          destroyElement(element);
          subscriber.next({
            elements: [],
          });
        } else {
          subscriber.next({
            elements: [],
          });
        }
      });
    });
  } else {
    // Handle boolean case
    if (condition) {
      let _el = createElementFn();
      if (isPromise(_el)) {
        return from(_el as Promise<Element>).pipe(
          map((el) => ({
            type: "init",
            elements: [el],
          }))
        );
      }
      return of({
        type: "init",
        elements: [_el as Element],
      });
    }
    return of({
      elements: [],
    });
  }
}
