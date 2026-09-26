import { Effect, effect, isSignal, untracked, WritableSignal } from "@signe/reactive";
import { Assets, ObservablePoint, Graphics as PixiGraphics } from "pixi.js";
import { createComponent, Element, registerComponent } from "../engine/reactive";
import { ComponentInstance, DisplayObject } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";
import { SignalOrPrimitive } from "./types";
import { isPercent } from "../utils/functions";
import { setObservablePoint } from "../engine/utils";

interface GraphicsProps extends DisplayObjectProps {
  draw?: (graphics: PixiGraphics, width: number, height: number, anchor?: [number, number]) => void;
}

interface RectProps extends DisplayObjectProps {
  color: SignalOrPrimitive<string>;
}

interface CircleProps extends DisplayObjectProps {
  radius: SignalOrPrimitive<number>;
  color: SignalOrPrimitive<string>;
}

interface EllipseProps extends DisplayObjectProps {
  color: SignalOrPrimitive<string>;
}

interface TriangleProps extends DisplayObjectProps {
  base: SignalOrPrimitive<number>;
  color: SignalOrPrimitive<string>;
}

interface SvgProps extends DisplayObjectProps {
  /** SVG content as string (legacy prop) */
  svg?: string;
  /** URL source of the SVG file to load */
  src?: string;
  /** Direct SVG content as string */
  content?: string;
}

/**
 * A prop read by the draw function: the signal given as prop when there is
 * one, else a plain value. Static sizes do not get a signal of their own.
 */
class PropSource<T> {
  constructor(private source: WritableSignal<T> | null, private value: T) {}

  get(): T {
    return this.source ? this.source() : this.value;
  }

  set(value: T) {
    if (this.source) this.source.set(value);
    else this.value = value;
  }
}

const propSource = <T>(observable: unknown, value: T) =>
  new PropSource<T>(isSignal(observable) ? (observable as WritableSignal<T>) : null, value);

class CanvasGraphics extends DisplayObject(PixiGraphics) {
  clearEffect: Effect;
  #width: PropSource<number | string> | null = null;
  #height: PropSource<number | string> | null = null;
  #layoutBounds: { x: number; y: number; width: number; height: number } | null = null;
  #anchor: PropSource<[number, number]> | null = null;
  #redraw: (() => void) | null = null;
  // Size and anchor of the last drawing, to redraw only when they change
  #drawnSize: { width: unknown; height: unknown; anchor: unknown } | null = null;

  isCustomAnchor = true;
  
  /**
   * Initializes the graphics component with reactive width and height handling.
   * 
   * This method handles different types of width and height props:
   * - **Numbers**: Direct pixel values
   * - **Strings with %**: Percentage values that trigger flex layout and use layout box dimensions
   * - **Signals**: Reactive values that update automatically
   * 
   * When percentage values are detected, the component:
   * 1. Sets `display: 'flex'` to enable layout calculations
   * 2. Listens to layout events to get computed dimensions
   * 3. Updates internal width/height signals with layout box values
   * 
   * The draw function receives the reactive width and height signals as parameters.
   * 
   * @param props - Component properties including width, height, and draw function
   * @example
   * ```typescript
   * // With pixel values
   * Graphics({ width: 100, height: 50, draw: (g, w, h) => g.rect(0, 0, w(), h()) });
   * 
   * // With percentage values (uses layout box)
   * Graphics({ width: "50%", height: "100%", draw: (g, w, h) => g.rect(0, 0, w(), h()) });
   * 
   * // With signals
   * const width = signal(100);
   * Graphics({ width, height: 50, draw: (g, w, h) => g.rect(0, 0, w(), h()) });
   * ```
   */
  onInit(props) {
    super.onInit(props);
  }

