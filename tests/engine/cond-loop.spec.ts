import { describe, expect, test, beforeEach, vi } from 'vitest'
import { loop, Container, h, signal, computed, cond } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

describe('Cond cleanup in Loop', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>'
    })

    test('should destroy conditional element when loop updates', async () => {
        const data = signal({
            elements: [
                { id: 1, x: 0, y: 0 }
            ]
        })

        const elements = computed(() => data().elements)

        // Child component simulating the user's structure:
        // <Sprite />
        // @if (true) { <Rect /> }
        const Child = (props) => {
            return [
                h(Container, { ...props, name: 'sprite' }),
                cond(true, () => h(Container, { ...props, name: 'rect' }))
            ]
        }

        const loopValue = loop(elements, (item) => {
            return h(Child, item)
        })

        const container = await TestBed.createComponent(Container, {}, loopValue)

        // Verify initial state
        // Container children should contain the elements from the loop.
        // Since Child returns an array [Sprite, Rect], and loop flattens?
        // Let's check how loop handles component returning array.
        // If Child is a component, `h(Child)` creates an Element with componentInstance.
        // But Child here is a functional component returning an array.
        // In CanvasEngine, functional components are just functions returning Elements.
        // So `h(Child)` might not be the right way if Child is just a function.
        // The user uses `<Child ...obj />` which implies Child is a component.
        // If Child is a .ce file, it's a class component or similar.

        // Let's simulate Child as a class component that renders the array in its render/template.
        // But for simplicity, let's assume `createElementFn` in `loop` returns the result of `Child(item)`.

        // If I use `h(Child, item)`, `Child` must be a class with `render` or similar, OR `h` handles functional components.
        // Looking at `reactive.ts`, `h` is likely `createComponent` or similar.
        // `createComponent` expects a tag (string) and looks up in `components`.
        // But `h` in tests usually maps to `createElement` or helper.
        // In `loop-spread-props.spec.ts`, it uses `h(Container, obj)`. `Container` is a class.

        // Let's try to define Child as a class component.
        class ChildComponent {
            props: any
            children: any[] = []

            onInit(props) {
                this.props = props
            }

            // In the real engine, the template compiler generates code that calls `createElement` or returns structure.
            // If `Child.ce` has `<Sprite>... <Rect>...`, it effectively puts them in the parent container?
            // Or does Child create a container itself?
            // Usually `<Child>` creates a component instance.
            // If the template has multiple root nodes, it might be a fragment.

            // Let's look at `reactive.ts` `createElement` again.
            // It handles `Observable` which emits `elements`.

            // If I want to simulate the user's issue exactly, I should probably use `loop` directly returning the structure.
            // loop(elements, (item) => [ h(Sprite, item), cond(true, () => h(Rect, item)) ])
        }

        // Let's try to simulate what the compiler does for `Child.ce`.
        // It probably compiles to a function that sets up the view.
        // But here we are testing `loop` + `cond`.

        // Let's try to reproduce with `loop` returning an array containing `cond`.
        const loopValue2 = loop(elements, (item) => {
            return [
                h(Container, { name: 'sprite', ...item }),
                cond(true, () => h(Container, { name: 'rect', ...item }))
            ] as any
        })

        const root = await TestBed.createComponent(Container, {}, loopValue2)

        // Check children of root.
        // loop returns a FlowObservable.
        // TestBed.createComponent mounts the loopValue.
        // If loop returns array of elements, they should be appended to root.

        // Initial check
        // We expect 1 item in loop.
        // That item returns [Sprite, Rect].
        // So root should have 2 children.
        expect(root.componentInstance.children.length).toBe(2)
        expect(root.componentInstance.children[1].x).toBe(0)

        // Update data
        data.set({
            elements: [
                { id: 1, x: 100, y: 100 } // Same ID, but new object reference, loop might treat as update or replace
            ]
        })

        // In `reactive.ts`, `loop` handles updates.
        // If it's a replace (new object), it might destroy old and create new.

        await vi.waitFor(() => {
            // Should still have 2 children (new ones)
            // The issue is that the old Rect might remain, so we might have 3 children or more?
            // Or the new Rect is there but the old one wasn't destroyed?

            // If the bug exists, we might see extra children.
            expect(root.componentInstance.children.length).toBe(2)
            expect(root.componentInstance.children[1].x).toBe(100)
        })
    })

    test('should destroy else loop elements when condition switches branch', async () => {
        const show = signal(false)
        const items = signal([1, 2, 3])

        const value = cond(
            show,
            () => h(Container, { name: 'if-branch', x: 100 }),
            () => loop(items, (item) => h(Container, { name: `else-${item}`, x: item })) as any
        )

        const root = await TestBed.createComponent(Container, {}, value)

        expect(root.componentInstance.children.length).toBe(3)
        expect(root.componentInstance.children.map((child) => child.x)).toEqual([1, 2, 3])

        show.set(true)

        await vi.waitFor(() => {
            expect(root.componentInstance.children.length).toBe(1)
            expect(root.componentInstance.children[0].x).toBe(100)
        })

        items.set([4, 5])

        await vi.waitFor(() => {
            expect(root.componentInstance.children.length).toBe(1)
            expect(root.componentInstance.children[0].x).toBe(100)
        })

        show.set(false)

        await vi.waitFor(() => {
            expect(root.componentInstance.children.length).toBe(2)
            expect(root.componentInstance.children.map((child) => child.x)).toEqual([4, 5])
        })

        items.set([6])

        await vi.waitFor(() => {
            expect(root.componentInstance.children.length).toBe(1)
            expect(root.componentInstance.children[0].x).toBe(6)
        })
    })
})
