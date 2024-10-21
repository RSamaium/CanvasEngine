import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Canvas } from '../src/components/Canvas';
import { ComponentInstance } from '../src/components/DisplayObject';
import { bootstrapCanvas, Container, Element, h } from '../src';

describe('Flex Positioning', () => {

    let rootElement: HTMLElement;
    let canvas: Element<ComponentInstance>
    let container: Element<ComponentInstance>

    it('should position children correctly in flex row', async () => {
        const MyComponent = () => h(Canvas, {}, 
            h(Container, { flexDirection: 'row', width: 300, height: 100 }, 
                h(Container, { width: 50, height: 50 }),
                h(Container, { width: 50, height: 50 })
            )
        )
        
        canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        const parent = canvas.componentInstance.children[0] as Element<ComponentInstance>
        const child1 = parent.children[0] as Element<ComponentInstance>
        const child2 = parent.children[1] as Element<ComponentInstance>
Z
        expect(child1.x).toBe(0)
        expect(child1.y).toBe(0)
        expect(child2.x).toBe(50)
        expect(child2.y).toBe(0)
    })

    it('should position children correctly in flex column', async () => {
        const MyComponent = () => h(Canvas, {}, 
            h(Container, { flexDirection: 'column', width: 100, height: 300 }, 
                h(Container, { width: 50, height: 50 }),
                h(Container, { width: 50, height: 50 })
            )
        )
        
        canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        const parent = canvas.componentInstance.children[0] as Element<ComponentInstance>
        const child1 = parent.children[0] as Element<ComponentInstance>
        const child2 = parent.children[1] as Element<ComponentInstance>

        expect(child1.x).toBe(0)
        expect(child1.y).toBe(0)
        expect(child2.x).toBe(0)
        expect(child2.y).toBe(50)
    })

    it('should respect x and y properties for non-flex elements', async () => {
        const MyComponent = () => h(Canvas, {}, 
            h(Container, { width: 200, height: 200 }, 
                h(Container, { x: 30, y: 40, width: 50, height: 50 })
            )
        )
        
        canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        const child = canvas.componentInstance.children[0].children[0] as Element<ComponentInstance>

        expect(child.x).toBe(30)
        expect(child.y).toBe(40)
    })

    it('should align items correctly with justifyContent', async () => {
        const MyComponent = () => h(Canvas, {}, 
            h(Container, { flexDirection: 'row', justifyContent: 'space-between', width: 300, height: 100 }, 
                h(Container, { width: 50, height: 50 }),
                h(Container, { width: 50, height: 50 })
            )
        )
        
        canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        const parent = canvas.componentInstance.children[0] as Element<ComponentInstance>
        const child1 = parent.children[0] as Element<ComponentInstance>
        const child2 = parent.children[1] as Element<ComponentInstance>

        expect(child1.x).toBe(0)
        expect(child2.x).toBe(250)
    })

    it('should align items correctly with alignItems', async () => {
        const MyComponent = () => h(Canvas, {}, 
            h(Container, { flexDirection: 'row', alignItems: 'flex-end', width: 300, height: 100 }, 
                h(Container, { width: 50, height: 50 }),
                h(Container, { width: 50, height: 75 })
            )
        )
        
        canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        const parent = canvas.componentInstance.children[0] as Element<ComponentInstance>
        const child1 = parent.children[0] as Element<ComponentInstance>
        const child2 = parent.children[1] as Element<ComponentInstance>

        expect(child1.y).toBe(50)
        expect(child2.y).toBe(25)
    })

    it('should wrap items correctly with flexWrap', async () => {
        const MyComponent = () => h(Canvas, {}, 
            h(Container, { flexDirection: 'row', flexWrap: 'wrap', width: 100, height: 200 }, 
                h(Container, { width: 60, height: 50 }),
                h(Container, { width: 60, height: 50 }),
                h(Container, { width: 60, height: 50 })
            )
        )
        
        canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        const parent = canvas.componentInstance.children[0] as Element<ComponentInstance>
        const child1 = parent.children[0] as Element<ComponentInstance>
        const child2 = parent.children[1] as Element<ComponentInstance>
        const child3 = parent.children[2] as Element<ComponentInstance>

        expect(child1.x).toBe(0)
        expect(child1.y).toBe(0)
        expect(child2.x).toBe(0)
        expect(child2.y).toBe(50)
        expect(child3.x).toBe(0)
        expect(child3.y).toBe(100)
    })

    it('should apply gap correctly', async () => {
        const MyComponent = () => h(Canvas, {}, 
            h(Container, { flexDirection: 'row', gap: 10, width: 300, height: 100 }, 
                h(Container, { width: 50, height: 50 }),
                h(Container, { width: 50, height: 50 })
            )
        )
        
        canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        const parent = canvas.componentInstance.children[0] as Element<ComponentInstance>
        const child1 = parent.children[0] as Element<ComponentInstance>
        const child2 = parent.children[1] as Element<ComponentInstance>

        expect(child1.x).toBe(0)
        expect(child2.x).toBe(60)
    })

    it('should apply margin correctly', async () => {
        const MyComponent = () => h(Canvas, {}, 
            h(Container, { flexDirection: 'row', width: 300, height: 100 }, 
                h(Container, { width: 50, height: 50, margin: 10 }),
                h(Container, { width: 50, height: 50 })
            )
        )
        
        canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        const parent = canvas.componentInstance.children[0] as Element<ComponentInstance>
        const child1 = parent.children[0] as Element<ComponentInstance>
        const child2 = parent.children[1] as Element<ComponentInstance>

        expect(child1.x).toBe(10)
        expect(child2.x).toBe(70)
    })

    it('should apply padding correctly', async () => {
        const MyComponent = () => h(Canvas, {}, 
            h(Container, { flexDirection: 'row', width: 300, height: 100, padding: 20 }, 
                h(Container, { width: 50, height: 50 }),
                h(Container, { width: 50, height: 50 })
            )
        )
        
        canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        const parent = canvas.componentInstance.children[0] as Element<ComponentInstance>
        const child1 = parent.children[0] as Element<ComponentInstance>
        const child2 = parent.children[1] as Element<ComponentInstance>

        expect(child1.x).toBe(20)
        expect(child1.y).toBe(20)
        expect(child2.x).toBe(70)
        expect(child2.y).toBe(20)
    })
})