  /**
   * Called when the component is mounted to the scene graph.
   * Creates the reactive effect for drawing using the original signals from propObservables.
   * @param {Element<DisplayObject>} element - The element being mounted with props and propObservables.
   * @param {number} [index] - The index of the component among its siblings.
   */
  async onMount(element: Element<any>, index?: number): Promise<void> {
    await super.onMount(element, index);
    if (this.destroyed || !this.parent) {
      return;
    }
    if (this.layout) {
      this.layout = {
        isLeaf: true,
        objectFit: 'none',
        objectPosition: 'top left',
        transformOrigin: '0% 0%',
      };
    }
    const { props, propObservables } = element;
    
    // The signals given as props, or the static values
    const width = propSource<number | string>(propObservables?.width, props.width || 0);
    const height = propSource<number | string>(propObservables?.height, props.height || 0);
    const anchor = propSource<[number, number]>(propObservables?.anchor, props.anchor || [0, 0]);
    this.#width = width;
    this.#height = height;
    this.#anchor = anchor;
    
    // Check if width or height are percentages to set display flex
    const isWidthPercentage = isPercent(width.get());
    const isHeightPercentage = isPercent(height.get());
    
    if (props.draw) {
      const draw = () => {
        // Size and anchor are read untracked: `onUpdate` and layout events
        // redraw when they change. The effect only tracks the signals the
        // draw function reads (a color signal, for example), so a static
        // shape subscribes to nothing. Each tracked signal costs several
        // RxJS subscriptions, created on mount and released on destroy.
        const [w, h, a] = untracked(() => [width.get(), height.get(), anchor.get()]);
        if (typeof w == 'string' || typeof h == 'string') {
          return
        }
        if (this.destroyed || !this.parent) {
          return
        }
        this.#drawnSize = { width: w, height: h, anchor: a };
        this.clear();
        props.draw?.(this, w as number, h as number, a);
        const bounds = this.getLocalBounds();
        const nextBounds = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        };
        const forceLayoutUpdate = (this.layout as any)?.forceUpdate;
        if (
          typeof forceLayoutUpdate === 'function' &&
          (!this.#layoutBounds ||
            this.#layoutBounds.x !== nextBounds.x ||
            this.#layoutBounds.y !== nextBounds.y ||
            this.#layoutBounds.width !== nextBounds.width ||
            this.#layoutBounds.height !== nextBounds.height)
        ) {
          this.#layoutBounds = nextBounds;
          forceLayoutUpdate.call(this.layout);
        }
        this.subjectInit.next(this)
      };
      // The effect collects its dependencies on its first run only, so it is
      // created once the size can be drawn: a percentage size is drawn by the
      // first layout event, and an effect created before would track nothing.
      this.#redraw = () => {
        if (this.clearEffect) {
          draw();
          return;
        }
        const [w, h] = untracked(() => [width.get(), height.get()]);
        if (typeof w == 'string' || typeof h == 'string' || this.destroyed || !this.parent) {
          return;
        }
        this.clearEffect = effect(draw);
      };
      this.#redraw();
    }

    this.on('layout', (event) => {
      const layoutBox = event.computedLayout;
      // Update width if it's a percentage and value has changed
      if (isWidthPercentage && width.get() !== layoutBox.width) {
        width.set(layoutBox.width);
      }
      
      // Update height if it's a percentage and value has changed
      if (isHeightPercentage && height.get() !== layoutBox.height) {
        height.set(layoutBox.height);
      }
      this.#redrawIfSizeChanged();
    });
  }

  /**
   * Called when component props are updated.
   * Updates the internal width and height signals when props change.
   * @param props - Updated properties
   */
  onUpdate(props: any) {
    super.onUpdate(props);

    // Update width if width prop changed and value is different
    if (props.width !== undefined && this.#width && this.#width.get() !== props.width) {
      this.#width.set(props.width);
    }
    
    // Update height if height prop changed and value is different
    if (props.height !== undefined && this.#height && this.#height.get() !== props.height) {
      this.#height.set(props.height);
    }

    if ("width" in props || "height" in props || "anchor" in props) {
      this.#redrawIfSizeChanged();
    }
  }

  /** Redraws when the size or anchor differs from the last drawing. */
  #redrawIfSizeChanged() {
    const redraw = this.#redraw;
    if (!redraw) return;
    untracked(() => {
      const drawn = this.#drawnSize;
      if (
        drawn &&
        drawn.width === this.#width?.get() &&
        drawn.height === this.#height?.get() &&
        drawn.anchor === this.#anchor?.get()
      ) {
        return;
      }
      redraw();
    });
  }

  /**
   * Called when the component is about to be destroyed.
   * This method should be overridden by subclasses to perform any cleanup.
   * It ensures that the clearEffect subscription is unsubscribed before calling the original afterDestroy callback.
   * @param parent The parent element.
   * @param afterDestroy A callback function to be executed after the component's own destruction logic.
   * @example
   * // This method is typically called by the engine internally.
   * // await component.onDestroy(parentElement, () => console.log('Component destroyed'));
   */
  async onDestroy(parent: Element<ComponentInstance>, afterDestroy: () => void): Promise<void> {
    const _afterDestroyCallback = async () => {
      this.clearEffect?.subscription.unsubscribe();
      afterDestroy();
    }
    await super.onDestroy(parent, _afterDestroyCallback);
  }
}

