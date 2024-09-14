import { effect } from "@signe/reactive";
import { Graphics as PixiGraphics } from "pixi.js";
import { createComponent, registerComponent } from "../engine/reactive";
import { DisplayObject } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";

interface GraphicsProps extends DisplayObjectProps {
  draw?: (graphics: PixiGraphics) => void;
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
