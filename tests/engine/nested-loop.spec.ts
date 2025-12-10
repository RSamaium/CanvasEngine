import { describe, expect, test, beforeEach, vi } from 'vitest'
import { loop, Container, h, signal, computed } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

describe('Nested Loop Cleanup', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>'
    })

    test('should destroy inner loop elements when outer loop updates', async () => {
        const data = signal({
            outer: [
                { id: 1, inner: [1, 2] }
            ]
        })

        const outerElements = computed(() => data().outer)

        const Child = (props) => {
            const innerElements = computed(() => props.inner)
            return loop(innerElements, (item) => {
                return h(Container, { name: `inner-${item}`, x: item * 10 })
            })
        }

        const loopValue = loop(outerElements, (item) => {
            return h(Child, item)
        })

        const root = await TestBed.createComponent(Container, {}, loopValue)

        // Initial check
        // Outer loop has 1 item.
        // Child has inner loop with 2 items.
        // Root should have 2 children (from inner loop of the single outer item).
        expect(root.componentInstance.children.length).toBe(2)
        expect(root.componentInstance.children[0].x).toBe(10)
        expect(root.componentInstance.children[1].x).toBe(20)

        // Update outer loop - replace the item
        data.set({
            outer: [
                { id: 2, inner: [3] } // New item, different inner content
            ]
        })

        await vi.waitFor(() => {
            // Should have 1 child (from new inner loop)
            // If bug exists, old children might remain, so length would be > 1
            expect(root.componentInstance.children.length).toBe(1)
            expect(root.componentInstance.children[0].x).toBe(30)
        })
    })
})
