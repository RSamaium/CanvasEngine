import { ObservablePoint } from "pixi.js"

export function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

export function preciseNow(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function fps2ms(fps: number): number {
    return 1000 / fps
}

export function isPromise(value: any): boolean {
    return value && value instanceof Promise
}

export function arrayEquals(a: any[], b: any[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i])
}

export function isFunction(val: unknown): boolean {
    return {}.toString.call(val) === '[object Function]'
}

export function isObject(val: unknown): boolean {
    return typeof val == 'object' && val != null && !Array.isArray(val)
}

export function set(obj, path, value, onlyPlainObject = false) {
    if (Object(obj) !== obj) return obj;

    if (typeof path === 'string') {
        path = path.split('.');
    }

    let len = path.length;
    if (!len) return obj;

    let current = obj;
    for (let i = 0; i < len - 1; i++) {
        let segment = path[i];
        let nextSegment = path[i + 1];
        let isNextNumeric = !isNaN(nextSegment) && isFinite(nextSegment);

        if (!current[segment] || typeof current[segment] !== 'object') {
            current[segment] = (isNextNumeric && !onlyPlainObject) ? [] : {};
        }

        current = current[segment];
    }

    current[path[len - 1]] = value;

    return obj;
}

export function get(obj, path) {
    const keys = path.split('.');
    let current = obj;

    for (let key of keys) {
        if (current[key] === undefined) {
            return undefined;
        }
        current = current[key];
    }

    return current;
}

export function log(text) {
    console.log(text)
}

export function error(text) {
    console.error(text)
}

export function setObservablePoint(observablePoint: ObservablePoint, point: { x: number, y: number } |  number): void {
    if (typeof point === 'number') {
        observablePoint.set(point)
    }
    else {
        observablePoint.set(point.x, point.y)
    }
}

export function calculateDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}