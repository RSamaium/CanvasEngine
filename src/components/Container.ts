import { Container as PixiContainer } from "pixi.js";
import { createComponent, registerComponent } from "../engine/reactive";
import { DisplayObject } from "./DisplayObject";
import { ComponentFunction } from "../engine/signal";
import { DisplayObjectProps } from "./types/DisplayObject";
import { setObservablePoint } from "../engine/utils";

interface ContainerProps extends DisplayObjectProps {
  sortableChildren?: boolean;
}

export class CanvasContainer extends DisplayObject(PixiContainer) {
  protected isCustomAnchor = true;
  
  onUpdate(props) {
    if (props.anchor) {
      setObservablePoint(this._anchorPoints, props.anchor);
      props.pivot = [
        this.getWidth() * this._anchorPoints.x,
        this.getHeight() * this._anchorPoints.y
      ]
    }
    super.onUpdate(props);
    if (props.sortableChildren != undefined) {
      this.sortableChildren = props.sortableChildren;
    }
  }
  onMount(args) {
    super.onMount(args);
    const { componentInstance, props } = args;
    const { pixiChildren } = props;
    if (pixiChildren) {
      pixiChildren.forEach((child) => {
        componentInstance.addChild(child);
      });
    }
  }
}

export interface CanvasContainer extends DisplayObjectProps {}

registerComponent("Container", CanvasContainer);

export const Container: ComponentFunction<ContainerProps> = (props) => {
  return createComponent("Container", props);
};
