import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Rect } from 'canvasengine';
import { TestBed } from '../../packages/core/testing';
import { Loading } from '../../packages/presets/src/Loading';

const mockCircle = vi.fn();
const mockArc = vi.fn();

function findPrototypeWithMethod(instance: object, method: string) {
    let proto = Object.getPrototypeOf(instance);
    while (proto && !Object.prototype.hasOwnProperty.call(proto, method)) {
        proto = Object.getPrototypeOf(proto);
    }
    return proto;
}

beforeEach(async () => {
    const rect = await TestBed.createComponent(Rect, { width: 1, height: 1, color: '#fff' });
    const graphicsPrototype = findPrototypeWithMethod(rect.componentInstance, 'rect');
    vi.spyOn(graphicsPrototype, 'circle').mockImplementation(function (...args) {
        mockCircle(...args);
        return this;
    });
    vi.spyOn(graphicsPrototype, 'arc').mockImplementation(function (...args) {
        mockArc(...args);
        return this;
    });
    mockCircle.mockClear();
    mockArc.mockClear();
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('Loading preset', () => {
    it('exposes its diameter to layout and draws from the center of its bounds', async () => {
        const loading = await TestBed.createComponent(Loading, {
            size: 20,
            backgroundColor: '#000',
            color: '#fff',
            segments: 1
        });

        expect(loading.componentInstance.displayWidth()).toBe(40);
        expect(loading.componentInstance.displayHeight()).toBe(40);
        expect(mockCircle).toHaveBeenCalledWith(20, 20, 20);
        expect(mockArc).toHaveBeenCalledWith(20, 20, 8, -Math.PI, Math.PI);
        expect(mockArc).toHaveBeenCalledWith(20, 20, 20, Math.PI, -Math.PI, true);
    });
});
