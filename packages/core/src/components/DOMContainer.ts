import { DOMContainer as PixiDOMContainer } from "pixi.js";
import { effect } from "@signe/reactive";
import {
  createComponent,
  Element,
  registerComponent,
} from "../engine/reactive";
import { ComponentInstance, DisplayObject } from "./DisplayObject";
import { ComponentFunction, h } from "../engine/signal";
import { DisplayObjectProps } from "./types/DisplayObject";
import { CanvasDOMElement, DOMElement } from "./DOMElement";
import { isPercent } from "../utils/functions";


/**
 * DOMContainer class for managing DOM elements within the canvas engine
 *
 * This class extends the DisplayObject functionality to handle DOM elements using
 * PixiJS's native DOMContainer. It provides a bridge between the canvas rendering
 * system and traditional DOM manipulation with proper transform hierarchy and visibility.
 *
 * The DOMContainer is especially useful for rendering standard DOM elements that handle
 * user input, such as `<input>` or `<textarea>`. This is often simpler and more flexible
 * than trying to implement text input directly in PixiJS.
 *
 * @example
 * ```typescript
 * // Basic usage with input element
 * const element = document.createElement('input');
 * element.type = 'text';
 * element.placeholder = 'Enter text...';
 *
 * const domContainer = new DOMContainer({
 *   element,
 *   x: 100,
 *   y: 50,
 *   anchor: { x: 0.5, y: 0.5 }
 * });
 *
 * // Using different class and style formats
 * const containerWithClasses = new DOMContainer({
 *   element: 'div',
 *   attrs: {
 *     // String format: space-separated classes
 *     class: 'container primary-theme',
 *
 *     // Array format: array of class names
 *     // class: ['container', 'primary-theme'],
 *
 *     // Object format: conditional classes
 *     // class: {
 *     //   'container': true,
 *     //   'primary-theme': true,
 *     //   'disabled': false
 *     // }
 *
 *     // String format: CSS style string
 *     style: 'background-color: red; padding: 10px;',
 *
 *     // Object format: style properties
 *     // style: {
 *     //   backgroundColor: 'red',
 *     //   padding: '10px',
 *     //   fontSize: 16
 *     // }
 *   }
 * });
 * ```
 */
const EVENTS = [
  "click",
  "mouseover",
  "mouseout",
  "mouseenter",
  "mouseleave",
  "mousemove",
  "mouseup",
  "mousedown",
  "touchstart",
  "touchend",
  "touchmove",
  "touchcancel",
  "wheel",
  "scroll",
  "resize",
  "focus",
  "blur",
  "change",
  "input",
  "submit",
  "reset",
  "keydown",
  "keyup",
  "keypress",
  "contextmenu",
  "drag",
  "dragend",
  "dragenter",
  "dragleave",
  "dragover",
  "drop",
  "dragstart",
  "select",
  "selectstart",
  "selectend",
  "selectall",
  "selectnone",
];

export class CanvasDOMContainer extends DisplayObject(PixiDOMContainer) {
  disableLayout = true;
  private canvasSizeEffect: any = null;

  private hasDomContainerAncestor(): boolean {
    const element = this.getElement();
    let parent = element?.parent;
    while (parent) {
      if (parent.tag === "DOMContainer") return true;
      parent = parent.parent;
    }
    return false;
  }

