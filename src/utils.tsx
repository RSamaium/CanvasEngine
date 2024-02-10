export function isBrowser(): boolean {
    return typeof window !== 'undefined'
}

export function preciseNow(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function fps2ms(fps: number): number {
    return 1000 / fps
}
