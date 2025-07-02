import { describe, it, expect, test, vi } from 'vitest';
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
            expect((container.componentInstance.children[0] as any).x).toBe(100)
            attach.set(Comp2)
            expect((container.componentInstance.children[0] as any).x).toBe(200)
        })
    })

    describe('onBeforeDestroy hook', () => {
        test('should call onBeforeDestroy when container is destroyed using cond', async () => {
            const onBeforeDestroy = vi.fn()
            const shouldShow = signal(true)

            // Create a conditional container with onBeforeDestroy hook
            const conditionalContainer = cond(
                shouldShow,
                () => h(Container, {
                    x: 100,
                    y: 50,
                    onBeforeDestroy: onBeforeDestroy
                } as any)
            )

            const parentContainer = await TestBed.createComponent(Container, {}, conditionalContainer)

            // Verify container is created and hook is registered
            expect(parentContainer.componentInstance.children.length).toBe(1)
            const childContainer = parentContainer.componentInstance.children[0] as any
            expect(childContainer.onBeforeDestroy).toBe(onBeforeDestroy)

            // Destroy the container by setting condition to false
            shouldShow.set(false)
            await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity

            // Verify onBeforeDestroy was called and container was removed
            expect(onBeforeDestroy).toHaveBeenCalledTimes(1)
            expect(parentContainer.componentInstance.children.length).toBe(0)
        })

        test('should call onBeforeDestroy with kebab-case prop name using cond', async () => {
            const onBeforeDestroy = vi.fn()
            const shouldShow = signal(true)

            // Create a conditional container with kebab-case prop
            const conditionalContainer = cond(
                shouldShow,
                () => h(Container, {
                    x: 100,
                    y: 50,
                    'on-before-destroy': onBeforeDestroy
                } as any)
            )

            const parentContainer = await TestBed.createComponent(Container, {}, conditionalContainer)

            // Verify container is created and hook is registered
            expect(parentContainer.componentInstance.children.length).toBe(1)
            const childContainer = parentContainer.componentInstance.children[0] as any
            expect(childContainer.onBeforeDestroy).toBe(onBeforeDestroy)

            // Destroy the container by setting condition to false
            shouldShow.set(false)
            await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity

            // Verify onBeforeDestroy was called and container was removed
            expect(onBeforeDestroy).toHaveBeenCalledTimes(1)
            expect(parentContainer.componentInstance.children.length).toBe(0)
        })

        test('should handle destruction without onBeforeDestroy hook using cond', async () => {
            const shouldShow = signal(true)

            // Create a conditional container without onBeforeDestroy hook
            const conditionalContainer = cond(
                shouldShow,
                () => h(Container, {
                    x: 100,
                    y: 50
                })
            )

            const parentContainer = await TestBed.createComponent(Container, {}, conditionalContainer)

            // Verify container is created and no hook is registered
            expect(parentContainer.componentInstance.children.length).toBe(1)
            const childContainer = parentContainer.componentInstance.children[0] as any
            expect(childContainer.onBeforeDestroy).toBeNull()

            // Destroy the container by setting condition to false - should not throw
            expect(() => {
                shouldShow.set(false)
            }).not.toThrow()

            await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity
            expect(parentContainer.componentInstance.children.length).toBe(0)
        })

        test('should call onBeforeDestroy when switching between different containers', async () => {
            const onBeforeDestroy1 = vi.fn()
            const onBeforeDestroy2 = vi.fn()
            const containerType = signal('first')

            // Create conditional containers with different onBeforeDestroy hooks
            const conditionalContainer = cond(
                () => containerType() === 'first',
                () => h(Container, {
                    x: 100,
                    y: 50,
                    onBeforeDestroy: onBeforeDestroy1
                } as any),
                [() => containerType() === 'second', () => h(Container, {
                    x: 200,
                    y: 100,
                    onBeforeDestroy: onBeforeDestroy2
                } as any)]
            )

            const parentContainer = await TestBed.createComponent(Container, {}, conditionalContainer)

            // Verify first container is created
            expect(parentContainer.componentInstance.children.length).toBe(1)
            const firstContainer = parentContainer.componentInstance.children[0] as any
            expect(firstContainer.x).toBe(100)
            expect(firstContainer.onBeforeDestroy).toBe(onBeforeDestroy1)

            // Switch to second container
            containerType.set('second')
            await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity

            // Verify first container's onBeforeDestroy was called and second container is created
            expect(onBeforeDestroy1).toHaveBeenCalledTimes(1)
            expect(onBeforeDestroy2).toHaveBeenCalledTimes(0)
            expect(parentContainer.componentInstance.children.length).toBe(1)
            const secondContainer = parentContainer.componentInstance.children[0] as any
            expect(secondContainer.x).toBe(200)
            expect(secondContainer.onBeforeDestroy).toBe(onBeforeDestroy2)

            // Remove all containers by setting to a value that matches no condition
            containerType.set('none')
            await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity

            // Verify second container's onBeforeDestroy was called
            expect(onBeforeDestroy2).toHaveBeenCalledTimes(1)
            expect(parentContainer.componentInstance.children.length).toBe(0)
        })
    })
})