import { Observable, Subject, Subscription, combineLatest, map } from 'rxjs';
import { Signal, WritableArraySignal, WritableSignal, isSignal, signal } from './signal';
import { ComponentInstance } from '../components/DisplayObject';
import { Directive, applyDirective } from './directive';
import { type ArrayChange, ArraySubject } from './ArraySubject';

export interface Props {
    [key: string]: any;
}

type ElementObservable<T> = Observable<ArrayChange<T> & {
    value: Element | Element[]
}>;

export interface Element<T = ComponentInstance> {
    tag: string;
    props: Props;
    componentInstance: T;
    propSubscriptions: Subscription[];
    effectSubscriptions: Subscription[];
    effectMounts: (() => void)[];
    effectUnmounts: ((element?: Element) => void)[];
    propObservables: {
        [key: string]: Signal<any>;
    } | undefined
    parent: Element | null;
    context?: {
        [key: string]: any;
    },
    directives: {
        [key: string]: Directive;
    }
}

type FlowObservable = Observable<{
    elements: Element[]
    prev?: Element
}>

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
    element.effectSubscriptions.forEach(sub => sub.unsubscribe())
    for (let name in element.directives) {
        element.directives[name].onDestroy?.()
    }
    element.componentInstance.onDestroy?.(element.parent as any)
    element.effectUnmounts.forEach(fn => fn())
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
        throw new Error(`Component ${tag} is not registered`)
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
        effectMounts: []
    };

    // Iterate over each property in the props object
    if (props) {
        Object.entries(props).forEach(([key, value]: [string, Signal]) => {
            if (isSignal(value)) {
                element.propSubscriptions.push(value.observable.subscribe((value) => {
                    element.props[key] = value
                    if (element.directives[key]) {
                        element.directives[key].onUpdate?.(value)
                    }
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

    const onMount = (parent: Element, element: Element, index?: number) => {
        element.props.context = parent.props.context
        element.parent = parent
        element.componentInstance.onMount?.(element, index)
        element.effectMounts.forEach((fn: any) => {
            element.effectUnmounts.push(fn(element))
        })
    }

    if (props?.context) {
        // propagate recrusively context in all children
        const propagateContext = (element) => {
            if (!element.props.children) {
                return
            }
            for (let child of element.props.children) {
                if (child instanceof Observable) {
                    child.subscribe(({ elements: comp, prev }: { elements: Element[], prev?: Element }) => {
                        // if prev, insert element after this
                        if (prev) {
                            comp.forEach(c => {
                                const index = element.props.children.indexOf(prev.props.key)
                                onMount(element, c, index + 1)
                                propagateContext(c)
                            })
                            return
                        }
                        comp.forEach(c => {
                            onMount(element, c)
                            propagateContext(c)
                        })
                    })
                }
                else {
                    onMount(element, child)
                    propagateContext(child)
                }
            }
        }

        element.componentInstance.onMount?.(element)
        propagateContext(element)
    }

    if (props) {
        for (let key in props) {
            const directive = applyDirective(element, key)
            if (directive) element.directives[key] = directive
        }
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
export function loop<T = any>(itemsSubject: WritableArraySignal<T>, createElementFn: (item: any, index: number) => Element): FlowObservable {
    let elements: Element[] = []
    let initialItems = [...itemsSubject._subject.items]

    const addAt = (items, insertIndex: number) => {
        return items.map((item, index) => {
            const element = createElementFn(item, insertIndex + index)
            elements.splice(insertIndex + index, 0, element)
            return element
        })
    }

    return itemsSubject.observable.pipe(
        map((event: ArrayChange<T>) => {
            const { type, items, index } = event
            if (type == 'init' || initialItems.length > 0) {
                if (elements.length! = 0) {
                    elements.forEach((element) => {
                        destroyElement(element)
                    })
                    elements = []
                }
                const newElements = addAt(initialItems, 0)
                initialItems = []
                return {
                    elements: newElements
                }
            }
            else if (type == 'add' && index != undefined) {
                const lastElement = elements[index - 1]
                const newElements = addAt(items, index)
                return {
                    prev: lastElement,
                    elements: newElements
                }
            }
            else if (index != undefined && type == 'remove') {
                const currentElement = elements[index]
                destroyElement(currentElement)
                elements.splice(index, 1)
                return {
                    elements: []
                }
            }
            return {
                elements: []
            }
        })
    )
}

export function cond(condition: Signal, createElementFn: () => Element): FlowObservable {
    let element: Element | null = null
    return condition.observable
        .pipe(
            map((bool) => {
                if (bool) {
                    const _el = createElementFn()
                    element = _el
                    return {
                        type: 'init',
                        elements: [element]
                    }
                }
                else if (element) {
                    destroyElement(element)
                }
                return {
                    elements: []
                }
            })
        )
}