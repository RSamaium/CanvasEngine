import { ComponentInstance } from "../components/DisplayObject";
import { Element } from "./reactive";
import { h } from "./signal";

export const bootstrapCanvas = async (rootElement: HTMLElement | null, canvas: Promise<Element<ComponentInstance>>) => {
  const canvasElement = await h(canvas);
  if (canvasElement.tag != 'Canvas') {
    throw new Error('Canvas is required');
  }
  canvasElement.render(rootElement);
};