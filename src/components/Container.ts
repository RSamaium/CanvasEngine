import { Container as PixiContainer } from "pixi.js";
import { createComponent, registerComponent } from "../engine/reactive";
import { DisplayObject } from "./DisplayObject";
import { ComponentFunction } from "../engine/signal";
import { DisplayObjectProps } from "./types/DisplayObject";

export class CanvasContainer extends DisplayObject(PixiContainer) {
  // layer = new Layer()
  /*onMount(element: Element) {
        super.onMount(element)
        const { rootElement } = element.props.context
        rootElement.componentInstance.addChild(this.layer)
    }

    onUpdate(props) {
        super.onUpdate(props)
        if (props.sortableChildren != undefined) {
            //this.layer.group.enableSort = props.sortableChildren
        }
    }*/
}

export interface CanvasContainer extends DisplayObjectProps {}

registerComponent("Container", CanvasContainer);

export const Container: ComponentFunction<DisplayObjectProps> = (props) => {
  return createComponent("Container", props);
};