  private getPercentRatio(value: string): number | null {
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed)) return null;
    return parsed / 100;
  }

  private getCanvasSize() {
    const canvasSize = this.fullProps?.context?.canvasSize;
    return typeof canvasSize === "function" ? canvasSize() : canvasSize;
  }

  private shouldUseCanvasPercent(): boolean {
    const widthProp = this.fullProps?.width;
    const heightProp = this.fullProps?.height;
    if (!isPercent(widthProp) && !isPercent(heightProp)) return false;
    return !this.hasDomContainerAncestor();
  }

  private syncCanvasSizeEffect() {
    const shouldTrack = this.shouldUseCanvasPercent();
    if (shouldTrack && !this.canvasSizeEffect) {
      const canvasSize = this.fullProps?.context?.canvasSize;
      if (typeof canvasSize === "function") {
        this.canvasSizeEffect = effect(() => {
          canvasSize();
          this.applyElementSize();
        });
      }
    } else if (!shouldTrack && this.canvasSizeEffect) {
      this.canvasSizeEffect.subscription?.unsubscribe();
      this.canvasSizeEffect = null;
    }
  }

  private applyElementSize() {
    if (!this.element) return;
    const widthProp = this.fullProps?.width;
    const heightProp = this.fullProps?.height;
    const useCanvasSize = this.shouldUseCanvasPercent();
    const canvasSize = useCanvasSize ? this.getCanvasSize() : null;

    if (widthProp !== undefined) {
      if (isPercent(widthProp)) {
        if (useCanvasSize) {
          const ratio = this.getPercentRatio(widthProp);
          if (ratio !== null) {
            const baseWidth = (canvasSize?.width !== undefined)
              ? canvasSize.width
              : this.getWidth();
            this.element.style.width = `${baseWidth * ratio}px`;
          }
        } else {
          this.element.style.width = widthProp;
        }
      } else if (typeof widthProp === "number") {
        this.element.style.width = `${widthProp}px`;
      } else if (typeof widthProp === "string") {
        this.element.style.width = widthProp;
      }
    }

    if (heightProp !== undefined) {
      if (isPercent(heightProp)) {
        if (useCanvasSize) {
          const ratio = this.getPercentRatio(heightProp);
          if (ratio !== null) {
            const baseHeight = (canvasSize?.height !== undefined)
              ? canvasSize.height
              : this.getHeight();
            this.element.style.height = `${baseHeight * ratio}px`;
          }
        } else {
          this.element.style.height = heightProp;
        }
      } else if (typeof heightProp === "number") {
        this.element.style.height = `${heightProp}px`;
      } else if (typeof heightProp === "string") {
        this.element.style.height = heightProp;
      }
    }
  }

  onInit(props: any) {
    // Handle internal _scopeClass prop for scoped CSS
    const scopeClass = props._scopeClass;
    let divProps: any = { element: "div" };

    if (scopeClass) {
      // Merge scope class with existing attrs.class
      divProps.attrs = { ...props.attrs };
      if (divProps.attrs.class) {
        // If class exists, merge it with scope class
        if (typeof divProps.attrs.class === 'string') {
          divProps.attrs.class = `${scopeClass} ${divProps.attrs.class}`;
        } else if (Array.isArray(divProps.attrs.class)) {
          divProps.attrs.class = [scopeClass, ...divProps.attrs.class];
        } else if (typeof divProps.attrs.class === 'object') {
          // For object format, add scope class as true
          divProps.attrs.class = { [scopeClass]: true, ...divProps.attrs.class };
        }
      } else {
        // No existing class, just add scope class
        divProps.attrs.class = scopeClass;
      }
    } else if (props.attrs) {
      divProps.attrs = props.attrs;
    }

    const div = h(DOMElement, divProps, props.children) as unknown as Element<CanvasDOMElement>;
    this.element = div.componentInstance.element;
  }

  async onMount(element: Element<DisplayObject>, index?: number) {
    await super.onMount(element, index);
    this.syncCanvasSizeEffect();
    this.applyElementSize();
  }

  onUpdate(props: any) {
    super.onUpdate(props);
    this.syncCanvasSizeEffect();
    this.applyElementSize();
  }

  protected onLayoutComputed() {
    this.applyElementSize();
  }

  async onDestroy(parent: Element<DisplayObject>, afterDestroy?: () => void) {
    const _afterDestroy = () => {
      if (this.canvasSizeEffect) {
        this.canvasSizeEffect.subscription?.unsubscribe();
        this.canvasSizeEffect = null;
      }
      if (afterDestroy) afterDestroy();
    };
    await super.onDestroy(parent, _afterDestroy);
  }
}

export interface CanvasDOMContainer extends DisplayObjectProps { }

registerComponent("DOMContainer", CanvasDOMContainer);

export const DOMContainer: ComponentFunction<any> = (props) => {
  return createComponent("DOMContainer", props);
};
