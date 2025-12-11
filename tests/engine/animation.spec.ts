import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { animatedSignal, isAnimatedSignal, animatedSequence, signal, AnimateOptions, effect } from 'canvasengine'

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

    it('should use custom duration from options', async () => {
      const signal = animatedSignal(0, { duration: 200 })
      const promise = signal.set(10)
      
      await vi.advanceTimersByTimeAsync(100)
      const midValue = signal()
      expect(midValue).toBeGreaterThan(0)
      expect(midValue).toBeLessThan(10)
      
      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(signal()).toBe(10)
    })

    it('should override duration in set method', async () => {
      const signal = animatedSignal(0, { duration: 500 })
      const promise = signal.set(10, { duration: 100 })
      
      await vi.advanceTimersByTimeAsync(50)
      const midValue = signal()
      expect(midValue).toBeGreaterThan(0)
      expect(midValue).toBeLessThan(10)
      
      await vi.advanceTimersByTimeAsync(50)
      await promise
      expect(signal()).toBe(10)
    })

    it('should call onComplete callback when animation finishes', async () => {
      const onComplete = vi.fn()
      const signal = animatedSignal(0, { duration: 100 })
      const promise = signal.set(10, { onComplete })
      
      expect(onComplete).not.toHaveBeenCalled()
      await vi.runAllTimersAsync()
      await promise
      // onComplete should be called when animation completes
      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(signal()).toBe(10)
    })

    it('should call onComplete from options when no onComplete in animationConfig', async () => {
      const onComplete = vi.fn()
      const signal = animatedSignal(0, { duration: 100, onComplete })
      const promise = signal.set(10)
      
      expect(onComplete).not.toHaveBeenCalled()
      await vi.runAllTimersAsync()
      await promise
      // onComplete from options should be called when animation completes
      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(signal()).toBe(10)
    })

    it('should prioritize animationConfig.onComplete over options.onComplete', async () => {
      const optionsOnComplete = vi.fn()
      const configOnComplete = vi.fn()
      const signal = animatedSignal(0, { duration: 100, onComplete: optionsOnComplete })
      const promise = signal.set(10, { onComplete: configOnComplete })
      
      expect(optionsOnComplete).not.toHaveBeenCalled()
      expect(configOnComplete).not.toHaveBeenCalled()
      await vi.runAllTimersAsync()
      await promise
      // Only configOnComplete should be called
      expect(configOnComplete).toHaveBeenCalledTimes(1)
      expect(optionsOnComplete).not.toHaveBeenCalled()
      expect(signal()).toBe(10)
    })

    it('should use custom ease function', async () => {
      const linearEase = (t: number) => t
      const signal = animatedSignal(0, { duration: 100, ease: linearEase })
      const promise = signal.set(10)
      
      await vi.advanceTimersByTimeAsync(50)
      const midValue = signal()
      // With linear ease, halfway through duration should be roughly halfway through value
      expect(midValue).toBeGreaterThan(0)
      expect(midValue).toBeLessThan(10)
      
      await vi.advanceTimersByTimeAsync(50)
      await promise
      expect(signal()).toBe(10)
    })

    it('should interrupt previous animation when new one starts', async () => {
      const signal = animatedSignal(0, { duration: 200 })
      signal.set(10)
      
      await vi.advanceTimersByTimeAsync(50)
      const midValue = signal()
      // Animation should have progressed
      expect(midValue).toBeGreaterThanOrEqual(0)
      
      // Start new animation before first completes
      const secondPromise = signal.set(20)
      expect(signal.animatedState().end).toBe(20)
      
      await vi.advanceTimersByTimeAsync(200)
      await secondPromise
      expect(signal()).toBe(20)
    })

    it('should be reactive with effect', async () => {
      const signal = animatedSignal(0, { duration: 100 })
      const values: number[] = []
      
      effect(() => {
        values.push(signal())
      })
      
      expect(values.length).toBeGreaterThan(0)
      expect(values[values.length - 1]).toBe(0)
      
      const promise = signal.set(10)
      await vi.advanceTimersByTimeAsync(50)
      // Effect should have been called during animation
      expect(values.length).toBeGreaterThan(1)
      
      await vi.advanceTimersByTimeAsync(50)
      await promise
      expect(values[values.length - 1]).toBe(10)
    })

    it('should have reactive animatedState', async () => {
      const signal = animatedSignal(0, { duration: 100 })
      const states: Array<{ start: number; end: number; current: number }> = []
      
      effect(() => {
        const state = signal.animatedState()
        states.push({ ...state })
      })
      
      expect(states.length).toBeGreaterThan(0)
      expect(states[0].current).toBe(0)
      
      const promise = signal.set(10)
      await vi.advanceTimersByTimeAsync(100)
      await promise
      
      const lastState = states[states.length - 1]
      expect(lastState.end).toBe(10)
      expect(lastState.current).toBe(10)
    })

    it('should work with different value types', async () => {
      const stringSignal = animatedSignal('start', { duration: 100 })
      const promise = stringSignal.set('end')
      await vi.advanceTimersByTimeAsync(100)
      await promise
      expect(stringSignal()).toBe('end')
    })

    it('should call onUpdate with correct values during animation', async () => {
      const updateValues: number[] = []
      const onUpdate = vi.fn((value: number) => {
        updateValues.push(value)
      })
      const signal = animatedSignal(0, { duration: 100, onUpdate })
      
      const promise = signal.set(10)
      await vi.advanceTimersByTimeAsync(50)
      // onUpdate should have been called during animation
      expect(onUpdate).toHaveBeenCalled()
      expect(updateValues.length).toBeGreaterThan(0)
      expect(updateValues[0]).toBeGreaterThanOrEqual(0)
      
      await vi.advanceTimersByTimeAsync(50)
      await promise
      expect(updateValues[updateValues.length - 1]).toBeCloseTo(10, 1)
    })

    it('should handle multiple sequential set calls', async () => {
      const signal = animatedSignal(0, { duration: 50 })
      
      const promise1 = signal.set(10)
      await vi.advanceTimersByTimeAsync(50)
      await promise1
      expect(signal()).toBe(10)
      
      const promise2 = signal.set(20)
      await vi.advanceTimersByTimeAsync(50)
      await promise2
      expect(signal()).toBe(20)
      
      const promise3 = signal.set(30)
      await vi.advanceTimersByTimeAsync(50)
      await promise3
      expect(signal()).toBe(30)
    })

    it('should handle update with custom options', async () => {
      const signal = animatedSignal(5, { duration: 100 })
      signal.update(v => v * 2)
      // Update uses default duration (20ms) from animation implementation
      await vi.runAllTimersAsync()
      expect(signal()).toBe(10)
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
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

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

    it('should execute animatedSignal animations in sequence', async () => {
      const signal1 = animatedSignal(0, { duration: 50 })
      const signal2 = animatedSignal(0, { duration: 50 })
      
      const promise = animatedSequence([
        () => signal1.set(10),
        () => signal2.set(20)
      ])
      
      // Run all timers to allow both animations to complete
      await vi.runAllTimersAsync()
      await promise
      expect(signal1()).toBe(10)
      expect(signal2()).toBe(20)
    })

    it('should execute animatedSignal animations in parallel', async () => {
      const signal1 = animatedSignal(0, { duration: 100 })
      const signal2 = animatedSignal(0, { duration: 100 })
      
      const promise = animatedSequence([
        [
          () => signal1.set(10),
          () => signal2.set(20)
        ]
      ])
      
      // Run all timers to allow both animations to complete
      await vi.runAllTimersAsync()
      await promise
      expect(signal1()).toBe(10)
      expect(signal2()).toBe(20)
    })

    it('should handle empty sequence', async () => {
      await expect(animatedSequence([])).resolves.toBeUndefined()
    })

    it('should return a promise that resolves when sequence completes', async () => {
      const signal1 = animatedSignal(0, { duration: 50 })
      const signal2 = animatedSignal(0, { duration: 50 })
      
      let sequenceCompleted = false
      const sequencePromise = animatedSequence([
        () => signal1.set(10),
        () => signal2.set(20)
      ]).then(() => {
        sequenceCompleted = true
      })
      
      expect(sequenceCompleted).toBe(false)
      // Run all timers to allow both sequential animations to complete
      await vi.runAllTimersAsync()
      await sequencePromise
      expect(sequenceCompleted).toBe(true)
    })

    it('should handle complex mixed sequence with animatedSignals', async () => {
      const rect1X = animatedSignal(10, { duration: 50 })
      const rect2Y = animatedSignal(10, { duration: 50 })
      const rect3Scale = animatedSignal(1, { duration: 50 })
      
      const promise = animatedSequence([
        () => rect1X.set(100),
        [
          () => rect2Y.set(50),
          () => rect3Scale.set(1.5)
        ],
        () => rect1X.set(10),
        [
          () => rect1X.set(30),
          () => rect2Y.set(20),
          () => rect3Scale.set(0.8)
        ]
      ])
      
      // Run all timers to allow the entire sequence to complete
      await vi.runAllTimersAsync()
      await promise
      expect(rect1X()).toBe(30)
      expect(rect2Y()).toBe(20)
      expect(rect3Scale()).toBeCloseTo(0.8, 1)
    })
      
  })
})
