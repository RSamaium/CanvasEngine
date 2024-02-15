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