import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bootstrapCanvas, Canvas, ComponentInstance, Container, Element, h } from 'canvasengine';

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

  it('should update percentage layouts and centering after renderer resize', async () => {
    rootElement.innerHTML = '';
    const component = () => h(Canvas, { tickStart: false }, [
      h(Container, {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }, [
        h(Container, { width: 60, height: 40 }),
      ]),
    ]);
    const result = await bootstrapCanvas(rootElement, component, {
      width: 800,
      height: 600,
      layout: { throttle: 0 },
    });
    const fullScreen = result.canvasElement.props.children?.[0] as Element<ComponentInstance>;
    const centeredChild = fullScreen.props.children?.[0] as Element<ComponentInstance>;

    result.app.render();
    expect(centeredChild.componentInstance.layout.realX).toBe(370);
    expect(centeredChild.componentInstance.layout.realY).toBe(280);

    result.app.renderer.resize(1000, 700);
    result.app.render();

    expect(result.canvasElement.props.context.canvasSize()).toEqual({ width: 1000, height: 700 });
    expect(fullScreen.componentInstance.layout.computedLayout.width).toBe(1000);
    expect(fullScreen.componentInstance.layout.computedLayout.height).toBe(700);
    expect(centeredChild.componentInstance.layout.realX).toBe(470);
    expect(centeredChild.componentInstance.layout.realY).toBe(330);
  });
});
