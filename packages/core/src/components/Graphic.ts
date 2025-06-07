import { Effect, effect, Signal } from "@signe/reactive";
import { Assets, Graphics as PixiGraphics } from "pixi.js";
import { createComponent, Element, registerComponent } from "../engine/reactive";
import { ComponentInstance, DisplayObject } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";
import { useProps } from "../hooks/useProps";
import { SignalOrPrimitive } from "./types";

interface GraphicsProps extends DisplayObjectProps {
  draw?: (graphics: PixiGraphics) => void;
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
  onInit(props) {
    super.onInit(props);
    if (props.draw) {
      this.clearEffect = effect(() => {
        this.clear?.();
        props.draw?.(this);
      });
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
      this.clearEffect.subscription.unsubscribe();
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
  const { width, height, color, borderRadius, border } = useProps(props, {
    borderRadius: null,
    border: null
  })
  return Graphics({
    draw: (g) => {
      if (borderRadius()) {
        g.roundRect(0, 0, width(), height(), borderRadius());
      } else {
        g.rect(0, 0, width(), height());
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
  width: Signal<number>;
  height: Signal<number>;
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
    draw: (g) => drawShape(g, 'ellipse', { width, height, color, border }),
    ...props
  })
}

export function Triangle(props: TriangleProps) {
  const { width, height, color, border } = useProps(props, {
    border: null,
    color: '#000'
  })
  return Graphics({
    draw: (g) => {
      g.moveTo(0, height());
      g.lineTo(width() / 2, 0);
      g.lineTo(width(), height());
      g.lineTo(0, height());
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