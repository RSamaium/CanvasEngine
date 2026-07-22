import { describe, it, expect } from 'vitest';
import { ComponentInstance, Element, Container, h, Rect, signal } from 'canvasengine';
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

    it('should center a column of children on both axes', async () => {
        const parent = await TestBed.createComponent(Container, {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: 800,
            height: 600,
            gap: 20,
        }, [
            h(Container, { width: 60, height: 60 }),
            h(Container, { width: 120, height: 30 }),
        ])

        const child1 = parent.props.children?.[0] as Element<ComponentInstance>
        const child2 = parent.props.children?.[1] as Element<ComponentInstance>

        expect(child1.componentInstance.layout.realX).toBe(370)
        expect(child1.componentInstance.layout.realY).toBe(245)
        expect(child2.componentInstance.layout.realX).toBe(340)
        expect(child2.componentInstance.layout.realY).toBe(325)
    })

    it('should size and center a nested flex root inside a non-flex container', async () => {
        const outer = await TestBed.createComponent(Container, {
            width: 800,
            height: 600,
        }, [
            h(Container, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: 800,
                height: 600,
            }, [
                h(Container, { width: 60, height: 60 }),
            ]),
        ])

        await new Promise((resolve) => setTimeout(resolve, 0))
        outer.props.context.app().render()

        const flexRoot = outer.props.children?.[0] as Element<ComponentInstance>
        const centeredChild = flexRoot.props.children?.[0] as Element<ComponentInstance>

        expect(flexRoot.componentInstance.layout.computedLayout.width).toBe(800)
        expect(flexRoot.componentInstance.layout.computedLayout.height).toBe(600)
        expect(centeredChild.componentInstance.layout.realX).toBe(370)
        expect(centeredChild.componentInstance.layout.realY).toBe(270)
    })

    it('should recenter children when a nested flex root receives reactive dimensions', async () => {
        const width = signal(0)
        const height = signal(0)
        const outer = await TestBed.createComponent(Container, {}, [
            h(Container, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width,
                height,
            }, [
                h(Container, { width: 60, height: 60 }),
            ]),
        ])

        width.set(800)
        height.set(600)
        await new Promise((resolve) => setTimeout(resolve, 0))
        outer.props.context.app().render()

        const flexRoot = outer.props.children?.[0] as Element<ComponentInstance>
        const centeredChild = flexRoot.props.children?.[0] as Element<ComponentInstance>

        expect(flexRoot.componentInstance.layout.computedLayout.width).toBe(800)
        expect(flexRoot.componentInstance.layout.computedLayout.height).toBe(600)
        expect(centeredChild.componentInstance.layout.realX).toBe(370)
        expect(centeredChild.componentInstance.layout.realY).toBe(270)
    })

    it('should center flex content inside an absolute full-size overlay', async () => {
        const parent = await TestBed.createComponent(Container, {
            display: 'flex',
            width: 400,
            height: 300,
        }, [
            h(Container, {
                positionType: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }, [
                h(Container, { width: 40, height: 20 }),
            ]),
        ])

        await new Promise((resolve) => setTimeout(resolve, 0))
        parent.props.context.app().render()

        const overlay = parent.props.children?.[0] as Element<ComponentInstance>
        const centeredChild = overlay.props.children?.[0] as Element<ComponentInstance>

        expect(overlay.componentInstance.layout.computedLayout.width).toBe(400)
        expect(overlay.componentInstance.layout.computedLayout.height).toBe(300)
        expect(centeredChild.componentInstance.layout.realX).toBe(180)
        expect(centeredChild.componentInstance.layout.realY).toBe(140)
    })

    it('should recompute graphics offsets after absolute percentage bounds are drawn', async () => {
        const parent = await TestBed.createComponent(Container, {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 400,
            height: 300,
        }, [
            h(Container, {
                display: 'flex',
                width: 200,
                height: 100,
            }, [
                h(Rect, {
                    positionType: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    color: '#fff',
                }),
            ]),
        ])

        await new Promise((resolve) => setTimeout(resolve, 0))
        parent.props.context.app().render()
        parent.props.context.app().render()

        const panel = parent.props.children?.[0] as Element<ComponentInstance>
        const background = panel.props.children?.[0] as Element<ComponentInstance>
        const bounds = background.componentInstance.getBounds()

        expect(panel.componentInstance.layout.realX).toBe(100)
        expect(panel.componentInstance.layout.realY).toBe(100)
        expect(bounds.x).toBe(100)
        expect(bounds.y).toBe(100)
        expect(bounds.width).toBe(200)
        expect(bounds.height).toBe(100)
    })
})
