import { describe, it, expect } from 'vitest';
import { ComponentInstance, Element, Container, h  } from 'canvasengine';
import { TestBed } from '../../packages/core/testing';

describe('Flex Positioning', () => {
    it('should position children correctly in flex row', async () => {
        const parent = await TestBed.createComponent(Container, { 
            flexDirection: 'row', 
            width: 300, 
            height: 100 
        }, [
            h(Container, { width: 50, height: 50 }),
            h(Container, { width: 50, height: 50 })
        ])

        const child1 = parent.props.children?.[0] as Element<ComponentInstance>
        const child2 = parent.props.children?.[1] as Element<ComponentInstance>

        expect(child1.componentInstance.layout.realX).toBe(0)
        expect(child1.componentInstance.layout.realY).toBe(0)
        expect(child2.componentInstance.layout.realX).toBe(50)
        expect(child2.componentInstance.layout.realY).toBe(0)
    })

    it('should position children correctly in flex column', async () => {
        const parent = await TestBed.createComponent(Container, { 
            flexDirection: 'column', 
            width: 100, 
            height: 300 
        }, [
            h(Container, { width: 50, height: 50 }),
            h(Container, { width: 50, height: 50 })
        ])

        const child1 = parent.props.children?.[0] as Element<ComponentInstance>
        const child2 = parent.props.children?.[1] as Element<ComponentInstance>

        expect(child1.componentInstance.layout.realX).toBe(0)
        expect(child1.componentInstance.layout.realY).toBe(0)
        expect(child2.componentInstance.layout.realX).toBe(0)
        expect(child2.componentInstance.layout.realY).toBe(50)
    })

    it('should respect x and y properties for non-flex elements', async () => {
        const parent = await TestBed.createComponent(Container, { 
            width: 200, 
            height: 200 
        }, [
            h(Container, { 
                x: 30, 
                y: 40, 
                width: 50, 
                height: 50 
            })
        ])

        const child = parent.props.children?.[0] as Element<ComponentInstance>

        expect(child.componentInstance.layout).toBeNull()
    })

    it('should align items correctly with justifyContent', async () => {
        const parent = await TestBed.createComponent(Container, { 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            width: 300, 
            height: 100 
        }, [
            h(Container, { width: 50, height: 50 }),
            h(Container, { width: 50, height: 50 })
        ])

        const child1 = parent.props.children?.[0] as Element<ComponentInstance>
        const child2 = parent.props.children?.[1] as Element<ComponentInstance>

        expect(child1.componentInstance.layout.realX).toBe(0)
        expect(child2.componentInstance.layout.realX).toBe(250)
    })

    it('should align items correctly with alignItems', async () => {
        const parent = await TestBed.createComponent(Container, { 
            flexDirection: 'row', 
            alignItems: 'flex-end', 
            width: 300, 
            height: 100 
        }, [
            h(Container, { width: 50, height: 50 }),
            h(Container, { width: 50, height: 75 })
        ])

        const child1 = parent.props.children?.[0] as Element<ComponentInstance>
        const child2 = parent.props.children?.[1] as Element<ComponentInstance>

        expect(child1.componentInstance.layout.realY).toBe(50)
        expect(child2.componentInstance.layout.realY).toBe(25)
    })
    
    it('should apply gap correctly', async () => {
        const parent = await TestBed.createComponent(Container, { 
            flexDirection: 'row', 
            gap: 10, 
            width: 300, 
            height: 100 
        }, [
            h(Container, { width: 50, height: 50 }),
            h(Container, { width: 50, height: 50 })
        ])

        const child1 = parent.props.children?.[0] as Element<ComponentInstance>
        const child2 = parent.props.children?.[1] as Element<ComponentInstance>

        expect(child1.componentInstance.layout.realX).toBe(0)
        expect(child2.componentInstance.layout.realX).toBe(60)
    })

    it('should apply margin correctly', async () => {
        const parent = await TestBed.createComponent(Container, { 
            flexDirection: 'row', 
            width: 300, 
            height: 100 
        }, [
            h(Container, { width: 50, height: 50, margin: 10 }),
            h(Container, { width: 50, height: 50 })
        ])

        const child1 = parent.props.children?.[0] as Element<ComponentInstance>
        const child2 = parent.props.children?.[1] as Element<ComponentInstance>

        expect(child1.componentInstance.layout.realX).toBe(10)
        expect(child2.componentInstance.layout.realX).toBe(70)
    })

    it('should apply padding correctly', async () => {
        const parent = await TestBed.createComponent(Container, { 
            flexDirection: 'row', 
            width: 300, 
            height: 100, 
            padding: 20 
        }, [
            h(Container, { width: 50, height: 50 }),
            h(Container, { width: 50, height: 50 })
        ])

        const child1 = parent.props.children?.[0] as Element<ComponentInstance>
        const child2 = parent.props.children?.[1] as Element<ComponentInstance>

        expect(child1.componentInstance.layout.realX).toBe(20)
        expect(child1.componentInstance.layout.realY).toBe(20)
        expect(child2.componentInstance.layout.realX).toBe(70)
        expect(child2.componentInstance.layout.realY).toBe(20)
    })
})