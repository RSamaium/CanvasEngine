import { Observable, Subject, Subscription, combineLatest, map } from 'rxjs';
import { Signal, isSignal, signal } from './signal';
import { ComponentInstance } from '../components/DisplayObject';

export interface Props {
    [key: string]: any;
}

type ElementObservable = Observable<{
    destroyed: boolean;
    value: Element | Element[];
}>;


export interface Element<T = ComponentInstance> {
    tag: string;
    props: Props;
    componentInstance: T;
    propSubscriptions: Subscription[];
    parent: Element | null;
    context?: {
        [key: string]: any;
    }
}

const components: { [key: string]: any } = {}

export const isPrimitive = (value) => {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined
}

export function registerComponent(name, component) {
    components[name] = component;
}

function destroyElement(element: Element) {
    if (!element) {
        return
    }
    element.propSubscriptions.forEach(sub => sub.unsubscribe())
    element.componentInstance.onDestroy?.(element.parent as any)
}

function insertElement(parent: Element, element: Element) {
    element.parent = parent
    element.componentInstance.onInsert?.(parent)
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
export function h(tag: string, props?: Props): Element {
    if (!components[tag]) {
        throw new Error(`Component ${tag} is not registered`)
    }
    const instance = new components[tag]();
    const element: Element = {
        tag,
        props: {},
        componentInstance: instance,
        propSubscriptions: [],
        parent: null
    };

    // Iterate over each property in the props object
    if (props) {
        Object.entries(props).forEach(([key, value]: [string, Signal]) => {
            if (isSignal(value)) {
                element.propSubscriptions.push(value.observable.subscribe((value) => {
                    element.props[key] = value
                    instance.onUpdate?.({
                        [key]: value
                    }, element.props);
                }))
            }
            else {
                element.props[key] = value
            }
        });
    }

    instance.onInit?.(element.props);
    instance.onUpdate?.(element.props);

    if (props?.children) {
        props.children.forEach((child) => {
            if (child instanceof Observable) {
                child.subscribe(({ destroyed, value: comp }) => {
                    if (destroyed) {
                        destroyElement(comp)
                        return
                    }
                    if (Array.isArray(comp)) {
                        comp.forEach(c => {
                            if (c.inCache) {
                                return
                            }
                            insertElement(element, c)
                        })
                        return
                    }
                    insertElement(element, comp)
                })
            }
            else {
                insertElement(element, child)
            }
        });
    }

    if (props?.context) {
        // propagate recrusively context in all children
        const propagateContext = (element) => {
            if (!element.props.children) {
                return
            }
            for (let child of element.props.children) {
                if (Array.isArray(child)) {
                    child.forEach(c => {
                        if (c.inCache) {
                            return
                        }
                        c.props.context = element.props.context
                        child.componentInstance.onContext?.(c)
                        propagateContext(c)
                    })
                }
                else {
                    child.props.context = element.props.context
                    child.componentInstance.onContext?.(child)
                    propagateContext(child)
                }
            }
        }

        element.componentInstance.onContext?.(element)
        propagateContext(element)
    }

    // Return the created element representation
    return element;
}

/**
    * Observes a BehaviorSubject containing an array of items and dynamically creates child elements for each item.
    * 
    * @param {BehaviorSubject<Array>} itemsSubject - A BehaviorSubject that emits an array of items.
    * @param {Function} createElementFn - A function that takes an item and returns an element representation.
    * @returns {Observable} An observable that emits the list of created child elements.
    */
export function loop(itemsSubject: Signal<any[]>, createElementFn): ElementObservable {
    const cacheKeys = {}
    return itemsSubject.observable.pipe(
        map(items => ({
            destroyed: false,
            value: items.map((item, index) => {
                const key = item.key || index
                if (cacheKeys[key]) {
                    return {
                        inCache: true,
                    }
                }
                cacheKeys[key] = true
                return createElementFn(item)
            })
        })),
    )
}

export function cond(condition: Signal, createElementFn) {
    let element = null
    return condition.observable
        .pipe(
            map((bool) => {
                if (bool) {
                    const _el = createElementFn()
                    element = _el
                    return {
                        destroyed: false,
                        value: _el
                    }
                }
                else {
                    return {
                        destroyed: true,
                        value: element
                    }
                }
            })
        )
}