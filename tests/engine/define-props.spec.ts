import { describe, it, expect } from 'vitest'
import { useDefineProps, signal, isSignal, computed, trigger, on } from 'canvasengine'

describe('useDefineProps', () => {

    it('Just Get the props', () => {
        const defineProps = useDefineProps({ speed: 1 })
        const props = defineProps()

        expect(props.speed()).toBe(1)
    })

    it('should handle basic props with default values', () => {
        const defineProps = useDefineProps({ speed: 1 })
        const props = defineProps({
            speed: {
                default: 0.05
            }
        })

        expect(isSignal(props.speed)).toBe(true)
        expect(props.speed()).toBe(1)
    })

    it('should use default value when prop is undefined', () => {
        const defineProps = useDefineProps({})
        const props = defineProps({
            speed: {
                default: 0.05
            }
        })

        expect(isSignal(props.speed)).toBe(true)
        expect(props.speed()).toBe(0.05)
    })

    it('should handle type validation', () => {
        const defineProps = useDefineProps({ speed: 1, name: 'test' })
        const props = defineProps({
            speed: { type: Number },
            name: { type: String }
        })

        expect(props.speed()).toBe(1)
        expect(props.name()).toBe('test')
    })

    it('should throw error for invalid type', () => {
        const defineProps = useDefineProps({ speed: 'invalid' })
        
        expect(() => {
            defineProps({
                speed: { type: Number }
            })
        }).toThrow('Invalid prop: type check failed for prop "speed"')
    })

    it('should handle required props', () => {
        const defineProps = useDefineProps({ speed: 1 })
        const props = defineProps({
            speed: { required: true }
        })

        expect(props.speed()).toBe(1)
    })

    it('should throw error for missing required prop', () => {
        const defineProps = useDefineProps({})
        
        expect(() => {
            defineProps({
                speed: { required: true }
            })
        }).toThrow('Missing required prop: speed')
    })

    it('should handle custom validator', () => {
        const defineProps = useDefineProps({ speed: 5 })
        const props = defineProps({
            speed: {
                validator: (value) => value >= 0 && value <= 10
            }
        })

        expect(props.speed()).toBe(5)
    })

    it('should throw error for invalid custom validation', () => {
        const defineProps = useDefineProps({ speed: 20 })
        
        expect(() => {
            defineProps({
                speed: {
                    validator: (value) => value >= 0 && value <= 10
                }
            })
        }).toThrow('Invalid prop: custom validation failed for prop "speed"')
    })

    it('should handle multiple types', () => {
        const defineProps = useDefineProps({ value: 1 })
        const props = defineProps({
            value: { type: [Number, String] }
        })

        expect(props.value()).toBe(1)
    })

    it('should preserve signals passed as props', () => {
        const speedSignal = signal(1)
        const defineProps = useDefineProps({ speed: speedSignal })
        const props = defineProps({
            speed: { type: Number }
        })

        expect(props.speed).toBe(speedSignal)
    })

    it('should expose object props as signals', () => {
        const params = { color: '#ef4444' }
        const defineProps = useDefineProps({ params })
        const props = defineProps()

        expect(isSignal(props.params)).toBe(true)
        expect(props.params()).toEqual(params)
    })

    it('should expose object default props as signals', () => {
        const defineProps = useDefineProps({})
        const props = defineProps({
            params: {
                default: { color: '#ef4444' }
            }
        })

        expect(isSignal(props.params)).toBe(true)
        expect(props.params()).toEqual({ color: '#ef4444' })
    })

    it('should expose classic function props as directly callable signal-compatible callbacks', () => {
        const defineProps = useDefineProps({
            fn: (left: number, right: number) => left + right
        })
        const props = defineProps()

        expect(isSignal(props.fn)).toBe(true)
        expect(props.fn(2, 3)).toBe(5)
    })

    it('should update the called classic function prop when its signal value changes', () => {
        const defineProps = useDefineProps({
            fn: () => 'initial'
        })
        const props = defineProps()

        expect(props.fn()).toBe('initial')

        props.fn.set(() => 'updated')

        expect(props.fn()).toBe('updated')
    })

    it('should validate classic function props with Function type schema', () => {
        const defineProps = useDefineProps({
            fn: () => 'called'
        })
        const props = defineProps({
            fn: { type: Function }
        })

        expect(isSignal(props.fn)).toBe(true)
        expect(props.fn()).toBe('called')
    })

    it('should expose default factory function results as directly callable callbacks', () => {
        const defineProps = useDefineProps({})
        const props = defineProps({
            fn: {
                default: () => () => 'default'
            }
        })

        expect(isSignal(props.fn)).toBe(true)
        expect(props.fn()).toBe('default')
    })

    it('should pass the raw classic function value to validators', () => {
        const callback = () => 'validated'
        const defineProps = useDefineProps({ callback })
        const props = defineProps({
            callback: {
                validator: (value) => value === callback
            }
        })

        expect(props.callback()).toBe('validated')
    })

    it('should preserve signal function props unchanged', () => {
        const callback = () => 'from signal'
        const callbackSignal = signal(callback)
        const defineProps = useDefineProps({ callback: callbackSignal })
        const props = defineProps()

        expect(props.callback).toBe(callbackSignal)
        expect(props.callback()).toBe(callback)
    })

    it('should preserve computed props unchanged', () => {
        const count = signal(1)
        const doubled = computed(() => count() * 2)
        const defineProps = useDefineProps({ doubled })
        const props = defineProps()

        expect(props.doubled).toBe(doubled)
        expect(props.doubled()).toBe(2)
    })

    it('should preserve trigger props unchanged and compatible with on()', async () => {
        const myTrigger = trigger<{ message: string }>()
        const defineProps = useDefineProps({ myTrigger })
        const props = defineProps()
        let received: string | undefined

        expect(props.myTrigger).toBe(myTrigger)

        const subscription = on(props.myTrigger, (data) => {
            received = data.message
        })

        await props.myTrigger.start({ message: 'ok' })
        subscription.unsubscribe()

        expect(received).toBe('ok')
    })

    describe('signal props with an undefined value', () => {
        it('skips the type check like a plain undefined prop', () => {
            const defineProps = useDefineProps({ alpha: signal(undefined) })

            expect(() => defineProps({ alpha: { type: Number } })).not.toThrow()
            expect(() => defineProps({ alpha: Number })).not.toThrow()
        })

        it('still rejects a signal holding a value of the wrong type', () => {
            const defineProps = useDefineProps({ alpha: signal('opaque') })

            expect(() => defineProps({ alpha: { type: Number } })).toThrow(/type check failed for prop "alpha"/)
        })

        it('reads the default while the signal value is undefined', () => {
            const alpha = signal<number | undefined>(undefined)
            const props = useDefineProps({ alpha })({
                alpha: { type: Number, default: 1 }
            })

            expect(isSignal(props.alpha)).toBe(true)
            expect(props.alpha()).toBe(1)

            alpha.set(0.5)
            expect(props.alpha()).toBe(0.5)

            alpha.set(undefined)
            expect(props.alpha()).toBe(1)
        })

        it('stays reactive for computed values and subscribers', () => {
            const alpha = signal<number | undefined>(undefined)
            const props = useDefineProps({ alpha })({
                alpha: { type: Number, default: 1 }
            })
            const doubled = computed(() => props.alpha() * 2)
            const emitted: number[] = []
            props.alpha.observable.subscribe((value: number) => emitted.push(value))

            expect(doubled()).toBe(2)
            alpha.set(3)
            expect(doubled()).toBe(6)
            alpha.set(undefined)
            expect(doubled()).toBe(2)
            expect(emitted).toEqual([1, 3, 1])
        })

        it('writes through to the parent signal', () => {
            const alpha = signal<number | undefined>(undefined)
            const props = useDefineProps({ alpha })({
                alpha: { type: Number, default: 1 }
            })

            props.alpha.set(0.2)
            expect(alpha()).toBe(0.2)

            props.alpha.update((value: number) => value + 1)
            expect(alpha()).toBe(1.2)
        })

        it('calls a default factory with the raw props', () => {
            const size = signal<number | undefined>(undefined)
            const props = useDefineProps({ size, base: 4 })({
                size: { type: Number, default: (raw: any) => raw.base * 2 }
            })

            expect(props.size()).toBe(8)
        })
    })
})
