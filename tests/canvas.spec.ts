import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Canvas } from '../src/components/Canvas';
import { ComponentInstance } from '../src/components/DisplayObject';
import { Element } from '../src';

describe('Canvas', () => {
  let rootElement: HTMLElement;
  let canvas: Element<ComponentInstance>

  beforeEach(async () => {
    rootElement = document.getElementById('root')
    canvas = await Canvas({ tickStart: false });
    canvas.render(rootElement);
  });

  afterEach(() => {
    rootElement.innerHTML = ''
    vi.clearAllMocks();
  });

  it('should create a canvas element and append it to the root element', async () => {
    expect(rootElement.querySelector('canvas')).not.toBeNull();
  });

  it('should resize the canvas when window is resized', async () => {
    // Simulate window resize
    window.innerWidth = 1024;
    window.innerHeight = 768;
    window.dispatchEvent(new Event('resize'));
  });

  it('should create a context with Yoga, renderer, and canvasSize', async () => {
    const context = canvas.props.context;

    expect(context).toBeDefined();
    expect(context.Yoga).toBeDefined();
    expect(context.renderer).toBeDefined();
    expect(typeof context.canvasSize).toBe('function');
  });

  it('should return correct canvas size when calling canvasSize', async () => {
    const context = canvas.props.context;
    const { width, height } = context.canvasSize();

    expect(typeof width).toBe('number');
    expect(typeof height).toBe('number');
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });
});
