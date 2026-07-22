import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ComponentInstance, Container, Element, h, Rect } from 'canvasengine';
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

    it('participates in flex centering with its complete visual bounds', async () => {
        const parent = await TestBed.createComponent(Container, {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: 800,
            height: 600,
        }, [
            h(Loading, { size: 30 }),
        ]);
        const loading = parent.props.children?.[0] as Element<ComponentInstance>;

        expect(loading.componentInstance.layout.computedLayout.width).toBe(60);
        expect(loading.componentInstance.layout.computedLayout.height).toBe(60);
        expect(loading.componentInstance.layout.realX).toBe(370);
        expect(loading.componentInstance.layout.realY).toBe(270);
    });

});
