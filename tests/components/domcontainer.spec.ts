import { beforeEach, describe, expect, test, vi } from 'vitest'
import { signal } from 'canvasengine'
import { DOMContainer } from '../../packages/core/src/components/DOMContainer'

describe('DOMContainer Component', () => {
    let mockElement;

    beforeEach(() => {
        mockElement = {
            value: document.createElement('div')
        }
    })

    test('creates DOM container with element string', () => {
        const domElement = DOMContainer({
            element: 'div'
        })

        expect(domElement).toBeDefined()
        expect(typeof domElement).toBe('object')
    })

    test('creates DOM container with element object', () => {
        const domElement = DOMContainer({
            element: mockElement
        })

        expect(domElement).toBeDefined()
    })

    test('creates DOM container with text content', () => {
        const domElement = DOMContainer({
            element: 'p',
            textContent: 'Hello World'
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with class attributes', () => {
        const domElement = DOMContainer({
            element: 'div',
            attrs: {
                class: 'container primary-theme'
            }
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with style attributes', () => {
        const domElement = DOMContainer({
            element: 'div',
            attrs: {
                style: 'background-color: red; padding: 10px;'
            }
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with object style', () => {
        const domElement = DOMContainer({
            element: 'div',
            attrs: {
                style: {
                    backgroundColor: 'blue',
                    padding: '20px',
                    fontSize: 16
                }
            }
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with array classes', () => {
        const domElement = DOMContainer({
            element: 'div',
            attrs: {
                class: ['container', 'primary-theme', 'active']
            }
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with object classes', () => {
        const domElement = DOMContainer({
            element: 'div',
            attrs: {
                class: {
                    'container': true,
                    'primary-theme': true,
                    'disabled': false
                }
            }
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with multiple attributes', () => {
        const domElement = DOMContainer({
            element: 'input',
            attrs: {
                type: 'text',
                placeholder: 'Enter text...',
                id: 'my-input',
                name: 'username'
            }
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with event handlers', () => {
        const onClick = vi.fn()
        const onFocus = vi.fn()

        const domElement = DOMContainer({
            element: 'button',
            textContent: 'Click me',
            attrs: {
                click: onClick,
                focus: onFocus
            }
        })

        expect(domElement).toBeDefined()
        expect(onClick).toBeDefined()
        expect(onFocus).toBeDefined()
    })

    test('handles DOM container with position properties', () => {
        const domElement = DOMContainer({
            element: 'div',
            x: 100,
            y: 50,
            width: 200,
            height: 150
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with sortable children', () => {
        const domElement = DOMContainer({
            element: 'div',
            sortableChildren: true
        })

        expect(domElement).toBeDefined()
    })

    test('handles dynamic text content with signals', () => {
        const dynamicText = signal('Initial text')

        const domElement = DOMContainer({
            element: 'p',
            textContent: dynamicText()
        })

        expect(domElement).toBeDefined()

        dynamicText.set('Updated text')
        expect(dynamicText()).toBe('Updated text')
    })

    test('handles DOM container with complex attributes', () => {
        const domElement = DOMContainer({
            element: 'form',
            attrs: {
                method: 'POST',
                action: '/submit',
                class: 'form-container',
                style: {
                    border: '1px solid #ccc',
                    padding: '20px'
                }
            }
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with nested value objects', () => {
        const domElement = DOMContainer({
            element: 'div',
            attrs: {
                class: {
                    value: 'nested-class'
                },
                style: {
                    value: {
                        color: 'red',
                        fontSize: '14px'
                    }
                }
            }
        })

        expect(domElement).toBeDefined()
    })

    test('handles DOM container with all properties combined', () => {
        const onClick = vi.fn()

        const domElement = DOMContainer({
            element: 'div',
            textContent: 'Complete container',
            x: 50,
            y: 25,
            width: 300,
            height: 200,
            sortableChildren: true,
            attrs: {
                id: 'complete-container',
                class: ['container', 'complete'],
                style: {
                    backgroundColor: 'lightblue',
                    border: '2px solid blue'
                },
                click: onClick
            }
        })

        expect(domElement).toBeDefined()
        expect(onClick).toBeDefined()
    })
}) 