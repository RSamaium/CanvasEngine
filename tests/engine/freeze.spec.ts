import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createComponent, registerComponent, signal, isElementFrozen } from 'canvasengine'
import { Container } from '../../packages/core/src/components/Container'
import { Sprite } from '../../packages/core/src/components/Sprite'
import { TestBed } from '../../packages/core/testing'

describe('Freeze System', () => {
    class TestComponent {
        updateCount = 0
        onInit(props) {}
        onUpdate(props) {
            this.updateCount++
        }
        onMount(element, index) {}
    }

    beforeEach(() => {
        registerComponent('TestComponent', TestComponent)
        registerComponent('Container', Container)
        registerComponent('Sprite', Sprite)
    })

    describe('isElementFrozen', () => {
        test('returns false when freeze prop is not set', () => {
            const element = createComponent('TestComponent', {})
            expect(isElementFrozen(element)).toBe(false)
        })

        test('returns true when freeze prop is true (boolean)', () => {
            const element = createComponent('TestComponent', { freeze: true })
            expect(isElementFrozen(element)).toBe(true)
        })

        test('returns false when freeze prop is false (boolean)', () => {
            const element = createComponent('TestComponent', { freeze: false })
            expect(isElementFrozen(element)).toBe(false)
        })

        test('returns true when freeze signal is true', () => {
            const freezeSignal = signal(true)
            const element = createComponent('TestComponent', { freeze: freezeSignal })
            expect(isElementFrozen(element)).toBe(true)
        })

        test('returns false when freeze signal is false', () => {
            const freezeSignal = signal(false)
            const element = createComponent('TestComponent', { freeze: freezeSignal })
            expect(isElementFrozen(element)).toBe(false)
        })

        test('reacts to freeze signal changes', () => {
            const freezeSignal = signal(false)
            const element = createComponent('TestComponent', { freeze: freezeSignal })
            
            expect(isElementFrozen(element)).toBe(false)
            
            freezeSignal.set(true)
            expect(isElementFrozen(element)).toBe(true)
            
            freezeSignal.set(false)
            expect(isElementFrozen(element)).toBe(false)
        })
    })

    describe('Blocking reactive updates', () => {
        test('blocks onUpdate when element is frozen (boolean)', () => {
            class TestComponentWithUpdate {
                updateCount = 0
                onInit(props) {}
                onUpdate(props) {
                    this.updateCount++
                }
            }
            registerComponent('TestComponentWithUpdate', TestComponentWithUpdate)
            
            const xSignal = signal(0)
            const element = createComponent('TestComponentWithUpdate', {
                freeze: true,
                x: xSignal
            })
            
            const instance = element.componentInstance
            expect(instance.updateCount).toBe(0)
            
            xSignal.set(10)
            expect(instance.updateCount).toBe(0) // Should not update when frozen
        })

        test('allows onUpdate when element is not frozen', () => {
            class TestComponentWithUpdate {
                updateCount = 0
                onInit(props) {}
                onUpdate(props) {
                    this.updateCount++
                }
            }
            registerComponent('TestComponentWithUpdate2', TestComponentWithUpdate)
            
            const xSignal = signal(0)
            const element = createComponent('TestComponentWithUpdate2', {
                freeze: false,
                x: xSignal
            })
            
            const instance = element.componentInstance
            expect(instance.updateCount).toBe(0)
            
            xSignal.set(10)
            expect(instance.updateCount).toBeGreaterThan(0) // Should update when not frozen
        })

        test('blocks onUpdate when freeze signal is true', () => {
            class TestComponentWithUpdate {
                updateCount = 0
                onInit(props) {}
                onUpdate(props) {
                    this.updateCount++
                }
            }
            registerComponent('TestComponentWithUpdate3', TestComponentWithUpdate)
            
            const freezeSignal = signal(false)
            const xSignal = signal(0)
            const element = createComponent('TestComponentWithUpdate3', {
                freeze: freezeSignal,
                x: xSignal
            })
            
            const instance = element.componentInstance
            
            // Initially not frozen, should update
            xSignal.set(10)
            const initialCount = instance.updateCount
            
            // Freeze the element
            freezeSignal.set(true)
            
            // Try to update - should be blocked
            xSignal.set(20)
            expect(instance.updateCount).toBe(initialCount) // Should not increase
        })

        test('allows onUpdate when freeze signal changes to false', () => {
            class TestComponentWithUpdate {
                updateCount = 0
                onInit(props) {}
                onUpdate(props) {
                    this.updateCount++
                }
            }
            registerComponent('TestComponentWithUpdate4', TestComponentWithUpdate)
            
            const freezeSignal = signal(true)
            const xSignal = signal(0)
            const element = createComponent('TestComponentWithUpdate4', {
                freeze: freezeSignal,
                x: xSignal
            })
            
            const instance = element.componentInstance
            
            // Initially frozen, should not update
            xSignal.set(10)
            const initialCount = instance.updateCount
            
            // Unfreeze the element
            freezeSignal.set(false)
            
            // Try to update - should work now
            xSignal.set(20)
            expect(instance.updateCount).toBeGreaterThan(initialCount)
        })
    })

    describe('Blocking controls', () => {
        test('stops controls when element is frozen', async () => {
            const freezeSignal = signal(false)
            const controlsConfig = {
                up: {
                    bind: 'ArrowUp',
                    keyDown: vi.fn()
                }
            }
            
            const element = await TestBed.createComponent(Sprite, {
                freeze: freezeSignal,
                controls: controlsConfig
            })
            
            // Wait for controls to initialize
            await new Promise(resolve => setTimeout(resolve, 50))
            
            const controlsDirective = element.directives.controls
            expect(controlsDirective).toBeDefined()
            
            // Initially not frozen, controls should be active
            expect(controlsDirective.keyboard?.stop).toBe(false)
            
            // Freeze the element
            freezeSignal.set(true)
            await new Promise(resolve => setTimeout(resolve, 50))
            
            // Controls should be stopped
            expect(controlsDirective.keyboard?.stop).toBe(true)
            
            // Unfreeze
            freezeSignal.set(false)
            await new Promise(resolve => setTimeout(resolve, 50))
            
            // Controls should be active again
            expect(controlsDirective.keyboard?.stop).toBe(false)
        })

        test('stops controls on init when freeze is true', async () => {
            const controlsConfig = {
                up: {
                    bind: 'ArrowUp',
                    keyDown: vi.fn()
                }
            }
            
            const element = await TestBed.createComponent(Sprite, {
                freeze: true,
                controls: controlsConfig
            })
            
            // Wait for controls to initialize
            await new Promise(resolve => setTimeout(resolve, 50))
            
            const controlsDirective = element.directives.controls
            expect(controlsDirective).toBeDefined()
            
            // Controls should be stopped from the start
            expect(controlsDirective.keyboard?.stop).toBe(true)
        })
    })

    describe('Blocking events', () => {
        test('blocks click event when element is frozen', async () => {
            const clickHandler = vi.fn()
            const freezeSignal = signal(false)
            
            const element = await TestBed.createComponent(Container, {
                freeze: freezeSignal,
                click: clickHandler
            })
            
            const instance = element.componentInstance
            
            // Mount the element so events can be registered
            await instance.onMount(element)
            
            // Initially not frozen, event should work
            instance.emit('pointertap', {})
            expect(clickHandler).toHaveBeenCalledTimes(1)
            
            // Freeze the element
            freezeSignal.set(true)
            
            // Event should be blocked
            instance.emit('pointertap', {})
            expect(clickHandler).toHaveBeenCalledTimes(1) // Should not increase
            
            // Unfreeze
            freezeSignal.set(false)
            
            // Event should work again
            instance.emit('pointertap', {})
            expect(clickHandler).toHaveBeenCalledTimes(2)
        })

        test('blocks events on init when freeze is true', async () => {
            const clickHandler = vi.fn()
            
            const element = await TestBed.createComponent(Container, {
                freeze: true,
                click: clickHandler
            })
            
            const instance = element.componentInstance
            
            // Mount the element so events can be registered
            await instance.onMount(element)
            
            // Event should be blocked from the start
            instance.emit('pointertap', {})
            expect(clickHandler).not.toHaveBeenCalled()
        })

        test('blocks multiple event types when frozen', async () => {
            const clickHandler = vi.fn()
            const mouseDownHandler = vi.fn()
            const freezeSignal = signal(true)
            
            const element = await TestBed.createComponent(Container, {
                freeze: freezeSignal,
                click: clickHandler,
                mousedown: mouseDownHandler
            })
            
            const instance = element.componentInstance
            
            // Mount the element so events can be registered
            await instance.onMount(element)
            
            // Both events should be blocked
            instance.emit('pointertap', {})
            instance.emit('mousedown', {})
            
            expect(clickHandler).not.toHaveBeenCalled()
            expect(mouseDownHandler).not.toHaveBeenCalled()
            
            // Unfreeze
            freezeSignal.set(false)
            
            // Events should work now
            instance.emit('pointertap', {})
            instance.emit('mousedown', {})
            
            expect(clickHandler).toHaveBeenCalledTimes(1)
            expect(mouseDownHandler).toHaveBeenCalledTimes(1)
        })
    })

    describe('Freeze state management', () => {
        test('initializes isFrozen property correctly', () => {
            const element1 = createComponent('TestComponent', { freeze: true })
            expect(element1.isFrozen).toBe(true)
            
            const element2 = createComponent('TestComponent', { freeze: false })
            expect(element2.isFrozen).toBe(false)
            
            const element3 = createComponent('TestComponent', {})
            expect(element3.isFrozen).toBe(false)
        })

        test('updates isFrozen when freeze signal changes', () => {
            const freezeSignal = signal(false)
            const element = createComponent('TestComponent', { freeze: freezeSignal })
            
            expect(element.isFrozen).toBe(false)
            
            freezeSignal.set(true)
            expect(element.isFrozen).toBe(true)
            
            freezeSignal.set(false)
            expect(element.isFrozen).toBe(false)
        })

        test('cleans up freeze subscription on destroy', () => {
            const freezeSignal = signal(false)
            const element = createComponent('TestComponent', { freeze: freezeSignal })
            
            const initialSubscriptionCount = element.propSubscriptions.length
            
            // Change freeze state to create subscription
            freezeSignal.set(true)
            
            // Destroy element
            element.destroy()
            
            // Change freeze signal - should not affect destroyed element
            freezeSignal.set(false)
            expect(element.isFrozen).toBe(true) // Should remain frozen (no longer reactive)
        })
    })
})
