import { beforeEach, describe, expect, test, vi } from 'vitest'
import { FocusContainer, Button, Container, signal } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'
import { focusManager } from '../../packages/core/src/engine/FocusManager'
import { useFocusIndex, useFocusedElement, useFocusChange } from '../../packages/core/src/hooks/useFocus'

describe('FocusContainer Component', () => {
    beforeEach(() => {
        // Clean up any existing containers
        const containers = (focusManager as any).containers;
        if (containers) {
            containers.clear();
        }
    })

    test('creates FocusContainer with basic properties', async () => {
        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex: 0
        }, [], { enableLayout: false })

        expect(containerElement).toBeDefined()
        expect(typeof containerElement).toBe('object')
        const instance = containerElement.componentInstance as any
        expect(instance.getContainerId).toBeDefined()
    })

    test('registers focusable children with tabindex', async () => {
        const button1 = Button({ tabindex: 0, text: 'Button 1' })
        const button2 = Button({ tabindex: 1, text: 'Button 2' })

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex: 0
        }, [button1, button2], { enableLayout: false })

        expect(containerElement).toBeDefined()

        // Wait a bit for children to be registered
        await new Promise(resolve => setTimeout(resolve, 10))

        const instance = containerElement.componentInstance as any
        const containerId = instance.getContainerId()

        // Check that elements are registered
        const element0 = focusManager.getElement(containerId, 0)
        const element1 = focusManager.getElement(containerId, 1)

        expect(element0).toBeDefined()
        expect(element1).toBeDefined()
    })

    test('updates focus when tabindex signal changes', async () => {
        const tabindex = signal(0)
        const button1 = Button({ tabindex: 0, text: 'Button 1' })
        const button2 = Button({ tabindex: 1, text: 'Button 2' })
        const button3 = Button({ tabindex: 2, text: 'Button 3' })

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex
        }, [button1, button2, button3], { enableLayout: false })

        await new Promise(resolve => setTimeout(resolve, 10))

        const instance = containerElement.componentInstance as any
        const containerId = instance.getContainerId()

        // Move focus via external signal updates
        tabindex.set(0)
        expect(focusManager.getCurrentIndexSignal(containerId)?.()).toBe(0)

        tabindex.set(1)
        expect(focusManager.getCurrentIndexSignal(containerId)?.()).toBe(1)

        tabindex.set(2)
        expect(focusManager.getCurrentIndexSignal(containerId)?.()).toBe(2)

        tabindex.set(1)
        expect(focusManager.getCurrentIndexSignal(containerId)?.()).toBe(1)
    })

    test('supports external wrap-around logic via tabindex signal', async () => {
        const tabindex = signal(0)
        const button1 = Button({ tabindex: 0, text: 'Button 1' })
        const button2 = Button({ tabindex: 1, text: 'Button 2' })

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex
        }, [button1, button2], { enableLayout: false })

        await new Promise(resolve => setTimeout(resolve, 10))

        const instance = containerElement.componentInstance as any
        const containerId = instance.getContainerId()

        // Set to last element
        tabindex.set(1)

        // External wrap to first
        tabindex.set((tabindex() + 1) % 2)
        expect(focusManager.getCurrentIndexSignal(containerId)?.()).toBe(0)

        // External wrap to last
        tabindex.set((tabindex() - 1 + 2) % 2)
        expect(focusManager.getCurrentIndexSignal(containerId)?.()).toBe(1)
    })

    test('calls onFocusChange callback when focus changes', async () => {
        const onFocusChange = vi.fn()
        const button1 = Button({ tabindex: 0, text: 'Button 1' })
        const button2 = Button({ tabindex: 1, text: 'Button 2' })

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex: 0,
            onFocusChange,
        }, [button1, button2], { enableLayout: false })

        await new Promise(resolve => setTimeout(resolve, 10))

        const instance = containerElement.componentInstance as any
        const containerId = instance.getContainerId()

        // Change focus
        focusManager.setIndex(containerId, 0)
        await new Promise(resolve => setTimeout(resolve, 10))

        expect(onFocusChange).toHaveBeenCalled()
        expect(onFocusChange).toHaveBeenCalledWith(0, expect.anything())
    })

    test('useFocusIndex hook returns current index signal', async () => {
        const button1 = Button({ tabindex: 0, text: 'Button 1' })
        const button2 = Button({ tabindex: 1, text: 'Button 2' })

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex: 0
        }, [button1, button2], { enableLayout: false })

        await new Promise(resolve => setTimeout(resolve, 10))

        const instance = containerElement.componentInstance as any
        const containerId = instance.getContainerId()

        const indexSignal = useFocusIndex(containerId)
        expect(indexSignal).toBeDefined()

        focusManager.setIndex(containerId, 1)
        expect(indexSignal?.()).toBe(1)
    })

    test('useFocusedElement hook returns focused element signal', async () => {
        const button1 = Button({ tabindex: 0, text: 'Button 1' })
        const button2 = Button({ tabindex: 1, text: 'Button 2' })

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex: 0
        }, [button1, button2], { enableLayout: false })

        await new Promise(resolve => setTimeout(resolve, 10))

        const instance = containerElement.componentInstance as any
        const containerId = instance.getContainerId()

        const elementSignal = useFocusedElement(containerId)
        expect(elementSignal).toBeDefined()

        focusManager.setIndex(containerId, 1)
        const focusedElement = elementSignal?.()
        expect(focusedElement).toBeDefined()
    })

    test('useFocusChange hook triggers callback on focus change', async () => {
        const button1 = Button({ tabindex: 0, text: 'Button 1' })
        const button2 = Button({ tabindex: 1, text: 'Button 2' })

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex: 0
        }, [button1, button2], { enableLayout: false })

        await new Promise(resolve => setTimeout(resolve, 10))

        const instance = containerElement.componentInstance as any
        const containerId = instance.getContainerId()

        const callback = vi.fn()
        useFocusChange(containerId, callback)

        focusManager.setIndex(containerId, 0)
        await new Promise(resolve => setTimeout(resolve, 10))

        expect(callback).toHaveBeenCalled()
    })
})
