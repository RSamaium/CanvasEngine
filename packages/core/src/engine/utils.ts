import { ObservablePoint } from "pixi.js"

/**
 * Checks if code is running in a browser environment
 * @returns {boolean} True if running in browser, false otherwise
 */
export function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

/**
 * Returns current high-resolution timestamp
 * @returns {number} Current time in milliseconds
 */
export function preciseNow(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

/**
 * Converts frames per second to milliseconds
 * @param {number} fps - Frames per second
 * @returns {number} Milliseconds per frame
 */
export function fps2ms(fps: number): number {
    return 1000 / fps
}

/**
 * Checks if a value is a Promise
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a Promise, false otherwise
 */
export function isPromise(value: any): boolean {
    return value && value instanceof Promise
}

export function arrayEquals(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const v = a[i];
        const bv = b[i];
        if (typeof v === 'object' && v !== null) {
            if (typeof bv !== 'object' || bv === null) return false;
            if (Array.isArray(v)) {
                if (!Array.isArray(bv) || !arrayEquals(v, bv)) return false;
            } else if (!objectEquals(v, bv)) {
                return false;
            }
        } else if (v !== bv) {
            return false;
        }
    }
    return true;
}

function objectEquals(a: object, b: object): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let key of keysA) {
        if (!b.hasOwnProperty(key)) return false;
        if (!deepEquals(a[key], b[key])) return false;
    }
    return true;
}

function deepEquals(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object' && a !== null) {
        if (Array.isArray(a)) {
            return Array.isArray(b) && arrayEquals(a, b);
        }
        return objectEquals(a, b);
    }
    return false;
}

/**
 * Checks if a value is a function
 * @param {unknown} val - Value to check
 * @returns {boolean} True if value is a function, false otherwise
 */
export function isFunction(val: unknown): boolean {
    return {}.toString.call(val) === '[object Function]'
}

/**
 * Checks if a value is a plain object
 * @param {unknown} val - Value to check
 * @returns {boolean} True if value is an object (not null and not array), false otherwise
 */
export function isObject(val: unknown): boolean {
    return typeof val == 'object' && val != null && !Array.isArray(val)
}

/**
 * Sets a value in an object using a dot notation path
 * @param {Record<string, any>} obj - Target object
 * @param {string | string[]} path - Path to set value at (e.g., 'a.b.c' or ['a', 'b', 'c'])
 * @param {any} value - Value to set
 * @param {boolean} onlyPlainObject - If true, only creates plain objects in path
 * @returns {Record<string, any>} Modified object
 */
export function set(
    obj: Record<string, any>, 
    path: string | string[], 
    value: any, 
    onlyPlainObject = false
): Record<string, any> {
    if (Object(obj) !== obj) return obj;

    if (typeof path === 'string') {
        path = path.split('.');
    }

    let len = path.length;
    if (!len) return obj;

    let current = obj;
    for (let i = 0; i < len - 1; i++) {
        let segment = path[i];
        let nextSegment: number | string = path[i + 1];
        let isNextNumeric = !isNaN(Number(nextSegment)) && isFinite(Number(nextSegment));

        if (!current[segment] || typeof current[segment] !== 'object') {
            current[segment] = (isNextNumeric && !onlyPlainObject) ? [] : {};
        }

        current = current[segment];
    }

    current[path[len - 1]] = value;

    return obj;
}

/**
 * Gets a value from an object using a dot notation path
 * @param {Record<string, any>} obj - Source object
 * @param {string} path - Path to get value from (e.g., 'a.b.c')
 * @returns {any} Value at path or undefined if not found
 */
export function get(obj: Record<string, any>, path: string): any {
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

/**
 * Logs a message to console
 * @param {any} text - Message to log
 */
export function log(text: any): void {
    console.log(text)
}

/**
 * Logs an error message to console
 * @param {any} text - Error message to log
 */
export function error(text: any): void {
    console.error(text)
}

/**
 * Sets the position of an ObservablePoint using various input formats
 * @param {ObservablePoint} observablePoint - The point to modify
 * @param {Object | number | [number, number]} point - New position value
 */
export function setObservablePoint(
    observablePoint: ObservablePoint, 
    point: { x: number, y: number } | number | [number, number]
): void {
    if (typeof point === 'number') {
        observablePoint.set(point);
    }
    else if (Array.isArray(point)) {
        observablePoint.set(point[0], point[1]);
    }
    else {
        observablePoint.set(point.x, point.y);
    }
}

/**
 * Calculates the Euclidean distance between two points
 * @param {number} x1 - X coordinate of first point
 * @param {number} y1 - Y coordinate of first point
 * @param {number} x2 - X coordinate of second point
 * @param {number} y2 - Y coordinate of second point
 * @returns {number} Distance between the points
 */
export function calculateDistance(
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number
): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}