import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Canvas, Circle, ComponentInstance, bootstrapCanvas, Container, Element, h, signal, Rect, mount, computed, Ellipse, loop } from 'canvasengine';
import { TestBed } from '../../packages/core/testing';

const mockRect = vi.fn()
const mockEllipse = vi.fn()

function findPrototypeWithMethod(instance: object, method: string) {
    let proto = Object.getPrototypeOf(instance);
    while (proto && !Object.prototype.hasOwnProperty.call(proto, method)) {
        proto = Object.getPrototypeOf(proto);
    }
    return proto;
}

beforeEach(async () => {
    const rect = await TestBed.createComponent(Rect, { width: 1, height: 1, color: '#fff' })
    const graphicsPrototype = findPrototypeWithMethod(rect.componentInstance, 'rect')
    vi.spyOn(graphicsPrototype, 'rect').mockImplementation(mockRect)
    vi.spyOn(graphicsPrototype, 'ellipse').mockImplementation(mockEllipse)
    mockRect.mockClear()
    mockEllipse.mockClear()
})

afterEach(() => {
    vi.clearAllMocks()
})

describe('Graphics', () => {
    let rect: Element<ComponentInstance>

    describe('Rect', () => {
        it('should create a rect', async () => {
            await TestBed.createComponent(Rect, { width: 100, height: 100, color: '#fff' })
            expect(mockRect).toHaveBeenCalled()
            expect(mockRect).toHaveBeenCalledWith(-0, -0, 100, 100)
        })

        it('should create a rect, change width', async () => {
            const width = signal(100)
            await TestBed.createComponent(Rect, { width, height: 100, color: '#fff' })
            
            // First call should be with initial width
            expect(mockRect).toHaveBeenCalledWith(-0, -0, 100, 100)
            
            width.set(200)
            // Wait for the effect to run
            await new Promise(resolve => setTimeout(resolve, 0))
            
            // Should be called twice now
            expect(mockRect).toHaveBeenCalledTimes(2)
            // Second call should be with updated width
            expect(mockRect).toHaveBeenLastCalledWith(-0, -0, 200, 100)
        })

        it('tracks no signal when all its props are static', async () => {
            const rect = await TestBed.createComponent(Rect, { width: 10, height: 3, color: '#fff', borderRadius: 2 })
            const drawEffect = (rect.componentInstance as any).clearEffect

            expect(drawEffect.dependencies.size).toBe(0)
        })

        it('tracks only the signals its draw function reads', async () => {
            const color = signal('#fff')
            const rect = await TestBed.createComponent(Rect, { width: signal(10), height: 3, color })
            const drawEffect = (rect.componentInstance as any).clearEffect

            // The width signal is handled by onUpdate, not by the draw effect
            expect([...drawEffect.dependencies]).toEqual([color])
        })

        it('redraws when a color signal changes', async () => {
            const color = signal('#fff')
            await TestBed.createComponent(Rect, { width: 100, height: 100, color })
            expect(mockRect).toHaveBeenCalledTimes(1)

            color.set('#000')
            await new Promise(resolve => setTimeout(resolve, 0))

            expect(mockRect).toHaveBeenCalledTimes(2)
        })

        it('redraws when an anchor signal changes', async () => {
            const anchor = signal([0, 0])
            await TestBed.createComponent(Rect, { width: 100, height: 50, color: '#fff', anchor })

            anchor.set([0.5, 0.5])
            await new Promise(resolve => setTimeout(resolve, 0))

            expect(mockRect).toHaveBeenLastCalledWith(-50, -25, 100, 50)
        })

        it('redraws when a tracked loop patches its static width', async () => {
            const items = signal([{ id: 1, width: 40 }])
            await TestBed.createComponent(Container, {}, loop(
                items,
                (item: any) => h(Rect, { width: item.width, height: 10, color: '#fff' }),
                { track: (item: any) => item.id }
            ))
            expect(mockRect).toHaveBeenLastCalledWith(-0, -0, 40, 10)

            items.set([{ id: 1, width: 80 }])
            await new Promise(resolve => setTimeout(resolve, 0))

            expect(mockRect).toHaveBeenLastCalledWith(-0, -0, 80, 10)
        })

        it('draws a percentage width once the layout computed it', async () => {
            const rect = await TestBed.createComponent(Rect, { width: '50%', height: 10, color: '#fff' })
            mockRect.mockClear()

            ;(rect.componentInstance as any).emit('layout', { computedLayout: { width: 300, height: 10 } })

            expect(mockRect).toHaveBeenCalledTimes(1)
            expect(mockRect).toHaveBeenLastCalledWith(-0, -0, 300, 10)
        })

        it('redraws a percentage-sized rect when its color signal changes', async () => {
            const group = signal({ accent: '#fff' })
            const color = computed(() => group().accent)
            const rect = await TestBed.createComponent(Rect, { width: 5, height: '100%', color })
            ;(rect.componentInstance as any).emit('layout', { computedLayout: { width: 5, height: 200 } })
            mockRect.mockClear()

            group.set({ accent: '#000' })
            await new Promise(resolve => setTimeout(resolve, 0))

            expect(mockRect).toHaveBeenCalledTimes(1)
            expect(mockRect).toHaveBeenLastCalledWith(-0, -0, 5, 200)
        })

        it('should not draw when graphics is destroyed before mount completes', async () => {
            const mounted = await TestBed.createComponent(Rect, { width: 1, height: 1, color: '#fff' })
            const GraphicsClass = mounted.componentInstance.constructor as any
            const graphics = new GraphicsClass()
            const draw = vi.fn()

            graphics.destroy()
            await graphics.onMount({
                props: {
                    context: {},
                    draw,
                    width: 10,
                    height: 10,
                },
                propObservables: {},
            } as any)

            expect(draw).not.toHaveBeenCalled()
        })
    })

    describe('Circle', () => {
        it('should create a circle with an object border', async () => {
            const circle = await TestBed.createComponent(Circle, {
                x: 100,
                y: 100,
                radius: 42,
                color: '#f97316',
                border: { width: 4, color: '#ffffff', alpha: 0.75 }
            })

            expect(circle.componentInstance).toBeDefined()
        })
    })

    describe('Ellipse', () => {
        it('uses x and y as top-left coordinates and width and height as total size', async () => {
            await TestBed.createComponent(Ellipse, { width: 100, height: 50, color: '#fff' })

            expect(mockEllipse).toHaveBeenCalledWith(50, 25, 50, 25)
        })
    })
})
