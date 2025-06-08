import '@pixi/layout';
import { Application, ApplicationOptions } from "pixi.js";
import { ComponentFunction, h } from "./signal";
import { useProps } from '../hooks/useProps';

/**
 * Bootstraps a canvas element and renders it to the DOM.
 * 
 * @param rootElement - The HTML element where the canvas will be rendered. Can be null.
 * @param canvas - A Promise that resolves to an Element representing the canvas component.
 * @returns A Promise that resolves to the rendered canvas element.
 * @throws {Error} If the provided element is not a Canvas component.
 */
export const bootstrapCanvas = async (rootElement: HTMLElement | null, canvas: ComponentFunction<any>, options?: ApplicationOptions) => {
  
  const app = new Application();
  await app.init({
    resizeTo: rootElement,
    autoStart: false,
    ...(options ?? {})
  });
  const canvasElement = await h(canvas);
  if (canvasElement.tag != 'Canvas') {
    throw new Error('Canvas is required');
  }
  (canvasElement as any).render(rootElement, app);

  const { backgroundColor } = useProps(canvasElement.props, {
    backgroundColor: 'black'
  });

  app.renderer.background.color = backgroundColor()

  return {
    canvasElement,
    app
  };
};
