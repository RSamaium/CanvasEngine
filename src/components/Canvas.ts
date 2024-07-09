import { effect, signal } from "@signe/reactive";
import { Container, autoDetectRenderer } from "pixi.js";
import { loadYoga } from "yoga-layout";
import { Props, createComponent, registerComponent } from "../engine/reactive";
import { useProps } from "../hooks/useProps";
import { DisplayObject } from "./DisplayObject";

registerComponent("Canvas", class Canvas extends DisplayObject(Container) {});

export async function Canvas(props: Props = {}) {
  const { cursorStyles, width, height } = useProps(props);
  const Yoga = await loadYoga();
  const renderer = await autoDetectRenderer({
    ...props,
    width: width(),
    height: height(),
  });
  const canvasEl = renderer.view.canvas;

  if (!props.canvasEl && props.selector) {
    const selector =
      document.body.querySelector(props.selector) || document.body;
    selector.insertBefore(canvasEl, selector.firstChild);
    const [canvas] = document.querySelector(props.selector).children;
    canvas.style.position = "absolute";
  } else {
    (props.canvasEl ?? document.body).appendChild(canvasEl);
  }

  props.isRoot = true;
  const options: any = {
    ...props,
    context: {
      Yoga,
      renderer,
    },
    width: width(),
    height: height(),
  };
  if (!props.tick) {
    options.context.tick = options.tick = signal({
      timestamp: 0,
      deltaTime: 0,
      frame: 0,
      deltaRatio: 1,
    });
  }
  const canvasElement = createComponent("Canvas", options);
  globalThis.__PIXI_STAGE__ = canvasElement.componentInstance;
  globalThis.__PIXI_RENDERER__ = renderer;
  effect(() => {
    canvasElement.propObservables!.tick();
    renderer.render(canvasElement.componentInstance as any);
  });

  if (cursorStyles) {
    effect(() => {
      renderer.events.cursorStyles = cursorStyles();
    });
  }
}
