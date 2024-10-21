import { effect, signal } from "@signe/reactive";
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
  class?: SignalOrPrimitive<string>;
}

export const Canvas: ComponentFunction<CanvasProps> = async (props = {}) => {
  let { cursorStyles, width, height, class: className } = useProps(props);
  const Yoga = await loadYoga();

  if (!props.width) width = signal<Size>(800)
  if (!props.height) height = signal<Size>(600)

  const renderer = await autoDetectRenderer({
    ...props,
    width: width?.(),
    height: height?.(),
  });

  const canvasSize = signal({
    width: renderer.width,
    height: renderer.height,
  });

  props.isRoot = true;
  const options: CanvasProps = {
    ...props,
    context: {
      Yoga,
      renderer,
      canvasSize,
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

  canvasElement.render = (rootElement: HTMLElement) => {
    const canvasEl = renderer.view.canvas;

    (globalThis as any).__PIXI_STAGE__ = canvasElement.componentInstance;
    (globalThis as any).__PIXI_RENDERER__ = renderer;

    if (props.tickStart !== false) canvasElement.directives.tick.start()

    effect(() => {
      canvasElement.propObservables!.tick();
      renderer.render(canvasElement.componentInstance as any);
    });

    if (cursorStyles) {
      effect(() => {
        renderer.events.cursorStyles = cursorStyles();
      });
    }

    if (className) {
      effect(() => {
        canvasEl.classList.add(className());
      });
    }

    const resizeCanvas = async () => {
      let w, h;
      if (width?.() === "100%" && height?.() === "100%") {
        const parent = canvasEl.parentElement;
        w = parent ? parent.clientWidth : window.innerWidth;
        h = parent ? parent.clientHeight : window.innerHeight;
      } else {
        w = width?.() ?? canvasEl.offsetWidth;
        h = height?.() ?? canvasEl.offsetHeight;
      }
      renderer.resize(w, h);
      canvasSize.set({ width: w, height: h });
      canvasElement.componentInstance.setWidth(w)
      canvasElement.componentInstance.setHeight(h)
    };

    // Listen for window resize events
    window.addEventListener("resize", resizeCanvas);

    // Check if a canvas already exists in the rootElement
    const existingCanvas = rootElement.querySelector('canvas');
    if (existingCanvas) {
      // If it exists, replace it with the new canvas
      rootElement.replaceChild(canvasEl, existingCanvas);
    } else {
      // If it doesn't exist, append the new canvas
      rootElement.appendChild(canvasEl);
    }

     // Initial resize
     resizeCanvas();
  };

  return canvasElement;
};
