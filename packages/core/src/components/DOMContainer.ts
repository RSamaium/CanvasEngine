import { DOMContainer as PixiDOMContainer } from "pixi.js";
import {
  createComponent,
  Element,
  registerComponent,
} from "../engine/reactive";
import { ComponentInstance, DisplayObject } from "./DisplayObject";
import { ComponentFunction, h } from "../engine/signal";
import { DisplayObjectProps } from "./types/DisplayObject";
import { CanvasDOMElement, DOMElement } from "./DOMElement";


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
}

export interface CanvasDOMContainer extends DisplayObjectProps { }

registerComponent("DOMContainer", CanvasDOMContainer);

export const DOMContainer: ComponentFunction<any> = (props) => {
  return createComponent("DOMContainer", props);
};
