import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { bootstrapCanvas, Canvas, Container, createComponent, h, mount, registerComponent, signal } from 'canvasengine'

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
})
