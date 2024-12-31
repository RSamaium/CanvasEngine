import { describe, it, expect, test } from 'vitest';
import { cond, Container, h, signal } from 'canvasengine';
import { TestBed } from '../../packages/core/testing';
import { CanvasContainer } from '../../packages/core/src/components/Container';


describe('Container', () => {
    const props = {
        x: 10,
        y: 15,
        rotation: 180,
        alpha: 0.1,
        visible: true,
        zIndex: 1,
        roundPixels: true,
        angle: 180,
    }

    for (const [prop, testValue] of Object.entries(props)) {
        describe(`${prop} property`, () => {
            test(`should set ${prop} property`, async () => {
                const value = signal(testValue)
                const container = await TestBed.createComponent(Container, { [prop]: value })
                expect(container.componentInstance[prop]).toBe(value())
            });

            test(`${prop} property updated`, async () => {
                const value = signal(testValue)
                const container = await TestBed.createComponent(Container, { [prop]: value })

                if (typeof testValue === 'number') {
                    value.set(testValue + 1)
                } else if (typeof testValue === 'boolean') {
                    value.set(!testValue)
                }

                expect(container.componentInstance[prop]).toBe(value())
            });
        });
    }

    describe('attach', () => {

        const testChild = async (Comp: any) => {
            const container = await TestBed.createComponent(Container, { attach: Comp })
            const children = container.componentInstance.children
            expect(children.length).toBe(1)
            expect(children[0]).instanceOf(CanvasContainer)
        }

        test('should attach child', async () => {
            await testChild(h(Container))
        })

        test('should attach child width signal', async () => {
            await testChild(signal(h(Container)))
        })
        
        test('Change child', async () => {
            const attach = signal(h(Container, { x: 100 }))
            const Comp2 = h(Container, { x: 200 })
            const container = await TestBed.createComponent(Container, { attach })
            expect(container.componentInstance.children[0].x).toBe(100)
            attach.set(Comp2)
            expect(container.componentInstance.children[0].x).toBe(200)
        })
    })
})