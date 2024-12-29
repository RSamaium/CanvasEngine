import { describe, expect, test, vi } from 'vitest'
import { on, trigger } from 'canvasengine'

describe('Trigger', () => {
    test('trigger is called', async () => {
        const mockTrigger = vi.fn()

        const myTrigger = trigger()

        on(myTrigger, mockTrigger)

        myTrigger.start()

        expect(mockTrigger).toHaveBeenCalledTimes(1)
    })

    test('trigger passes data to handler', () => {
        const mockTrigger = vi.fn()
        const myTrigger = trigger()
        const testData = { message: 'Hello World' }
        
        on(myTrigger, mockTrigger)
        myTrigger.start(testData)
        
        expect(mockTrigger).toHaveBeenCalledWith(testData)
    })

    test('trigger merges global data with start data', () => {
        const mockTrigger = vi.fn()
        const globalData = { myData: 'myData' }
        const startData = { otherData: 'otherData' }
        const myTrigger = trigger(globalData)
        
        on(myTrigger, mockTrigger)
        myTrigger.start(startData)
        
        expect(mockTrigger).toHaveBeenCalledWith({
            ...globalData,
            ...startData
        })
    })

    test('async trigger can be awaited', async () => {
        const mockTrigger = vi.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
            return 'done'
        })
        const myTrigger = trigger()
        
        on(myTrigger, mockTrigger)
        const result = await myTrigger.start()
        
        expect(mockTrigger).toHaveBeenCalled()
        expect(result).toBe('done')
    })
})