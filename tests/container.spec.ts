import { describe, it, expect } from 'vitest';
import { Canvas } from '../packages/core/src/components/Canvas';
import { ComponentInstance } from '../packages/core/src/components/DisplayObject';
import { bootstrapCanvas, Container, Element, h, signal } from '../packages/core/src';

describe('Container', () => {
    let rootElement: HTMLElement;
    let canvas: Element<ComponentInstance>
    let container: Element<ComponentInstance>
    let tick: any

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
            it(`should set ${prop} property`, async () => {
                const value = signal(testValue)

                function MyComponent() {
                    return h(Canvas, {}, h(Container, { [prop]: value }))
                }
                canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
                container = canvas.componentInstance.children?.[0] as Element<ComponentInstance>
                tick = canvas.directives.tick

                expect(container[prop]).toBe(value())
            });

            it(`${prop} property updated`, async () => {
                const value = signal(testValue)

                function MyComponent() {
                    return h(Canvas, {}, h(Container, { [prop]: value }))
                }
                canvas = await bootstrapCanvas(document.getElementById('root'), MyComponent)
                container = canvas.componentInstance.children?.[0] as Element<ComponentInstance>
                tick = canvas.directives.tick

                if (typeof testValue === 'number') {
                    value.set(testValue + 1)
                } else if (typeof testValue === 'boolean') {
                    value.set(!testValue)
                }

                expect(container[prop]).toBe(value())
            });
        });
    }

 
})