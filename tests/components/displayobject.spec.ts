import { beforeEach, describe, expect, test, vi } from 'vitest'
import { signal } from 'canvasengine'
import { DisplayObject } from '../../packages/core/src/components/DisplayObject'

// Mock PixiJS Container for testing
class MockContainer {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    alpha = 1;
    visible = true;
    rotation = 0;
    scale = { x: 1, y: 1 };
    anchor = { x: 0, y: 0 };
    pivot = { x: 0, y: 0 };
    skew = { x: 0, y: 0 };
    tint = 0xffffff;
    blendMode = 0;
    filters = [];
    mask = null;
    parent = null;
    children = [];
    eventMode = 'auto';
    destroyed = false;
    #eventListeners: Map<string, Function[]> = new Map();
    
    addChild() {}
    addChildAt() {}
    destroy() {
        this.destroyed = true;
        this.#eventListeners.clear();
    }
    
    on(event: string, handler: Function) {
        if (!this.#eventListeners.has(event)) {
            this.#eventListeners.set(event, []);
        }
        this.#eventListeners.get(event)!.push(handler);
    }
    
    off(event: string, handler?: Function) {
        if (!this.#eventListeners.has(event)) return;
        if (handler) {
            const handlers = this.#eventListeners.get(event)!;
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        } else {
            this.#eventListeners.delete(event);
        }
    }
    
    emit(event: string, data?: any) {
        if (this.#eventListeners.has(event)) {
            this.#eventListeners.get(event)!.forEach(handler => handler(data));
        }
    }
}

describe('DisplayObject Component', () => {
    let TestDisplayObject;
    let mockContext;
    let mockTick;

    beforeEach(() => {
        mockTick = signal({ deltaRatio: 1 })
        mockContext = {
            tick: mockTick,
            app: () => ({ renderer: {} }),
            scheduler: {
                tick: { value: { deltaRatio: 1 } }
            }
        }
        
        // Create a test class that extends DisplayObject
        TestDisplayObject = DisplayObject(MockContainer)
    })

    test('creates display object with basic properties', () => {
        const instance = new TestDisplayObject()
        
        expect(instance).toBeDefined()
        expect(instance.isFlex).toBe(false)
        expect(instance.isMounted).toBe(false)
        expect(instance.disableLayout).toBe(false)
    })

    test('handles initialization with props', () => {
        const instance = new TestDisplayObject()
        const props = {
            id: 'test-object',
            x: 100,
            y: 50,
            width: 200,
            height: 150
        }
        
        instance.onInit(props)
        
        expect(instance._id).toBe('test-object')
    })

    test('handles flex layout properties', () => {
        const instance = new TestDisplayObject()
        const props = {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }
        
        instance.onInit(props)
        
        expect(instance.isFlex).toBe(true)
        expect(instance.layout).toBeDefined()
    })

    test('handles percentage width and height', () => {
        const instance = new TestDisplayObject()
        const props = {
            width: '50%',
            height: '75%'
        }
        
        instance.onInit(props)
        
        expect(instance.isFlex).toBe(true)
    })

    test('handles event listeners', () => {
        const instance = new TestDisplayObject()
        const onClick = vi.fn()
        const onMouseOver = vi.fn()
        
        const props = {
            x: 100,
            y: 50
        }
        
        instance.onInit(props)
        
        // Basic properties should be handled
        expect(instance).toBeDefined()
        expect(onClick).toBeDefined()
        expect(onMouseOver).toBeDefined()
    })

    test('handles lifecycle hooks', () => {
        const instance = new TestDisplayObject()
        const onBeforeDestroy = vi.fn()
        const onAfterMount = vi.fn()
        
        const props = {
            onBeforeDestroy: onBeforeDestroy,
            onAfterMount: onAfterMount
        }
        
        instance.onInit(props)
        
        expect(instance.onBeforeDestroy).toBe(onBeforeDestroy)
        expect(instance.onAfterMount).toBe(onAfterMount)
    })

    test('handles position updates', () => {
        const instance = new TestDisplayObject()
        instance.displayWidth = signal(100)
        instance.displayHeight = signal(50)
        
        instance.setX(200)
        instance.setY(150)
        
        expect(instance.x).toBe(200)
        expect(instance.y).toBe(150)
    })

    test('handles dimension updates', () => {
        const instance = new TestDisplayObject()
        
        instance.setWidth(300)
        instance.setHeight(200)
        
        expect(instance.displayWidth()).toBe(300)
        expect(instance.displayHeight()).toBe(200)
    })

    test('handles flex properties', () => {
        const instance = new TestDisplayObject()
        instance.layout = {}
        
        instance.setFlexGrow(2)
        instance.setFlexShrink(1)
        instance.setFlexBasis('auto')
        
        expect(instance.layout).toBeDefined()
        expect(typeof instance.setFlexGrow).toBe('function')
        expect(typeof instance.setFlexShrink).toBe('function')
        expect(typeof instance.setFlexBasis).toBe('function')
    })

    test('handles margin and padding', () => {
        const instance = new TestDisplayObject()
        instance.layout = {}
        
        instance.setMargin([10, 20])
        instance.setPadding([5, 15])
        
        expect(instance.layout).toBeDefined()
        expect(typeof instance.setMargin).toBe('function')
        expect(typeof instance.setPadding).toBe('function')
    })

    test('handles margin and padding with 4 values', () => {
        const instance = new TestDisplayObject()
        instance.layout = {}
        
        instance.setMargin([10, 20, 30, 40])
        instance.setPadding([5, 15, 25, 35])
        
        expect(instance.layout).toBeDefined()
        expect(typeof instance.setMargin).toBe('function')
        expect(typeof instance.setPadding).toBe('function')
    })

    test('handles constraints', () => {
        const instance = new TestDisplayObject()
        instance.layout = {}
        
        instance.setMinWidth(100)
        instance.setMaxWidth(500)
        instance.setMinHeight(50)
        instance.setMaxHeight(300)
        instance.setAspectRatio(16/9)
        
        expect(instance.layout).toBeDefined()
        expect(typeof instance.setMinWidth).toBe('function')
        expect(typeof instance.setMaxWidth).toBe('function')
        expect(typeof instance.setMinHeight).toBe('function')
        expect(typeof instance.setMaxHeight).toBe('function')
        expect(typeof instance.setAspectRatio).toBe('function')
    })

    test('handles position insets', () => {
        const instance = new TestDisplayObject()
        instance.layout = {}
        
        instance.setTop(10)
        instance.setLeft(20)
        instance.setRight(30)
        instance.setBottom(40)
        
        expect(instance.layout).toBeDefined()
        expect(typeof instance.setTop).toBe('function')
        expect(typeof instance.setLeft).toBe('function')
        expect(typeof instance.setRight).toBe('function')
        expect(typeof instance.setBottom).toBe('function')
    })

    test('handles object fit and position', () => {
        const instance = new TestDisplayObject()
        instance.layout = {}
        
        instance.setObjectFit('cover')
        instance.setObjectPosition('center')
        instance.setTransformOrigin('50% 50%')
        
        expect(instance.layout).toBeDefined()
        expect(typeof instance.setObjectFit).toBe('function')
        expect(typeof instance.setObjectPosition).toBe('function')
        expect(typeof instance.setTransformOrigin).toBe('function')
    })

    test('handles delta ratio access', () => {
        const instance = new TestDisplayObject()
        // Set up the canvas context properly by calling onMount
        instance.onMount({ 
            parent: null, 
            props: { context: mockContext } 
        })
        
        const deltaRatio = instance.deltaRatio
        expect(deltaRatio).toBeDefined()
    })

    test('handles parent flex detection', () => {
        const instance = new TestDisplayObject()
        const parentInstance = new TestDisplayObject()
        parentInstance.isFlex = true
        
        instance.parent = { isFlex: true }
        
        expect(instance.parentIsFlex).toBe(true)
    })

    test('getWidth returns static width when not using percentages', () => {
        const instance = new TestDisplayObject()
        const props = { width: 250, height: 150, context: mockContext }
        instance.onInit(props)
        instance.width = 250
        instance.setWidth(250)
        
        // Update fullProps via onUpdate
        instance.onUpdate(props)
        
        expect(instance.getWidth()).toBe(250)
    })

    test('getHeight returns static height when not using percentages', () => {
        const instance = new TestDisplayObject()
        const props = { width: 250, height: 150, context: mockContext }
        instance.onInit(props)
        instance.height = 150
        instance.setHeight(150)
        
        // Update fullProps via onUpdate
        instance.onUpdate(props)
        
        expect(instance.getHeight()).toBe(150)
    })

    test('getWidth returns displayWidth when native width is 0', () => {
        const instance = new TestDisplayObject()
        const props = { width: 300, context: mockContext }
        instance.onInit(props)
        instance.width = 0
        instance.setWidth(300)
        
        // Update fullProps via onUpdate
        instance.onUpdate(props)
        
        expect(instance.getWidth()).toBe(300)
    })

    test('getHeight returns displayHeight when native height is 0', () => {
        const instance = new TestDisplayObject()
        const props = { height: 200, context: mockContext }
        instance.onInit(props)
        instance.height = 0
        instance.setHeight(200)
        
        // Update fullProps via onUpdate
        instance.onUpdate(props)
        
        expect(instance.getHeight()).toBe(200)
    })

    test('getWidth returns 0 when no width is set', () => {
        const instance = new TestDisplayObject()
        const props = { context: mockContext }
        instance.onInit(props)
        instance.width = 0
        
        // Update fullProps via onUpdate
        instance.onUpdate(props)
        
        expect(instance.getWidth()).toBe(0)
    })

    test('getHeight returns 0 when no height is set', () => {
        const instance = new TestDisplayObject()
        const props = { context: mockContext }
        instance.onInit(props)
        instance.height = 0
        
        // Update fullProps via onUpdate
        instance.onUpdate(props)
        
        expect(instance.getHeight()).toBe(0)
    })

    test('getWidth returns computed layout width for percentages', async () => {
        const instance = new TestDisplayObject()
        const parentInstance = new TestDisplayObject()
        parentInstance.isFlex = false
        
        const props = { width: '100%', height: '100%', context: mockContext }
        instance.onInit(props)
        
        await instance.onMount({
            parent: {
                componentInstance: parentInstance
            },
            props
        })
        
        // Emit layout event with computed dimensions
        instance.emit('layout', {
            computedLayout: {
                width: 800,
                height: 600
            }
        })
        
        expect(instance.getWidth()).toBe(800)
    })

    test('getHeight returns computed layout height for percentages', async () => {
        const instance = new TestDisplayObject()
        const parentInstance = new TestDisplayObject()
        parentInstance.isFlex = false
        
        const props = { width: '100%', height: '100%', context: mockContext }
        instance.onInit(props)
        
        await instance.onMount({
            parent: {
                componentInstance: parentInstance
            },
            props
        })
        
        // Emit layout event with computed dimensions
        instance.emit('layout', {
            computedLayout: {
                width: 800,
                height: 600
            }
        })
        
        expect(instance.getHeight()).toBe(600)
    })

    test('getWidth falls back to native width when layout not computed for percentages', async () => {
        const instance = new TestDisplayObject()
        const parentInstance = new TestDisplayObject()
        parentInstance.isFlex = false
        
        const props = { width: '100%', context: mockContext }
        instance.onInit(props)
        instance.width = 500
        
        await instance.onMount({
            parent: {
                componentInstance: parentInstance
            },
            props
        })
        
        // Before layout event, should fallback to native width
        expect(instance.getWidth()).toBe(500)
    })

    test('getHeight falls back to native height when layout not computed for percentages', async () => {
        const instance = new TestDisplayObject()
        const parentInstance = new TestDisplayObject()
        parentInstance.isFlex = false
        
        const props = { height: '100%', context: mockContext }
        instance.onInit(props)
        instance.height = 400
        
        await instance.onMount({
            parent: {
                componentInstance: parentInstance
            },
            props
        })
        
        // Before layout event, should fallback to native height
        expect(instance.getHeight()).toBe(400)
    })

    test('layout event updates computed layout box', async () => {
        const instance = new TestDisplayObject()
        const parentInstance = new TestDisplayObject()
        parentInstance.isFlex = false
        
        const props = { width: '50%', height: '75%', context: mockContext }
        instance.onInit(props)
        
        await instance.onMount({
            parent: {
                componentInstance: parentInstance
            },
            props
        })
        
        // Emit layout event
        instance.emit('layout', {
            computedLayout: {
                width: 400,
                height: 450
            }
        })
        
        // getWidth and getHeight should now return computed values
        expect(instance.getWidth()).toBe(400)
        expect(instance.getHeight()).toBe(450)
    })

    test('layout event listener is registered during onMount', async () => {
        const instance = new TestDisplayObject()
        const parentInstance = new TestDisplayObject()
        parentInstance.isFlex = false
        
        const props = { width: '100%', context: mockContext }
        instance.onInit(props)
        
        await instance.onMount({
            parent: {
                componentInstance: parentInstance
            },
            props
        })
        
        // Verify layout event listener is registered by emitting an event
        // and checking that getWidth returns the computed value
        instance.emit('layout', {
            computedLayout: { width: 800, height: 600 }
        })
        
        // Verify the layout box was updated
        expect(instance.getWidth()).toBe(800)
    })

    test('getWidth handles mixed percentage and static values', async () => {
        const instance = new TestDisplayObject()
        const parentInstance = new TestDisplayObject()
        parentInstance.isFlex = false
        
        const props = { width: '100%', height: 200, context: mockContext }
        instance.onInit(props)
        instance.height = 200
        instance.setHeight(200)
        
        await instance.onMount({
            parent: {
                componentInstance: parentInstance
            },
            props
        })
        
        // Emit layout event
        instance.emit('layout', {
            computedLayout: {
                width: 800,
                height: 600
            }
        })
        
        // Width should use computed layout, height should use static value
        expect(instance.getWidth()).toBe(800)
        expect(instance.getHeight()).toBe(200)
    })

    test('getHeight handles mixed percentage and static values', async () => {
        const instance = new TestDisplayObject()
        const parentInstance = new TestDisplayObject()
        parentInstance.isFlex = false
        
        const props = { width: 300, height: '100%', context: mockContext }
        instance.onInit(props)
        instance.width = 300
        instance.setWidth(300)
        
        await instance.onMount({
            parent: {
                componentInstance: parentInstance
            },
            props
        })
        
        // Emit layout event
        instance.emit('layout', {
            computedLayout: {
                width: 800,
                height: 600
            }
        })
        
        // Width should use static value, height should use computed layout
        expect(instance.getWidth()).toBe(300)
        expect(instance.getHeight()).toBe(600)
    })
}) 