import { BehaviorSubject, Observable, Subscription, combineLatest, finalize, map } from 'rxjs';
import { Element } from './reactive';

export interface WritableSignal<T = any> {
    (): T;
    set(value: T): void;
    update(updateFn: (value: T) => T): void;
    observable: Observable<T>;
}

export interface ComputedSignal<T = any> {
    (): T;
    observable: Observable<T>;
    subscription: Subscription;
}

export type Signal<T = any> = WritableSignal<T> | ComputedSignal<T>;

type MountFunction = (fn: (element: Element) => void | (() => void)) => void;

let currentDependencyTracker: ((signal) => void) | null = null;
let currentSubscriptionsTracker: ((subscription) => void) | null = null;
let mountTracker: MountFunction | null = null;

const trackDependency = (signal) => {
    if (currentDependencyTracker) {
        currentDependencyTracker(signal);
    }
};

export function signal<T = any>(defaultValue: T): WritableSignal<T> {
    const subject = new BehaviorSubject(defaultValue);
    const fn = function () {
        trackDependency(fn);
        return subject.value;
    };
    fn.set = (value) => subject.next(value);
    fn.update = (updateFn) => subject.next(updateFn(subject.value));
    fn.observable = subject.asObservable();
    return fn;
}

export function computed<T = any>(computeFunction: () => T, disposableFn?: () => void): ComputedSignal<T> {
    const dependencies: Set<WritableSignal<any>> = new Set();

    currentDependencyTracker = (signal) => {
        dependencies.add(signal);
    };

    const ret = computeFunction();
    if (computeFunction['isEffect']) {
        disposableFn = ret as any
    }

    currentDependencyTracker = null;

    const computedObservable = combineLatest([...dependencies].map(signal => signal.observable))
        .pipe(
            map(() => computeFunction()),
            finalize(() => disposableFn?.())
        )

    let lastComputedValue;

    const fn = function () {
        trackDependency(fn);
        return lastComputedValue;
    };

    fn.observable = computedObservable;

    fn.subscription = computedObservable.subscribe(value => {
        lastComputedValue = value;
    });

    currentSubscriptionsTracker?.(fn.subscription);

    return fn
}

export function effect(fn: () => void) {
    fn['isEffect'] = true
    return computed(fn);
}

export function mount(fn: MountFunction) {
    mountTracker?.(fn);
}

export function h(componentFunction, props = {}, ...children) {
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

