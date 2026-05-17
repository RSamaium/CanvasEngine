import { Container as PixiContainer, type ContainerChild } from "pixi.js";
import { createComponent, registerComponent } from "../engine/reactive";
import { DisplayObject } from "./DisplayObject";
import { ComponentFunction } from "../engine/signal";
import { DisplayObjectProps } from "./types/DisplayObject";
import { setObservablePoint } from "../engine/utils";
import { isPercent } from "../utils/functions";

export interface ContainerProps extends DisplayObjectProps {
  sortableChildren?: boolean;
  /**
   * Native PixiJS display objects to add to this container when it mounts.
   *
   * This is an escape hatch for rendering PixiJS objects directly inside the
   * CanvasEngine scene graph. CanvasEngine does not manage these children's
   * props or lifecycle; destroy or update them manually when needed.
   */
  pixiChildren?: ContainerChild[];
}

export class CanvasContainer extends DisplayObject(PixiContainer) {
  isCustomAnchor = true;
  
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
  async onMount(args) {
    await super.onMount(args);
    const { componentInstance, props } = args;
    const { pixiChildren } = props;
    if (pixiChildren) {
      pixiChildren.forEach((child) => {
        componentInstance.addChild(child);
      });
    }

    // Listen to layout events to update displayWidth and displayHeight with computed values
    const isWidthPercentage = isPercent(props.width);
    const isHeightPercentage = isPercent(props.height);

    if (isWidthPercentage || isHeightPercentage) {
      this.on('layout', (event) => {
        const layoutBox = event.computedLayout;
        if (isWidthPercentage && layoutBox.width !== undefined) {
          this.displayWidth.set(layoutBox.width);
        }
        if (isHeightPercentage && layoutBox.height !== undefined) {
          this.displayHeight.set(layoutBox.height);
        }
      });
    }
  }
}

export interface CanvasContainer extends DisplayObjectProps {}

registerComponent("Container", CanvasContainer);

export const Container: ComponentFunction<ContainerProps> = (props) => {
  // Ensure component is registered (useful in tests if module cache differs)
  registerComponent("Container", CanvasContainer);
  return createComponent("Container", props);
};
