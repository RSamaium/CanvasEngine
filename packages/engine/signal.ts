import { animate as motion } from "popmotion";
import { BehaviorSubject, Observable, Subscription, combineLatest, filter, finalize, map } from 'rxjs';
import { ArrayChange, ArraySubject } from './ArraySubject';
import type { Element } from './reactive';

interface BaseWritableSignal<T = any> {
    (): T;
    set(value: T): void;
    mutate(mutateFn: (value: T) => void): void;
    update(updateFn: (value: T) => T): void;
}

export interface WritableSignal<T = any> extends BaseWritableSignal<T> {
    observable: Observable<T>;
}

export interface WritableArraySignal<T = any> extends BaseWritableSignal<T> {
    observable: Observable<ArrayChange<T>>;
    _subject: ArraySubject<T>;
}

export interface ComputedSignal<T = any> {
    (): T;
    observable: Observable<T>;
    subscription: Subscription;
}

export type Signal<T = any> = WritableSignal<T> | ComputedSignal<T>;
export type Effect = ComputedSignal<void>;

type MountFunction = (fn: (element: Element) => void | (() => void)) => void;

let currentDependencyTracker: ((signal) => void) | null = null;
let currentSubscriptionsTracker: ((subscription) => void) | null = null;
let mountTracker: MountFunction | null = null;

const trackDependency = (signal) => {
    if (currentDependencyTracker) {
        currentDependencyTracker(signal);
    }
};

export function signal<T extends any[]>(defaultValue: T): WritableArraySignal<T>;
export function signal<T>(defaultValue: T): WritableSignal<T>;
export function signal<T = any>(
    defaultValue: T
): T extends Array<any> ? WritableArraySignal<T> : WritableSignal<T> {
    let subject
    if (Array.isArray(defaultValue)) {
        subject = new ArraySubject(defaultValue)
    }
    else {
        subject = new BehaviorSubject(defaultValue);
    }
    const getValue = () => {
        if (subject instanceof ArraySubject) {
            return subject.items;
        }
        return subject.value;
    }
    const fn = function () {
        trackDependency(fn);
        return getValue()
    };
    fn.set = (value) => {
        if (subject instanceof ArraySubject) {
            subject.items = value;
            return
        }
        subject.next(value);
    }
    fn.mutate = (mutateFn) => {
        const value = getValue()
        mutateFn(value)
    }
    fn.update = (updateFn) => fn.set(updateFn(subject instanceof ArraySubject ? subject.items : subject.value));
    fn.animate = (value, options: any = {}) => {
        const currentValue = getValue()
        return motion({
            ...options,
            from: currentValue,
            to: typeof value === 'function' ? value(currentValue) : value,
            onUpdate: (v) => {
                if (options.onUpdate) options.onUpdate(v)
                fn.set(v)
            }
        })
    }
    fn.observable = subject.asObservable();
    fn._subject = subject;
    return fn as any;
}

export function computed<T = any>(computeFunction: () => T, disposableFn?: () => void): ComputedSignal<T> {
    const dependencies: Set<WritableSignal<any>> = new Set();
    let init = true
    let lastComputedValue;

    currentDependencyTracker = (signal) => {
        dependencies.add(signal);
    };

    lastComputedValue = computeFunction();
    if (computeFunction['isEffect']) {
        disposableFn = lastComputedValue as any
    }

    currentDependencyTracker = null;

    const computedObservable = combineLatest([...dependencies].map(signal => signal.observable))
        .pipe(
            filter(() => !init),
            map(() => computeFunction()),
            finalize(() => disposableFn?.())
        )

    const fn = function () {
        trackDependency(fn);
        return lastComputedValue;
    };

    fn.observable = computedObservable;

    fn.subscription = computedObservable.subscribe(value => {
        lastComputedValue = value;
    });

    currentSubscriptionsTracker?.(fn.subscription);

    init = false

    return fn
}

export function effect(fn: () => void): Effect {
    fn['isEffect'] = true
    return computed(fn);
}

export function mount(fn: MountFunction) {
    mountTracker?.(fn);
}

export function h(componentFunction, props = {}, ...children): Element | Promise<Element> {
    const allSubscriptions = new Set<Subscription>();
    const allMounts = new Set<MountFunction>();

    currentSubscriptionsTracker = (subscription) => {
        allSubscriptions.add(subscription);
    }

    mountTracker = (fn: any) => {
        allMounts.add(fn);
    }

    const component = componentFunction({ ...props, children })
    component.effectSubscriptions = Array.from(allSubscriptions);
    component.effectMounts = Array.from(allMounts);

    currentSubscriptionsTracker = null;
    mountTracker = null

    return component
}

export function isSignal(value) {
    return value && value.observable
}

