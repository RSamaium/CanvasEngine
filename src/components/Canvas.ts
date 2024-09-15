import { effect, Signal, signal } from "@signe/reactive";
import { Container, autoDetectRenderer } from "pixi.js";
import { loadYoga } from "yoga-layout";
import { Props, createComponent, registerComponent } from "../engine/reactive";
import { useProps } from "../hooks/useProps";
import { DisplayObject } from "./DisplayObject";
import { ComponentFunction } from "../engine/signal";
import { SignalOrPrimitive } from "./types";
import { Size } from "./types/DisplayObject";

registerComponent("Canvas", class Canvas extends DisplayObject(Container) {});

export interface CanvasProps extends Props {
  cursorStyles?: () => any;
  width?: SignalOrPrimitive<Size>;
  height?: SignalOrPrimitive<Size>;
  canvasEl?: HTMLElement;
  selector?: string;
  isRoot?: boolean;
  tick?: any;
}

export const Canvas: ComponentFunction<CanvasProps> = async (props = {}) => {
  const { cursorStyles, width, height } = useProps(props);
  const Yoga = await loadYoga();
  const renderer = await autoDetectRenderer({
    ...props,
    width: width?.() ?? 800,
    height: height?.() ?? 600,
  });
  const canvasEl = renderer.view.canvas;

  if (!props.canvasEl && props.selector) {
    const selector =
      document.body.querySelector(props.selector) || document.body;
    selector.insertBefore(canvasEl, selector.firstChild);
    const [canvas] = document.querySelector(props.selector)!.children;
    (canvas as HTMLElement).style.position = "absolute";
  } else {
    (props.canvasEl ?? document.body).appendChild(canvasEl);
  }

  props.isRoot = true;
  const options: CanvasProps = {
    ...props,
    context: {
      Yoga,
      renderer,
    },
    width: width?.(),
    height: height?.(),
  };
  if (!props.tick) {
    options.context!.tick = options.tick = signal({
      timestamp: 0,
      deltaTime: 0,
      frame: 0,
      deltaRatio: 1,
    });
  }
  const canvasElement = createComponent("Canvas", options);
  (globalThis as any).__PIXI_STAGE__ = canvasElement.componentInstance;
  (globalThis as any).__PIXI_RENDERER__ = renderer;

  effect(() => {
    canvasElement.propObservables!.tick();
    renderer.render(canvasElement.componentInstance as any);
  });

  if (cursorStyles) {
    effect(() => {
      renderer.events.cursorStyles = cursorStyles();
    });
  }

  const resizeCanvas = () => {
    let w, h;
    if (width?.() === '100%' && height?.() === '100%') {
      const parent = canvasEl.parentElement;
      w = parent ? parent.clientWidth : window.innerWidth;
      h = parent ? parent.clientHeight : window.innerHeight;
    } else {
      w = width?.() ?? canvasEl.offsetWidth;
      h = height?.() ?? canvasEl.offsetHeight;
    }
    renderer.resize(w, h);
  };

  // Initial resize
  resizeCanvas();

  // Listen for window resize events
  window.addEventListener("resize", resizeCanvas);

  return canvasElement;
};
