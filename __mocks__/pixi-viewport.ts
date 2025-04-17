import { vi } from "vitest";
import { Viewport as PixiViewport } from 'pixi-viewport';

export class Viewport extends PixiViewport {
    drag = vi.fn().mockReturnThis();
    wheel = vi.fn().mockReturnThis();
    clamp = vi.fn().mockReturnThis();
    decelerate = vi.fn().mockReturnThis();
    pinch = vi.fn().mockReturnThis();
    on = vi.fn().mockReturnThis();
    update = vi.fn().mockReturnThis();

    screenWidth = 0;
    screenHeight = 0;
    worldWidth = 0;
    worldHeight = 0;
    options: any = { events: {} }; // Initialize options
    input: any = { wheelFunction: vi.fn() }; // Mock input property
}
