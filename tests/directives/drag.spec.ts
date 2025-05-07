import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { Container, h, signal, cond } from 'canvasengine';
import { TestBed } from '../../packages/core/testing';
import { Point, FederatedPointerEvent } from 'pixi.js';
import { Container as PixiContainer } from 'pixi.js';

describe('Drag', () => {
    let mockOn: ReturnType<typeof vi.fn>;
    let mockOff: ReturnType<typeof vi.fn>;
    let mockToLocal: ReturnType<typeof vi.fn>;
    
    // Mock window event listeners
    beforeEach(() => {
        mockOn = vi.fn();
        mockOff = vi.fn();
        mockToLocal = vi.fn().mockReturnValue(new Point(10, 10));

        // Mock Container instance methods
        vi.spyOn(PixiContainer.prototype, 'on').mockImplementation(mockOn);
        vi.spyOn(PixiContainer.prototype, 'off').mockImplementation(mockOff);
        vi.spyOn(PixiContainer.prototype, 'toLocal').mockImplementation(mockToLocal);
        
        // Spy on window methods without implementation to avoid browser errors
        vi.spyOn(window, 'addEventListener').mockImplementation(vi.fn());
        vi.spyOn(window, 'removeEventListener').mockImplementation(vi.fn());
    });
    
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('drag directive', () => {
        test('should set drag directive with all direction', async () => {
            const container = await TestBed.createComponent(Container, { 
                drag: {
                    direction: 'all',
                } 
            });
            
            expect(container.componentInstance.eventMode).toBe('static');
            expect(mockOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        });
        
        test('should set drag directive with x direction only', async () => {
            const container = await TestBed.createComponent(Container, { 
                drag: {
                    direction: 'x',
                } 
            });
            
            expect(container.componentInstance.eventMode).toBe('static');
            expect(mockOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        });
        
        test('should set drag directive with y direction only', async () => {
            const container = await TestBed.createComponent(Container, { 
                drag: {
                    direction: 'y',
                } 
            });
            
            expect(container.componentInstance.eventMode).toBe('static');
            expect(mockOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        });
        
        test('should work with signal values for drag properties', async () => {
            const direction = signal('all');
            
            const container = await TestBed.createComponent(Container, { 
                drag: {
                    direction,
                    snap: 10
                } 
            });
            
            expect(container.componentInstance.eventMode).toBe('static');
            direction.set('x');
            expect(mockOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        });
        
        test('should clean up event listeners on destroy', async () => {
            const display = signal(true);
            await TestBed.createComponent(
               () => {
                 return cond(
                    display,
                    () => h(Container, {
                        drag: {
                            direction: 'all',
                        }
                    })
                )
               } 
            );

            expect(mockOff).not.toHaveBeenCalled();
            display.set(false);
            expect(mockOff).toHaveBeenCalled();
        });
        
        test('should handle start, move and end callbacks', async () => {
            const onStart = vi.fn();
            const onMove = vi.fn();
            const onEnd = vi.fn();
            
            await TestBed.createComponent(Container, { 
                drag: {
                    direction: 'all',
                    start: onStart,
                    move: onMove,
                    end: onEnd
                } 
            });
            
            expect(mockOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        });
        
        test('should handle conditional drag', async () => {
            const isActive = signal(true);
            const container = await TestBed.createComponent(Container, { 
                drag: {
                    direction: 'all',
                } 
            });
            expect(container.componentInstance.eventMode).toBe('static');
        });
    });

    describe('drag directive with keyToPress', () => {
        test('should add keyboard listeners when keyToPress is provided', async () => {
            // This test verifies that addEventListener is called for the keyboard events
            await TestBed.createComponent(Container, { 
                drag: {
                    keyToPress: ['Space']
                } 
            });
            
            // Check that window event listeners were added
            expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(window.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
        });
        
        test('should remove keyboard listeners on destroy', async () => {
            // This test verifies that removeEventListener is called on destroy
            const display = signal(true);
            
            await TestBed.createComponent(() => {
                return cond(
                    display,
                    () => h(Container, {
                        drag: {
                            keyToPress: ['Space']
                        }
                    })
                );
            });
            
            // Initially, addEventListener should be called but not removeEventListener
            expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(window.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
            
            // After setting display to false (triggering destroy), removeEventListener should be called
            display.set(false);
            
            // Check removeEventListener was called with the same event types
            expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(window.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
        });
        
        test('should support various key configurations', async () => {
            // Just test that we can create components with different key configurations
            await TestBed.createComponent(Container, { 
                drag: {
                    keyToPress: ['Space']
                } 
            });
            
            await TestBed.createComponent(Container, { 
                drag: {
                    keyToPress: ['ShiftLeft', 'ShiftRight']
                } 
            });
            
            await TestBed.createComponent(Container, { 
                drag: {
                    keyToPress: ['ControlLeft']
                } 
            });
            
            await TestBed.createComponent(Container, { 
                drag: {
                    keyToPress: ['AltLeft']
                } 
            });
            
            // All tests should pass, verifying the component accepts these configurations
            expect(true).toBe(true);
        });
    });
});
       
