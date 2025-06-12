import { describe, expect, test, vi } from 'vitest';
import { Scroll, Container } from 'canvasengine';
import { TestBed } from '../../packages/core/testing';

vi.mock('pixi-viewport');

describe('Scroll Component', () => {
    test('should create scroll viewport', async () => {
        const scroll = await TestBed.createComponent(Scroll, {
            worldWidth: 1000,
            worldHeight: 1000
        }, [
            Container({})
        ]);
        expect(scroll).toBeDefined();
        const instance = scroll.componentInstance as any;
        expect(instance.worldWidth).toBe(1000);
    });

    test('should follow target', async () => {
        const child = Container({});
        const scroll = await TestBed.createComponent(Scroll, {
            follow: child
        }, [child]);
        const instance = scroll.componentInstance as any;
        expect(instance.follow).toHaveBeenCalled();
    });
});
