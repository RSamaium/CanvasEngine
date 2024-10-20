import { effect } from "@signe/reactive";
import { Graphics as PixiGraphics } from "pixi.js";
import { createComponent, registerComponent } from "../engine/reactive";
import { DisplayObject } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";
import { useProps } from "../hooks/useProps";

interface GraphicsProps extends DisplayObjectProps {
  draw?: (graphics: PixiGraphics) => void;
}

interface RectProps extends DisplayObjectProps {
  width: number;
  height: number;
  color: string;
}

interface CircleProps extends DisplayObjectProps {
  radius: number;
  color: string;
}

interface EllipseProps extends DisplayObjectProps {
  width: number;
  height: number;
  color: string;
}

interface TriangleProps extends DisplayObjectProps {
  base: number;
  height: number;
  color: string;
}

class CanvasGraphics extends DisplayObject(PixiGraphics) {
  onInit(props: GraphicsProps) {
    super.onInit(props);
    if (props.draw) {
      effect(() => {
        this.clear();
        props.draw?.(this);
      });
    }
  }
}

interface CanvasGraphics extends PixiGraphics {}

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

function drawShape(g: PixiGraphics, shape: 'circle' | 'ellipse', props: CircleProps | EllipseProps) {
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
