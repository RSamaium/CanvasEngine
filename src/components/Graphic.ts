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
      if (border()) {
        g.stroke(border());
      }
      g.fill(color());
    },
    ...props
  })
}

export function Circle(props: CircleProps) {  
  const { radius, color, border } = useProps(props, {
    border: null
  })
  return Graphics({
    draw: (g) => {
      g.circle(0, 0, radius())
      if (border()) {
        g.stroke(border());
      }
      g.fill(color());
    },
    ...props
  })
}
