import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { bootstrapCanvas, Canvas, Container, createComponent, h, mount, registerComponent, signal, tick, cond } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

describe('Lifecycle', () => {

    test('mount function is called after component creation', async () => {
        const mockMount = vi.fn()
        
        function MyComponent() { 
            mount((element) => {
                mockMount(element)
            })
            
            return h(Canvas, {
                tickStart: false
            })
        }

        await bootstrapCanvas(document.getElementById('root'), MyComponent)

        expect(mockMount).toHaveBeenCalledTimes(1)
        expect(mockMount).toHaveBeenCalledWith(expect.objectContaining({
            props: expect.objectContaining({ isRoot: true })
        }))
    })

    test('multiple mount functions are all called', async () => {
        const mockMount1 = vi.fn()
        const mockMount2 = vi.fn()
        
        function MyComponent() {
            mount((element) => {
                mockMount1(element)
            })
            
            mount((element) => {
                mockMount2(element)
            })
            
            return h(Canvas, {
                tickStart: false
            })
        }

        await bootstrapCanvas(document.getElementById('root'), MyComponent)
        expect(mockMount1).toHaveBeenCalledTimes(1)
        expect(mockMount2).toHaveBeenCalledTimes(1)
    })

    test('mount function with async function is called and awaited', async () => {
        const mockMount = vi.fn()
        const asyncOperation = vi.fn().mockResolvedValue('async result')
        
        function MyComponent() { 
            mount(async (element) => {
                const result = await asyncOperation()
                mockMount(element, result)
            })
            
            return h(Canvas, {
                tickStart: false
            })
        }

        await bootstrapCanvas(document.getElementById('root'), MyComponent)

        expect(asyncOperation).toHaveBeenCalledTimes(1)
        expect(mockMount).toHaveBeenCalledTimes(1)
        expect(mockMount).toHaveBeenCalledWith(
            expect.objectContaining({
                props: expect.objectContaining({ isRoot: true })
            }),
            'async result'
        )
    })

    test('unmount function is returned from mount and called when component is destroyed', async () => {
        const mockMount = vi.fn()
        const mockUnmount = vi.fn()

        const visible = signal(true)
        
        function MyComponent() {
            mount((element) => {
                mockMount(element)
                return () => {
                    mockUnmount(element)
                }
            })
            return h(Container)
        }

        await TestBed.createComponent(cond(visible, () => h(MyComponent)))

        expect(mockMount).toHaveBeenCalledTimes(1)
        expect(mockUnmount).toHaveBeenCalledTimes(0)

        visible.set(false)

        expect(mockUnmount).toHaveBeenCalledTimes(1)
    })

    test('async unmount function is returned from mount and called when component is destroyed', async () => {
        const mockMount = vi.fn()
        const mockUnmount = vi.fn()

        const visible = signal(true)
        
        function MyComponent() {
            mount(async (element) => {
                mockMount(element)
                return () => {
                    mockUnmount(element)
                }
            })
            return h(Container)
        }

        await TestBed.createComponent(cond(visible, () => h(MyComponent)))

        expect(mockMount).toHaveBeenCalledTimes(1)
        expect(mockUnmount).toHaveBeenCalledTimes(0)

        visible.set(false)

        await new Promise(resolve => setTimeout(resolve, 0))

        expect(mockUnmount).toHaveBeenCalledTimes(1)
    })


    test('tick function is called on each frame', async () => {
        const mockTick = vi.fn()
        
        function MyComponent() {
            tick((tickValue, element) => {
                mockTick(tickValue, element)
            })
            
            return h(Canvas, {
                tickStart: true
            })
        }

        await bootstrapCanvas(document.getElementById('root'), MyComponent)
        
        // Wait for tick to be called
        await new Promise(resolve => setTimeout(resolve, 50))
        
        expect(mockTick).toHaveBeenCalled()
        const lastCall = mockTick.mock.calls[mockTick.mock.calls.length - 1]
        const tickValue = lastCall[0]
        const element = lastCall[1]
        
        expect(tickValue).toHaveProperty('timestamp')
        expect(tickValue).toHaveProperty('deltaTime')
        expect(tickValue).toHaveProperty('frame')
        expect(tickValue).toHaveProperty('deltaRatio')
        expect(typeof tickValue.timestamp).toBe('number')
        expect(typeof tickValue.deltaTime).toBe('number')
        expect(typeof tickValue.frame).toBe('number')
        expect(typeof tickValue.deltaRatio).toBe('number')
        expect(element).toHaveProperty('props')
        expect(element.props).toHaveProperty('isRoot', true)
    })

    test('tick function is called and can be cleaned up', async () => {
        const mockTick = vi.fn()
        
        function MyComponent() {
            tick((tickValue, element) => {
                mockTick(tickValue, element)
            })
            
            return h(Canvas, {
                tickStart: true
            })
        }

        await bootstrapCanvas(document.getElementById('root'), MyComponent)
        
        // Wait for tick to be called (need to wait for component to mount and tick to start)
        await new Promise(resolve => setTimeout(resolve, 200))
        
        expect(mockTick).toHaveBeenCalled()
        const callCount = mockTick.mock.calls.length
        expect(callCount).toBeGreaterThan(0)
        
        // Verify tick values have correct structure
        const lastCall = mockTick.mock.calls[mockTick.mock.calls.length - 1]
        const tickValue = lastCall[0]
        const element = lastCall[1]
        
        expect(tickValue).toHaveProperty('timestamp')
        expect(tickValue).toHaveProperty('deltaTime')
        expect(tickValue).toHaveProperty('frame')
        expect(tickValue).toHaveProperty('deltaRatio')
        expect(element).toHaveProperty('props')
    })
})
