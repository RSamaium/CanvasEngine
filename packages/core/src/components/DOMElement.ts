import { DOMContainer as PixiDOMContainer } from "pixi.js";
import {
  createComponent,
  Element,
  registerComponent,
} from "../engine/reactive";
import { ComponentInstance, DisplayObject, OnHook } from "./DisplayObject";
import { ComponentFunction } from "../engine/signal";
import { DisplayObjectProps } from "./types/DisplayObject";
import { isObservable } from "../engine/utils";

interface DOMContainerProps extends DisplayObjectProps {
  element:
    | string
    | {
        value: HTMLElement;
      };
  textContent?: string;
  attrs?: Record<string, any> & {
    class?:
      | string
      | string[]
      | Record<string, boolean>
      | { items?: string[] }
      | { value?: string | string[] | Record<string, boolean> };
    style?:
      | string
      | Record<string, string | number>
      | { value?: string | Record<string, string | number> };
  };
  onBeforeDestroy?: OnHook;
}

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

export class CanvasDOMElement {
  public element: HTMLElement;
  private eventListeners: Map<string, (e: Event) => void> = new Map();
  private onBeforeDestroy: OnHook | null = null;

  onInit(props: DOMContainerProps) {
    if (typeof props.element === "string") {
      this.element = document.createElement(props.element);
    } else {
      this.element = props.element.value;
    }
    if (props.onBeforeDestroy || props["on-before-destroy"]) {
      this.onBeforeDestroy =
        props.onBeforeDestroy || props["on-before-destroy"];
    }
    for (const event of EVENTS) {
      if (props.attrs?.[event]) {
        const eventHandler = (e: Event) => {
          props.attrs[event]?.(e);
        };
        this.eventListeners.set(event, eventHandler);
        this.element.addEventListener(event, eventHandler, false);
      }
    }
    if (props.children) {
      for (const child of props.children) {
        if (isObservable(child)) {
          child.subscribe(({ elements }) => {
            for (const element of elements) {
              this.element.appendChild(element.componentInstance.element);
            }
          });
        } else {
          this.element.appendChild(child.componentInstance.element);
        }
      }
    }
    this.onUpdate(props);
  }

  onUpdate(props: DOMContainerProps) {
    if (!this.element) return;
    for (const [key, value] of Object.entries(props.attrs || {})) {
      if (key === "class") {
        const classList = value.items || value.value || value;

        // Clear existing classes first
        this.element.className = "";

        if (typeof classList === "string") {
          // String: space-separated class names
          this.element.className = classList;
        } else if (Array.isArray(classList)) {
          // Array: array of class names
          this.element.classList.add(...classList);
        } else if (typeof classList === "object" && classList !== null) {
          // Object: { className: boolean }
          for (const [className, shouldAdd] of Object.entries(classList)) {
            if (shouldAdd) {
              this.element.classList.add(className);
            }
          }
        }
      } else if (key === "style") {
        const styleValue = value.items || value.value || value;

        if (typeof styleValue === "string") {
          // String: CSS style string
          this.element.setAttribute("style", styleValue);
        } else if (typeof styleValue === "object" && styleValue !== null) {
          // Object: { property: value }
          for (const [styleProp, styleVal] of Object.entries(styleValue)) {
            if (styleVal !== null && styleVal !== undefined) {
              (this.element.style as any)[styleProp] = styleVal;
            }
          }
        }
      } else if (!EVENTS.includes(key)) {
        this.element.setAttribute(key, value);
      }
    }
    if (props.textContent) {
      this.element.textContent = props.textContent;
    }
  }

  async onDestroy(
    parent: Element<CanvasDOMElement>,
    afterDestroy: () => void
  ): Promise<void> {
    // Remove all event listeners from the DOM element

    if (this.element) {
      this.eventListeners.clear();

      if (this.onBeforeDestroy) {
        await this.onBeforeDestroy();
      }

      for (const [event, handler] of this.eventListeners) {
        this.element.removeEventListener(event, handler, false);
      }

      this.element.remove();

      if (afterDestroy) {
        afterDestroy();
      }
    }
  }
}

export interface CanvasDOMElement extends DisplayObjectProps {}

registerComponent("DOMElement", CanvasDOMElement);

export const DOMElement: ComponentFunction<DOMContainerProps> = (props) => {
  return createComponent("DOMElement", props);
};
