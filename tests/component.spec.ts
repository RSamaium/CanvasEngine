import { beforeEach, describe, expect, test, vi } from 'vitest'
import { bootstrapCanvas, Canvas, createComponent, h, registerComponent } from '../src/index'
import { signal } from '@signe/reactive'

describe('Component', () => {
    test('bootstrap application', async () => {
        function MyComponent() {    
            return h(Canvas, {
                tickStart: false
            })
        }
        const value = await bootstrapCanvas(document.getElementById('root'), MyComponent)
        expect(value).toBeDefined()
    })
})

describe('createComponent', () => {
    class TestComponent {
        onInit(props) {}
        onUpdate(props) {}
        onMount(element, index) {}
    }
    let element;
    let dynamicProp;
    let testComponent;

    beforeEach(() => {
        testComponent = new TestComponent()
        vi.spyOn(TestComponent.prototype, 'onInit')
        vi.spyOn(TestComponent.prototype, 'onUpdate')
        vi.spyOn(TestComponent.prototype, 'onMount')
        registerComponent('TestComponent', TestComponent)
        dynamicProp = signal('initial value')
        element = createComponent('TestComponent', {
            staticProp: 'static value',
            dynamicProp: dynamicProp
        })
    })

    test('returns an element with correct base properties', () => {
        expect(element).toHaveProperty('tag', 'TestComponent')
        expect(element).toHaveProperty('props')
        expect(element).toHaveProperty('componentInstance')
        expect(element.componentInstance).toBeInstanceOf(TestComponent)
    })

    test('handles static properties correctly', () => {
        expect(element.props).toHaveProperty('staticProp', 'static value')
    })

    test('handles dynamic properties correctly', () => {
        expect(element.props).toHaveProperty('dynamicProp', 'initial value')
        expect(element.propSubscriptions).toHaveLength(1)
    })

    test('updates dynamic properties', () => {
        dynamicProp.set('new value')
        expect(element.props.dynamicProp).toBe('new value')
    })

    test('initializes other properties correctly', () => {
        expect(element).toHaveProperty('effectSubscriptions')
        expect(element).toHaveProperty('effectMounts')
        expect(element).toHaveProperty('effectUnmounts')
        expect(element).toHaveProperty('parent', null)
        expect(element).toHaveProperty('directives')
    })

    test('calls onInit with correct props', () => {
        expect(TestComponent.prototype.onInit).toHaveBeenCalledWith({
            staticProp: 'static value',
            dynamicProp: 'initial value'
        })
    })

    test('calls onUpdate with correct props', () => {
        expect(TestComponent.prototype.onUpdate).toHaveBeenCalledWith({
            staticProp: 'static value',
            dynamicProp: 'initial value'
        })
    })

    test('calls onUpdate when dynamic prop changes', () => {
        dynamicProp.set('new value')
        expect(TestComponent.prototype.onUpdate).toHaveBeenCalledWith({
            dynamicProp: 'new value'
        })
    })

    test('calls onMount with correct parameters', () => {
        const parentElement = createComponent('TestComponent', {})
        element.parent = parentElement
        element.componentInstance.onMount(element, 0)
        expect(TestComponent.prototype.onMount).toHaveBeenCalledWith(element, 0)
    })
})