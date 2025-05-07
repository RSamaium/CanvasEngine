import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bootstrapCanvas, Canvas, ComponentInstance, Element } from 'canvasengine';

describe('Canvas', () => {
  let rootElement: HTMLElement;
  let canvasElement: Element<ComponentInstance>

  beforeEach(async () => {
    const { canvasElement: value } = await bootstrapCanvas(document.getElementById('root'), Canvas)
    rootElement = document.getElementById('root')
    canvasElement = value
  });

  afterEach(() => {
    rootElement.innerHTML = ''
    vi.clearAllMocks();
  });

  it('should create a canvas element and append it to the root element', async () => {
    expect(rootElement.querySelector('canvas')).not.toBeNull();
  });

  it('should return correct canvas size when calling canvasSize', async () => {
    const context = canvasElement.props.context;
    const { width, height } = context.canvasSize();

    expect(typeof width).toBe('number');
    expect(typeof height).toBe('number');
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });
});
