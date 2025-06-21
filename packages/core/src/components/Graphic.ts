import { Effect, effect, isSignal, signal, Signal, WritableSignal } from "@signe/reactive";
import { Assets, Graphics as PixiGraphics } from "pixi.js";
import { createComponent, Element, registerComponent } from "../engine/reactive";
import { ComponentInstance, DisplayObject } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";
import { useProps } from "../hooks/useProps";
import { SignalOrPrimitive } from "./types";
import { isPercent } from "../utils/functions";

interface GraphicsProps extends DisplayObjectProps {
  draw?: (graphics: PixiGraphics, width: number, height: number) => void;
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
  width: WritableSignal<number>;
  height: WritableSignal<number>;
  
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
    
    // Store as class properties for access in other methods
    this.width = width;
    this.height = height;
    
    // Check if width or height are percentages to set display flex
    const isWidthPercentage = isPercent(width());
    const isHeightPercentage = isPercent(height());
    
    if (props.draw) {
      this.clearEffect = effect(() => {
        const w = width();
        const h = height();
        if (typeof w == 'string' || typeof h == 'string') {
          return
        }
        this.clear();
        props.draw?.(this, w, h);
        this.subjectInit.next(this)
      });
    }

    this.on('layout', (event) => {
      const layoutBox = event.computedLayout;
      // Update width if it's a percentage
      if (isWidthPercentage && isSignal(width)) {
        width.set(layoutBox.width);
      }
      
      // Update height if it's a percentage
      if (isHeightPercentage && isSignal(height)) {
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
    
    // Update width signal if width prop changed
    if (props.width !== undefined && this.width) {
      if (isSignal(props.width)) {
        // If the new prop is a signal, we need to replace our local signal
        // This shouldn't happen in normal usage, but handle it just in case
        this.width = props.width;
      } else {
        // Update our local signal with the new value
        this.width.set(props.width);
      }
    }
    
    // Update height signal if height prop changed
    if (props.height !== undefined && this.height) {
      if (isSignal(props.height)) {
        // If the new prop is a signal, we need to replace our local signal
        // This shouldn't happen in normal usage, but handle it just in case
        this.height = props.height;
      } else {
        // Update our local signal with the new value
        this.height.set(props.height);
      }
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

export function Rect(props: RectProps) {
  const { color, borderRadius, border } = useProps(props, {
    borderRadius: null,
    border: null
  })

  return Graphics({
    draw: (g, width, height) => {
      if (borderRadius()) {
        g.roundRect(0, 0, width, height, borderRadius());
      } else {
        g.rect(0, 0, width, height);
      }
      if (border) {
        g.stroke(border);
      }
      g.fill(color());
    },
    ...props
  })
}

function drawShape(g: PixiGraphics, shape: 'circle' | 'ellipse', props: {
  radius: Signal<number>;
  color: Signal<string>;
  border: Signal<number>;
} | {
  width: WritableSignal<number>;
  height: WritableSignal<number>;
  color: Signal<string>;
  border: Signal<number>;
}) {
  const { color, border } = props;
  if ('radius' in props) {
    g.circle(0, 0, props.radius());
  } else {
    g.ellipse(0, 0, props.width() / 2, props.height() / 2);
  }
  if (border()) {
    g.stroke(border());
  }
  g.fill(color());
}

export function Circle(props: CircleProps) {  
  const { radius, color, border } = useProps(props, {
    border: null
  })
  return Graphics({
    draw: (g) => drawShape(g, 'circle', { radius, color, border }),
    ...props
  })
}

export function Ellipse(props: EllipseProps) {
  const { width, height, color, border } = useProps(props, {
    border: null
  })
  return Graphics({
    draw: (g, gWidth, gHeight) => drawShape(g, 'ellipse', { width: signal(gWidth), height: signal(gHeight), color, border }),
    ...props
  })
}

export function Triangle(props: TriangleProps) {
  const { width, height, color, border } = useProps(props, {
    border: null,
    color: '#000'
  })
  return Graphics({
    draw: (g, gWidth, gHeight) => {
      g.moveTo(0, gHeight);
      g.lineTo(gWidth / 2, 0);
      g.lineTo(gWidth, gHeight);
      g.lineTo(0, gHeight);
      g.fill(color());
      if (border) {
        g.stroke(border);
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