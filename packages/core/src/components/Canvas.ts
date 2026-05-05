import { effect, Signal, signal } from "@signe/reactive";
import { Application, Container } from "pixi.js";
import {
  Props,
  createComponent,
  registerComponent,
  Element,
} from "../engine/reactive";
import { useProps } from "../hooks/useProps";
import { ComponentInstance, DisplayObject } from "./DisplayObject";
import { ComponentFunction } from "../engine/signal";
import { SignalOrPrimitive } from "./types";
import { Size } from "./types/DisplayObject";
import { Scheduler, Tick } from "../directives/Scheduler";
import { GlobalAssetLoader } from "../utils/GlobalAssetLoader";

interface CanvasElement extends Element<ComponentInstance> {
  render: (rootElement: HTMLElement, app?: Application) => void;
  directives: {
    tick: Scheduler;
  };
  propObservables: {
    tick: Signal<Tick>;
  };
}

registerComponent("Canvas", class Canvas extends DisplayObject(Container) { });

export interface CanvasProps extends Props {
  cursorStyles?: () => any;
  width?: SignalOrPrimitive<Size>;
  height?: SignalOrPrimitive<Size>;
  canvasEl?: HTMLElement;
  selector?: string;
  isRoot?: boolean;
  tick?: any;
  class?: SignalOrPrimitive<string>;
  background?: string;
}

export const Canvas: ComponentFunction<CanvasProps> = async (props = {}) => {
  let { cursorStyles, width, height, class: className } = useProps(props);

  if (!props.width) width = signal<Size>(800);
  if (!props.height) height = signal<Size>(600);

  const canvasSize = signal({
    width: 0,
    height: 0,
  });

  props.isRoot = true;
  const globalLoader = new GlobalAssetLoader();
  const options: CanvasProps = {
    ...props,
    context: {
      canvasSize,
      app: signal(null),
      globalLoader,
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
  } else {
    options.context!.tick = props.tick;
  }

  // Register the tick signal globally so animatedSignal can use it by default
  (globalThis as any).__CANVAS_ENGINE_TICK__ = options.context!.tick;

  const canvasElement = createComponent("Canvas", options) as CanvasElement;

  canvasElement.render = (rootElement: HTMLElement, app?: Application) => {
    if (!app) {
      return;
    }

    const renderer = app.renderer;
    const canvasEl = renderer.view.canvas as HTMLCanvasElement;

    (globalThis as any).__PIXI_STAGE__ = canvasElement.componentInstance;
    (globalThis as any).__PIXI_RENDERER__ = renderer;

    if (props.tickStart !== false) canvasElement.directives.tick.start()

    const renderEffect = effect(() => {
      canvasElement.propObservables!.tick();
      renderer.render(canvasElement.componentInstance as any);
    });

    app.stage = canvasElement.componentInstance as any;

    app.stage.layout = {
      width: app.screen.width,
      height: app.screen.height,
      justifyContent: props.justifyContent,
      alignItems: props.alignItems,
    };

    canvasSize.set({ width: app.screen.width, height: app.screen.height })

    const resizeHandler = (width: number, height: number) => {
      canvasSize.set({ width, height });

      if (app.stage.layout) {
        app.stage.layout = {
          width,
          height
        }
      }
    };

    app.renderer.on('resize', resizeHandler);

    if (props.tickStart !== false) canvasElement.directives.tick.start();

    const tickerHandler = () => {
      canvasElement.propObservables!.tick();
    };

    app.ticker.add(tickerHandler);

    let cursorEffect: any;
    if (cursorStyles) {
      cursorEffect = effect(() => {
        renderer.events.cursorStyles = cursorStyles();
      });
    }

    let classEffect: any;
    if (className) {
      classEffect = effect(() => {
        canvasEl.classList.add(className());
      });
    }

    const existingCanvas = rootElement.querySelector("canvas");
    if (existingCanvas && existingCanvas !== canvasEl) {
      rootElement.replaceChild(canvasEl, existingCanvas);
    } else if (!existingCanvas) {
      rootElement.appendChild(canvasEl);
    }

    canvasElement.effectUnmounts.push(() => {
      renderEffect?.subscription?.unsubscribe?.();
      cursorEffect?.subscription?.unsubscribe?.();
      classEffect?.subscription?.unsubscribe?.();
      app.ticker.remove(tickerHandler);
      app.renderer.off?.('resize', resizeHandler);
      canvasElement.directives.tick?.stop();
    });

    options.context!.app.set(app)
  };

  return canvasElement;
};
