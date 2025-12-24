import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Canvas, ComponentInstance, bootstrapCanvas, Container, Element, h, signal, Rect, mount, computed } from 'canvasengine';
import { TestBed } from '../../packages/core/testing';
import { Graphics } from 'pixi.js'

const mockRect = vi.fn()

beforeEach(() => {
    vi.spyOn(Graphics.prototype, 'rect').mockImplementation(mockRect)
})

afterEach(() => {
    vi.clearAllMocks()
})

describe('Graphics', () => {
    let rect: Element<ComponentInstance>

    describe('Rect', () => {
        it('should create a rect', async () => {
            await TestBed.createComponent(Rect, { width: 100, height: 100, color: '#fff' })
            expect(mockRect).toHaveBeenCalled()
            expect(mockRect).toHaveBeenCalledWith(-0, -0, 100, 100)
        })

        it('should create a rect, change width', async () => {
            const width = signal(100)
            await TestBed.createComponent(Rect, { width, height: 100, color: '#fff' })
            
            // First call should be with initial width
            expect(mockRect).toHaveBeenCalledWith(-0, -0, 100, 100)
            
            width.set(200)
            // Wait for the effect to run
            await new Promise(resolve => setTimeout(resolve, 0))
            
            // Should be called twice now
            expect(mockRect).toHaveBeenCalledTimes(2)
            // Second call should be with updated width
            expect(mockRect).toHaveBeenLastCalledWith(-0, -0, 200, 100)
        })
    })
})
