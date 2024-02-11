import { BehaviorSubject, Observable, Subscription, combineLatest, map } from 'rxjs';

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

let currentDependencyTracker: ((signal) => void) | null = null;

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

export function computed<T = any>(computeFunction: () => T): ComputedSignal<T> {
    const dependencies: Set<WritableSignal<any>> = new Set();

    currentDependencyTracker = (signal) => {
        dependencies.add(signal);
    };

    computeFunction();

    currentDependencyTracker = null;


    const computedObservable = combineLatest([...dependencies].map(signal => signal.observable))
        .pipe(map(() => computeFunction()));

    let lastComputedValue;

    const fn = function () {
        return lastComputedValue;
    };

    fn.observable = computedObservable;

    fn.subscription = computedObservable.subscribe(value => {
        lastComputedValue = value;
    });

    return fn
}

export function effect(effectFunction) {
    let dependencies = new Set(); 

    const executeEffect = () => {

        let newDependencies = new Set();


        currentDependencyTracker = (signal) => {
            newDependencies.add(signal);
            if (!dependencies.has(signal)) {
                
                signal.observable.subscribe(() => {
                    executeEffect();
                });
            }
        };

        effectFunction()


        dependencies.forEach(dep => {
            if (!newDependencies.has(dep)) {
                
            }
        });


        dependencies = newDependencies;

        currentDependencyTracker = null;
    };


    executeEffect();
}

export function isSignal(value) {
    return value && value.observable
}

const count = signal(1);

effect(() => {
    console.log(`La valeur actuelle de count est ${count()}`);
});

count.set(2); 
