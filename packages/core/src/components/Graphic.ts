import { Effect, effect, isSignal, signal, Signal, WritableSignal } from "@signe/reactive";
import { Assets, ObservablePoint, Graphics as PixiGraphics } from "pixi.js";
import { createComponent, Element, registerComponent } from "../engine/reactive";
import { ComponentInstance, DisplayObject } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";
import { useProps } from "../hooks/useProps";
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

class CanvasGraphics extends DisplayObject(PixiGraphics) {
  clearEffect: Effect;
  _width: WritableSignal<number>;
  _height: WritableSignal<number>;

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
  async onInit(props) {
    await super.onInit(props);
    this.setObjectFit('none');
  }

  /**
   * Called when the component is mounted to the scene graph.
   * Creates the reactive effect for drawing using the original signals from propObservables.
   * @param {Element<DisplayObject>} element - The element being mounted with props and propObservables.
   * @param {number} [index] - The index of the component among its siblings.
   */
  async onMount(element: Element<any>, index?: number): Promise<void> {
    await super.onMount(element, index);
    const { props, propObservables } = element;
    
    // Use original signals from propObservables if available, otherwise create new ones
    const width = (isSignal(propObservables?.width) ? propObservables.width : signal(props.width || 0)) as WritableSignal<number>;
    const height = (isSignal(propObservables?.height) ? propObservables.height : signal(props.height || 0)) as WritableSignal<number>;
    const anchor = (isSignal(propObservables?.anchor) ? propObservables.anchor : signal(props.anchor || [0, 0])) as WritableSignal<[number, number]>;

    // Store as class properties for access in other methods
    this._width = width;
    this._height = height;
    
    // Check if width or height are percentages to set display flex
    const isWidthPercentage = isPercent(width());
    const isHeightPercentage = isPercent(height());
    
    if (props.draw) {
      this.clearEffect = effect(() => {
        const w = width();
        const h = height();
        const a = anchor();
        if (typeof w == 'string' || typeof h == 'string') {
          return
        }
        this.clear();
        props.draw?.(this, w, h, a);
        this.subjectInit.next(this)
      });
    }

    this.on('layout', (event) => {
      const layoutBox = event.computedLayout;
      // Update width if it's a percentage and value has changed
      if (isWidthPercentage && isSignal(width) && width() !== layoutBox.width) {
        width.set(layoutBox.width);
      }
      
      // Update height if it's a percentage and value has changed
      if (isHeightPercentage && isSignal(height) && height() !== layoutBox.height) {
        height.set(layoutBox.height);
      }
    });
  }

  /**
   * Called when component props are updated.
   * Updates the internal width and height signals when props change.
   * @param props - Updated properties
   */
  onUpdate(props: any) {
    super.onUpdate(props);

    // Update width signal if width prop changed and value is different
    if (props.width !== undefined && this._width && this._width() !== props.width) {
      this._width.set(props.width);
    }
    
    // Update height signal if height prop changed and value is different
    if (props.height !== undefined && this._height && this._height() !== props.height) {
      this._height.set(props.height);
    }
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

const propValue = (value: any) => isSignal(value) ? value() : value;

export function Rect(props: RectProps) {
  const { color, borderRadius, border } = useProps(props, {
    borderRadius: null,
    border: null
  })

  return Graphics({
    draw: (g, width, height, anchor) => {
      const { x, y } = graphicsAnchor(anchor, width, height);
      if (borderRadius()) {
        g.roundRect(x, y, width, height, borderRadius());
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
  const { color, border, radius } = useProps(props, {
    border: null,
    radius: null
  })
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
  return Circle(props as CircleProps);
}

export function Triangle(props: TriangleProps) {
  const { color, border } = useProps(props, {
    border: null,
    color: '#000'
  })
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
