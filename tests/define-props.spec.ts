import { describe, it, expect } from 'vitest'
import { useDefineProps, signal, isSignal } from '../packages/core/src'

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
})