registerComponent("Graphics", CanvasGraphics);

export function Graphics(props: GraphicsProps) {
  return createComponent("Graphics", props);
}

const graphicsAnchor = (anchor, width, height) => {
  const observableAnchor = new ObservablePoint({ _onUpdate: () => {} }, 0, 0);
  setObservablePoint(observableAnchor, anchor);
  const ax = observableAnchor.x;
  const ay = observableAnchor.y;

  return { x: -ax * width, y: -ay * height };
}

/**
 * Reads a shape prop inside a draw function: a signal is read (and tracked by
 * the draw effect), a static value is used as is, without a signal around it.
 */
const propValue = (value: any) => isSignal(value) ? value() : value;

export function Rect(props: RectProps) {
  const { color, borderRadius, border } = props as any;

  return Graphics({
    draw: (g, width, height, anchor) => {
      const { x, y } = graphicsAnchor(anchor, width, height);
      const radius = propValue(borderRadius);
      if (radius) {
        g.roundRect(x, y, width, height, radius);
      } else {
        g.rect(x, y, width, height);
      }
      const borderValue = propValue(border);
      if (borderValue) {
        g.stroke(borderValue);
      }
      g.fill(propValue(color));
    },
    ...props
  })
}

export function Circle(props: CircleProps) {  
  const { color, border, radius } = props as any;
  return Graphics({
    draw: (g, width, height, anchor) => {
      const { x, y } = graphicsAnchor(anchor, width, height);
      if (width == height || height == 0) {
        g.circle(x, y, propValue(radius) || width);
      } else {
        g.ellipse(x, y, width, height);
      }
      const borderValue = propValue(border);
      if (borderValue) {
        g.stroke(borderValue);
      }
      g.fill(propValue(color));
    },
    ...props
  })
}

export function Ellipse(props: EllipseProps) {
  const { color, border } = props as any;

  return Graphics({
    draw: (g, width, height, anchor) => {
      const { x, y } = graphicsAnchor(anchor, width, height);
      g.ellipse(x + width / 2, y + height / 2, width / 2, height / 2);
      const borderValue = propValue(border);
      if (borderValue) {
        g.stroke(borderValue);
      }
      g.fill(propValue(color));
    },
    ...props
  })
}

export function Triangle(props: TriangleProps) {
  const { border } = props as any;
  const color = "color" in props ? (props as any).color : "#000";
  return Graphics({
    draw: (g, gWidth, gHeight, anchor) => {
      const { x, y } = graphicsAnchor(anchor, gWidth, gHeight);
      g.moveTo(x, y + gHeight);
      g.lineTo(x + gWidth / 2, y);
      g.lineTo(x + gWidth, y + gHeight);
      g.lineTo(x, y + gHeight);
      g.fill(propValue(color));
      const borderValue = propValue(border);
      if (borderValue) {
        g.stroke(borderValue);
      }
    },
    ...props
  })
}

/**
 * Creates an SVG component that can render SVG graphics from URL, content, or legacy svg prop.
 * 
 * This component provides three ways to display SVG graphics:
 * - **src**: Load SVG from a URL using Assets.load with parseAsGraphicsContext option
 * - **content**: Render SVG directly from string content using Graphics.svg() method
 * - **svg**: Legacy prop for SVG content (for backward compatibility)
 * 
 * @param props - Component properties including src, content, or svg
 * @returns A reactive SVG component
 * @example
 * ```typescript
 * // Load from URL
 * const svgFromUrl = Svg({ src: "/assets/logo.svg" });
 * 
 * // Direct content
 * const svgFromContent = Svg({ 
 *   content: `<svg viewBox="0 0 100 100">
 *     <circle cx="50" cy="50" r="40" fill="blue"/>
 *   </svg>` 
 * });
 * 
 * // Legacy usage
 * const svgLegacy = Svg({ svg: "<svg>...</svg>" });
 * ```
 */
export function Svg(props: SvgProps) {
  return Graphics({
    draw: async (g) => {
      if (props.src) {
        // Load SVG from source URL with graphics context parsing
        const svgData = await Assets.load({
          src: props.src,
          data: {
            parseAsGraphicsContext: true,
          },
        });
        
        // Apply the loaded graphics context
        const graphics = new PixiGraphics(svgData);
        g.context = graphics.context;
      } else if (props.content) {
        // Render SVG directly from content string
        g.svg(props.content);
      } else if (props.svg) {
        // Legacy prop support
        g.svg(props.svg);
      }
    },
    ...props
  })
}
