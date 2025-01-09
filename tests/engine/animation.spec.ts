import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { animatedSignal, isAnimatedSignal, animatedSequence, signal, AnimateOptions } from 'canvasengine'

describe('animation', () => {
  describe('animatedSignal', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should create an animated signal with initial value', () => {
      const signal = animatedSignal(10)
      expect(signal()).toBe(10)
    })

    it('should update value with set', async () => {
      const signal = animatedSignal(0, { duration: 100 })
      const promise = signal.set(10)
      
      // Check initial state
      expect(signal()).toBe(0)
      
      // Advance halfway through animation
      await vi.advanceTimersByTimeAsync(50)
      const midValue = signal()
      expect(midValue).toBeGreaterThan(0)
      expect(midValue).toBeLessThan(10)
      
      await promise
      expect(signal()).toBe(10)
    })

    it('should update value with update function', async () => {
      const signal = animatedSignal(5)
      signal.update(v => v * 2)
      await vi.advanceTimersByTimeAsync(100)
      expect(signal()).toBe(10)
    })

    it('should call onUpdate during animation', async () => {
      const onUpdate = vi.fn()
      const signal = animatedSignal(0, { onUpdate })
      await signal.set(10)
      await vi.advanceTimersByTimeAsync(100)
      expect(onUpdate).toHaveBeenCalled()
    })

    it('should track animation state', async () => {
      const signal = animatedSignal(0)
      const promise = signal.set(10)
      await vi.advanceTimersByTimeAsync(100)
      expect(signal.animatedState().start).toBe(0)
      expect(signal.animatedState().end).toBe(10)
      await promise
      expect(signal.animatedState().current).toBe(10)
    })
  })

  describe('isAnimatedSignal', () => {
    it('should return true for animated signals', () => {
      const animSignal = animatedSignal(0)
      expect(isAnimatedSignal(animSignal)).toBe(true)
    })

    it('should return false for non-animated signals', () => {
      const regularSignal = signal(0)
      expect(isAnimatedSignal(regularSignal)).toBe(false)
    })
  })

  describe('animatedSequence', () => {
    it('should execute animations in sequence', async () => {
      const values: number[] = []
      const sequence = [
        async () => { values.push(1) },
        async () => { values.push(2) },
        async () => { values.push(3) }
      ]
      await animatedSequence(sequence)
      expect(values).toEqual([1, 2, 3])
    })

    it('should execute parallel animations', async () => {
      const values = new Set<number>()
      const addWithDelay = (n: number, delay: number) => 
        async () => {
          await new Promise(resolve => setTimeout(resolve, delay))
          values.add(n)
        }

      await animatedSequence([
        [
          addWithDelay(1, 20),
          addWithDelay(2, 10)
        ]
      ])
      
      expect(values.has(1)).toBe(true)
      expect(values.has(2)).toBe(true)
    })

    it('should handle mixed sequential and parallel animations', async () => {
      const values: number[] = []
      await animatedSequence([
        async () => { values.push(1) },
        [
          async () => { values.push(2) },
          async () => { values.push(3) }
        ],
        async () => { values.push(4) }
      ])
      
      expect(values[0]).toBe(1)
      expect(values.includes(2)).toBe(true)
      expect(values.includes(3)).toBe(true)
      expect(values[values.length - 1]).toBe(4)
    })
      
  })
})
