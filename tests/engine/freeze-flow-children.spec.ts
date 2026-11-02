import { beforeEach, describe, expect, test, vi } from 'vitest'
import { animatedSignal, Container, cond, h, loop, mount, signal } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

// Issue #81: updates skipped while frozen must be re-applied on unfreeze for
// children rendered by a flow (`@for` / `@if`), not only for static children.
describe('Freeze: replaying updates of flow children', () => {
    let probes: Map<string, any>

    const Probe = (props) => {
        mount((element) => {
            probes.set(props.name, element.componentInstance)
        })
        return h(Container, { x: props.x, y: props.y })
    }

    // Position smoothed by animated signals, like a game character sprite
    const AnimatedProbe = (props) => {
        const smoothX = animatedSignal(props.x(), { duration: 0 })
        const smoothY = animatedSignal(props.y(), { duration: 0 })
        props.x.observable.subscribe((value) => smoothX.set(value, { duration: 0 }))
        props.y.observable.subscribe((value) => smoothY.set(value, { duration: 0 }))
        mount((element) => {
            probes.set(props.name, element.componentInstance)
        })
        return h(Container, { x: smoothX, y: smoothY })
    }

    // The loop lives inside an intermediate component
    const Layer = (props) => h(Container, {}, loop(props.items, (item) => h(AnimatedProbe, item)))

    const createItem = (name: string, x = 0, y = 0) => ({ name, x: signal(x), y: signal(y) })

    const position = (name: string) => {
        const instance = probes.get(name)
        return instance ? { x: instance.x, y: instance.y } : undefined
    }

    const waitForProbes = (...names: string[]) =>
        vi.waitFor(() => {
            for (const name of names) expect(probes.has(name)).toBe(true)
        })

    beforeEach(() => {
        probes = new Map()
        document.body.innerHTML = '<div id="root"></div>'
    })

    test('replays updates of a loop child created during the freeze', async () => {
        const frozen = signal(false)
        const items = signal<any[]>([])
        await TestBed.createComponent(Container, { freeze: frozen },
            loop(items, (item) => h(Probe, item)))

        frozen.set(true)
        // Created at (0, 0), then its position arrives, still during the freeze
        const item = createItem('for')
        items.set([item])
        await waitForProbes('for')
        item.x.set(300)
        item.y.set(200)
        expect(position('for')).toEqual({ x: 0, y: 0 })

        frozen.set(false)
        expect(position('for')).toEqual({ x: 300, y: 200 })
    })

    test('replays updates of a loop child created before the freeze', async () => {
        const frozen = signal(false)
        const item = createItem('for', 10, 10)
        await TestBed.createComponent(Container, { freeze: frozen },
            loop(signal([item]), (item) => h(Probe, item)))
        await waitForProbes('for')
        expect(position('for')).toEqual({ x: 10, y: 10 })

        frozen.set(true)
        item.x.set(300)
        item.y.set(200)
        expect(position('for')).toEqual({ x: 10, y: 10 })

        frozen.set(false)
        expect(position('for')).toEqual({ x: 300, y: 200 })
    })

    test('replays updates of animated loop children inside an intermediate component', async () => {
        const frozen = signal(false)
        const layerItems = signal<any[]>([])
        const existing = createItem('existing', 10, 10)
        await TestBed.createComponent(Container, { freeze: frozen },
            h(Layer, { items: layerItems }))
        layerItems.set([existing])
        await waitForProbes('existing')

        frozen.set(true)
        const created = createItem('created')
        layerItems.set([existing, created])
        await waitForProbes('created')
        for (const item of [existing, created]) {
            item.x.set(300)
            item.y.set(200)
        }
        // Let the animated signals reach their target, still during the freeze
        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(position('existing')).toEqual({ x: 10, y: 10 })
        expect(position('created')).toEqual({ x: 0, y: 0 })

        frozen.set(false)
        expect(position('existing')).toEqual({ x: 300, y: 200 })
        expect(position('created')).toEqual({ x: 300, y: 200 })
    })

    test('replays updates of a cond child', async () => {
        const frozen = signal(false)
        const visible = signal(false)
        const item = createItem('if')
        await TestBed.createComponent(Container, { freeze: frozen },
            cond(visible, () => h(Probe, item)))

        frozen.set(true)
        visible.set(true)
        await waitForProbes('if')
        item.x.set(300)
        item.y.set(200)

        frozen.set(false)
        expect(position('if')).toEqual({ x: 300, y: 200 })
    })

    test('still replays updates of a static child', async () => {
        const frozen = signal(false)
        const item = createItem('static', 10, 20)
        await TestBed.createComponent(Container, { freeze: frozen }, h(Probe, item))
        await waitForProbes('static')

        frozen.set(true)
        item.x.set(50)
        item.y.set(60)
        expect(position('static')).toEqual({ x: 10, y: 20 })

        frozen.set(false)
        expect(position('static')).toEqual({ x: 50, y: 60 })
    })

    test('does not replay updates on a removed loop child', async () => {
        const frozen = signal(false)
        const item = createItem('removed', 10, 10)
        const items = signal<any[]>([item])
        await TestBed.createComponent(Container, { freeze: frozen },
            loop(items, (item) => h(Probe, item)))
        await waitForProbes('removed')
        const instance = probes.get('removed')
        const onUpdate = vi.spyOn(instance, 'onUpdate')

        frozen.set(true)
        item.x.set(300)
        items.set([])

        frozen.set(false)
        expect(onUpdate).not.toHaveBeenCalled()
    })
})
