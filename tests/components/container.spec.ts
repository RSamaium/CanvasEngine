import { describe, it, expect } from 'vitest';
import { Container, signal } from 'canvasengine';
import { TestBed } from '../../packages/core/testing';


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
            it(`should set ${prop} property`, async () => {
                const value = signal(testValue)
                const container = await TestBed.createComponent(Container, { [prop]: value })
                expect(container.componentInstance[prop]).toBe(value())
            });

            it(`${prop} property updated`, async () => {
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
})