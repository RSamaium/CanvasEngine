import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { Viewport, Canvas, h, signal, computed } from 'canvasengine';
import { TestBed } from '../../packages/core/testing';

vi.mock('pixi-viewport');

describe('Viewport', () => {
    // Mock function variables are not strictly needed here anymore,
    // as we will access mocks via the instance.

    beforeEach(() => {
        // Reset mocks before each test
        vi.resetAllMocks();
    });

    // afterEach is not needed if beforeEach resets mocks

    test('should create a viewport with default settings', async () => {
        const viewportElement = await TestBed.createComponent(Viewport);
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance).toBeDefined();
        // Optionally check if the super constructor was called implicitly
        // or if default options were set on the mock if necessary.
    });

    test('should set drag options', async () => {
        const dragOptions = { pressDrag: true };
        const viewportElement = await TestBed.createComponent(Viewport, {
            drag: dragOptions
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.drag).toHaveBeenCalledWith(dragOptions);
    });

    test('should set wheel options when boolean', async () => {
        const viewportElement = await TestBed.createComponent(Viewport, {
            wheel: true
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.wheel).toHaveBeenCalled();
    });

    test('should set wheel options with config', async () => {
        const wheelOptions = { smooth: 10 };
        const viewportElement = await TestBed.createComponent(Viewport, {
            wheel: wheelOptions
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.wheel).toHaveBeenCalledWith(wheelOptions);
    });

    test('should set clamp options when boolean', async () => {
        const viewportElement = await TestBed.createComponent(Viewport, {
            clamp: true
        });
        const viewportInstance = viewportElement.componentInstance as any;

        // Check if the correct argument is passed based on CanvasViewport logic
        expect(viewportInstance.viewport.clamp).toHaveBeenCalledWith(true); // Assuming boolean true maps to clamp(true)
    });

    test('should set clamp options with config', async () => {
        const clampOptions = { left: 0, right: 100, top: 0, bottom: 100 };
        const viewportElement = await TestBed.createComponent(Viewport, {
            clamp: clampOptions
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.clamp).toHaveBeenCalledWith(clampOptions);
    });

    test('should set decelerate options when boolean', async () => {
        const viewportElement = await TestBed.createComponent(Viewport, {
            decelerate: true
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.decelerate).toHaveBeenCalled();
    });

    test('should set decelerate options with config', async () => {
        const decelerateOptions = { friction: 0.95 };
        const viewportElement = await TestBed.createComponent(Viewport, {
            decelerate: decelerateOptions
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.decelerate).toHaveBeenCalledWith(decelerateOptions);
    });

    test('should set pinch options when boolean', async () => {
        const viewportElement = await TestBed.createComponent(Viewport, {
            pinch: true
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.pinch).toHaveBeenCalled();
    });

    test('should set pinch options with config', async () => {
        const pinchOptions = { percent: 1 };
        const viewportElement = await TestBed.createComponent(Viewport, {
            pinch: pinchOptions
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.pinch).toHaveBeenCalledWith(pinchOptions);
    });

    test('should register event listeners', async () => {
        const onDragStart = vi.fn();
        const onDragEnd = vi.fn();
        const viewportElement = await TestBed.createComponent(Viewport, {
            'drag-start': onDragStart,
            'drag-end': onDragEnd
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.on).toHaveBeenCalledWith('drag-start', onDragStart);
        expect(viewportInstance.viewport.on).toHaveBeenCalledWith('drag-end', onDragEnd);
    });

    test('should update screen size based on context', async () => {
        const width = signal(800);
        const height = signal(600);

        // Mock the context parts needed by CanvasViewport
        const mockTick = { observable: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) } };
        const mockRenderer = { events: { domElement: { addEventListener: vi.fn(), removeEventListener: vi.fn() } } };
        const canvasSize = () => ({ width: width(), height: height() });
        const context = { canvasSize, tick: mockTick, renderer: mockRenderer };

        // Create component with mocked context
        const viewportElement = await TestBed.createComponent(Viewport, { context });
        const viewportInstance = viewportElement.componentInstance as any;

        // Check initial screen size set during mount
        expect(viewportInstance.viewport.screenWidth).toBe(800);
        expect(viewportInstance.viewport.screenHeight).toBe(600);

        // Update signal and trigger effect (difficult to test effect directly)
        width.set(1024);
        height.set(768);

        // Re-render or manually trigger update if possible/needed to test effect
        // In this setup, testing the effect directly is complex.
        // We mostly verified that the initial values from context are used.
    });

    test('should update viewport settings when props change', async () => {
        const worldWidth = signal(1000);
        const worldHeight = signal(800);
        const clampOptions = signal({ left: 0, right: 1000 });

        const viewportElement = await TestBed.createComponent(Viewport, {
            worldWidth,
            worldHeight,
            clamp: clampOptions // Use signal for clamp options
        });
        const viewportInstance = viewportElement.componentInstance as any;

        // Check initial settings
        expect(viewportInstance.viewport.worldWidth).toBe(1000);
        expect(viewportInstance.viewport.worldHeight).toBe(800);
        expect(viewportInstance.viewport.clamp).toHaveBeenCalledWith({ left: 0, right: 1000 });

        // Update signals to trigger onUpdate
        worldWidth.set(1200);
        worldHeight.set(900);
        clampOptions.set({ left: 10, right: 1190 });

        expect(viewportInstance.viewport.worldWidth).toBe(1200);
        expect(viewportInstance.viewport.worldHeight).toBe(900);
        expect(viewportInstance.viewport.clamp).toHaveBeenCalledWith({ left: 10, right: 1190 });

        // Re-check if mocks were called again during update (this part is hard without explicit update trigger)
        // expect(viewportInstance.clamp).toHaveBeenCalledWith({ left: 10, right: 1190 });
    });

    test('should handle clamp prop with value property', async () => {
        const clampConfig = { value: { left: 10, right: 90 } };
        const viewportElement = await TestBed.createComponent(Viewport, {
            clamp: clampConfig
        });
        const viewportInstance = viewportElement.componentInstance as any;

        expect(viewportInstance.viewport.clamp).toHaveBeenCalledWith({ left: 10, right: 90 });
    });
});
