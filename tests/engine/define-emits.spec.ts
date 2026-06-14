import { describe, expect, it, vi } from 'vitest'
import { signal, useDefineEmits, useDefineProps } from 'canvasengine'

describe('useDefineEmits', () => {
    it('calls parent handlers with a payload', () => {
        const select = vi.fn()
        const defineEmits = useDefineEmits({ select })
        const emits = defineEmits()

        emits.select({ id: 1 })

        expect(select).toHaveBeenCalledWith({ id: 1 })
    })

    it('does nothing when a handler is not provided', () => {
        const defineEmits = useDefineEmits({})
        const emits = defineEmits()

        expect(() => emits.select({ id: 1 })).not.toThrow()
        expect(emits.select({ id: 1 })).toBeUndefined()
    })

    it('uses the latest function from signal handlers', () => {
        const initial = vi.fn(() => 'initial')
        const updated = vi.fn(() => 'updated')
        const select = signal(initial)
        const defineEmits = useDefineEmits({ select })
        const emits = defineEmits()

        expect(emits.select({ id: 1 })).toBe('initial')

        select.set(updated)

        expect(emits.select({ id: 2 })).toBe('updated')
        expect(initial).toHaveBeenCalledWith({ id: 1 })
        expect(updated).toHaveBeenCalledWith({ id: 2 })
    })

    it('throws a clear error when the handler prop is not callable', () => {
        const defineEmits = useDefineEmits({ select: 'not-callable' })
        const emits = defineEmits()

        expect(() => emits.select()).toThrow('Invalid emit handler: "select" must be a function')
    })

    it('passes multiple arguments to parent handlers', () => {
        const select = vi.fn((left: number, right: number) => left + right)
        const defineEmits = useDefineEmits({ select })
        const emits = defineEmits()

        expect(emits.select(2, 3)).toBe(5)
        expect(select).toHaveBeenCalledWith(2, 3)
    })

    it('supports callable handlers created by defineProps', () => {
        const select = vi.fn((id: number) => id)
        const props = useDefineProps({ select })()
        const defineEmits = useDefineEmits(props)
        const emits = defineEmits()

        expect(emits.select(1)).toBe(1)
        expect(select).toHaveBeenCalledWith(1)
    })
})
