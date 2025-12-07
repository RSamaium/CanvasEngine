import { describe, expect, test, beforeEach, vi } from 'vitest'
import { loop, Container, h, signal, computed } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

/**
 * Test suite for loop with spread props and computed signals
 * 
 * This test suite simulates the situation in test.ce and child.ce:
 * - A parent component with a @for loop iterating over a computed signal
 * - Props passed to child components using spread operator (...obj)
 * - Child component receiving props (x, y) via spread operator
 * - Signal updates after a delay (setTimeout)
 * 
 * Note: We use Container instead of Sprite to avoid image loading issues in tests
 */
describe('Loop with spread props and computed signals', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>'
    })

    test('should create child components with spread props from computed signal', async () => {
        // Simulate the data signal from test.ce
        // In test.ce, data is a signal containing an object with elementsLow array
        const data = signal({
            elementsLow: [
                {
                    x: 0,
                    y: 0,
                }
            ]
        })

        // Simulate the computed signal from test.ce
        // elementsLow is computed from data().elementsLow
        const elementsLow = computed(() => {
            return data().elementsLow || []
        })

        // Create loop with spread props (simulating @for (obj of elementsLow) { <Container ...obj /> })
        // The spread operator passes all properties of obj as props to Container
        const loopValue = loop(elementsLow, (obj) => {
            return h(Container, obj)
        })

        const container = await TestBed.createComponent(Container, {}, loopValue)

        // Verify initial state - children should be created
        expect(container.componentInstance.children.length).toBe(1)
        const childElement = container.componentInstance.children[0]
        expect(childElement.x).toBe(0)
        expect(childElement.y).toBe(0)
    })

    test('should update child components when signal changes after delay', async () => {
        // Simulate the data signal from test.ce
        const data = signal({
            elementsLow: [
                {
                    x: 0,
                    y: 0,
                }
            ]
        })

        // Simulate the computed signal from test.ce
        const elementsLow = computed(() => {
            return data().elementsLow || []
        })

        // Create loop with spread props
        const loopValue = loop(elementsLow, (obj) => {
            return h(Container, obj)
        })

        const container = await TestBed.createComponent(Container, {}, loopValue)

        // Verify initial state
        expect(container.componentInstance.children.length).toBe(1)
        let childElement = container.componentInstance.children[0]
        expect(childElement.x).toBe(0)
        expect(childElement.y).toBe(0)

        // Update the signal (simulating what setTimeout would do)
        data.set({
            elementsLow: [
                {
                    x: 100,
                    y: 100,
                }
            ]
        })

        // Wait for reactivity to propagate
        await vi.waitFor(() => {
            expect(container.componentInstance.children.length).toBe(1)
            expect(container.componentInstance.children[0].x).toBe(100)
            expect(container.componentInstance.children[0].y).toBe(100)
        })
    })

    test('should handle multiple child components with spread props', async () => {
        const data = signal({
            elementsLow: [
                {
                    x: 0,
                    y: 0,
                },
                {
                    x: 50,
                    y: 50,
                }
            ]
        })

        const elementsLow = computed(() => {
            return data().elementsLow || []
        })

        const loopValue = loop(elementsLow, (obj) => {
            return h(Container, obj)
        })

        const container = await TestBed.createComponent(Container, {}, loopValue)

        // Verify initial state with multiple children
        expect(container.componentInstance.children.length).toBe(2)
        expect(container.componentInstance.children[0].x).toBe(0)
        expect(container.componentInstance.children[0].y).toBe(0)
        expect(container.componentInstance.children[1].x).toBe(50)
        expect(container.componentInstance.children[1].y).toBe(50)
    })

    test('should update multiple child components when signal changes', async () => {
        const data = signal({
            elementsLow: [
                {
                    x: 0,
                    y: 0,
                },
                {
                    x: 50,
                    y: 50,
                }
            ]
        })

        const elementsLow = computed(() => {
            return data().elementsLow || []
        })

        const loopValue = loop(elementsLow, (obj) => {
            return h(Container, obj)
        })

        const container = await TestBed.createComponent(Container, {}, loopValue)

        // Verify initial state
        expect(container.componentInstance.children.length).toBe(2)

        // Update signal directly
        data.set({
            elementsLow: [
                {
                    x: 100,
                    y: 100,
                },
                {
                    x: 200,
                    y: 200,
                }
            ]
        })

        // Wait for reactivity to propagate
        await vi.waitFor(() => {
            expect(container.componentInstance.children.length).toBe(2)
            expect(container.componentInstance.children[0].x).toBe(100)
            expect(container.componentInstance.children[0].y).toBe(100)
            expect(container.componentInstance.children[1].x).toBe(200)
            expect(container.componentInstance.children[1].y).toBe(200)
        })
    })

    test('should handle empty array in computed signal', async () => {
        const data = signal({
            elementsLow: []
        })

        const elementsLow = computed(() => {
            return data().elementsLow || []
        })

        const loopValue = loop(elementsLow, (obj) => {
            return h(Container, obj)
        })

        const container = await TestBed.createComponent(Container, {}, loopValue)

        // Verify empty state
        expect(container.componentInstance.children.length).toBe(0)
    })

    test('should handle adding items to array', async () => {
        const data = signal({
            elementsLow: [
                {
                    x: 0,
                    y: 0,
                }
            ]
        })

        const elementsLow = computed(() => {
            return data().elementsLow || []
        })

        const loopValue = loop(elementsLow, (obj) => {
            return h(Container, obj)
        })

        const container = await TestBed.createComponent(Container, {}, loopValue)

        // Verify initial state
        expect(container.componentInstance.children.length).toBe(1)

        // Add new item - need to create a new array to trigger reactivity
        const newElements = [...data().elementsLow, {
            x: 100,
            y: 100,
        }]
        data.set({
            elementsLow: newElements
        })

        // Wait a bit for reactivity to propagate
        await new Promise(resolve => setTimeout(resolve, 10))

        // Verify new item was added
        expect(container.componentInstance.children.length).toBe(2)
        expect(container.componentInstance.children[1].x).toBe(100)
        expect(container.componentInstance.children[1].y).toBe(100)
    })
})

