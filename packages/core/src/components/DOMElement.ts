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
import { isSignal } from "@signe/reactive";

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
 * ## Form Elements with Reactive Signals
 *
 * For form elements (`input`, `textarea`, `select`), the component supports reactive
 * two-way data binding using signals. When the `value` attribute is a signal, the
 * component automatically:
 * - Sets the initial value from the signal
 * - Listens for `input` events and updates the signal with the new value
 * - Updates the DOM element when the signal value changes programmatically
 *
 * ## Form Submission Handling
 *
 * When a `form` element has a `submit` event handler, the component automatically:
 * - Prevents the default form submission behavior (stops propagation)
 * - Collects all form data from input elements within the form
 * - Passes both the event and the collected form data as parameters to the submit handler
 * - Handles multiple values for the same field name (e.g., checkboxes with same name)
 *
 * @example
 * ```typescript
 * import { signal } from '@signe/reactive';
 *
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
 * // Reactive form input with signal
 * const inputValue = signal('');
 *
 * const reactiveInput = new DOMContainer({
 *   element: 'input',
 *   attrs: {
 *     type: 'text',
 *     placeholder: 'Type something...',
 *     value: inputValue // Signal for two-way binding
 *   }
 * });
 *
 * // The signal will automatically update when user types
 * inputValue.subscribe(value => {
 *   console.log('Input value changed:', value);
 * });
 *
 * // You can also update the input programmatically
 * inputValue.set('New value');
 *
 * // Form submission with automatic data collection
 * const loginForm = new DOMContainer({
 *   element: 'form',
 *   attrs: {
 *     submit: (event, formData) => {
 *       // event: the submit event (already prevented)
 *       // formData: object containing all form field values
 *       console.log('Form submitted with data:', formData);
 *       // Example formData: { username: 'john', password: 'secret', remember: 'on' }
 *     }
 *   },
 *   children: [
 *     new DOMContainer({
 *       element: 'input',
 *       attrs: { name: 'username', type: 'text', placeholder: 'Username' }
 *     }),
 *     new DOMContainer({
 *       element: 'input',
 *       attrs: { name: 'password', type: 'password', placeholder: 'Password' }
 *     }),
 *     new DOMContainer({
 *       element: 'input',
 *       attrs: { name: 'remember', type: 'checkbox', value: 'on' }
 *     }),
 *     new DOMContainer({
 *       element: 'button',
 *       attrs: { type: 'submit' },
 *       textContent: 'Login'
 *     })
 *   ]
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
  private valueSignal: any = null;
  private isFormElementType: boolean = false;

  /**
   * Checks if the element is a form element that supports the value attribute
   * @param elementType - The element type string from props
   * @returns true if the element is a form element with value support
   */
  private isFormElement(elementType: string): boolean {
    const formElements = ["input", "textarea", "select"];
    return formElements.includes(elementType.toLowerCase());
  }

  onInit(props: DOMContainerProps) {
    if (typeof props.element === "string") {
      this.element = document.createElement(props.element);
      this.isFormElementType = this.isFormElement(props.element);
    } else {
      this.element = props.element.value;
      this.isFormElementType = this.isFormElement(this.element.tagName);
    }
    if (props.onBeforeDestroy || props["on-before-destroy"]) {
      this.onBeforeDestroy =
        props.onBeforeDestroy || props["on-before-destroy"];
    }

    for (const event of EVENTS) {
      if (props.attrs?.[event]) {
        const eventHandler = (e: Event) => {
          // Special handling for form submit events
          if (event === "submit" && this.element.tagName.toLowerCase() === "form") {
            e.preventDefault(); // Stop form submission propagation
            
            // Collect all form data
            const formData = new FormData(this.element as HTMLFormElement);
            const formObject: Record<string, any> = {};
            
            // Convert FormData to plain object
            formData.forEach((value, key) => {
              if (formObject[key]) {
                // Handle multiple values for same key (like checkboxes)
                if (Array.isArray(formObject[key])) {
                  formObject[key].push(value);
                } else {
                  formObject[key] = [formObject[key], value];
                }
              } else {
                formObject[key] = value;
              }
            });
            
            // Call the event handler with event and form data
            props.attrs[event]?.(e, formObject);
          } else {
            props.attrs[event]?.(e);
          }
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

  onMount(context: Element<CanvasDOMElement>) {
    const props = context.propObservables;
    const attrs = props.attrs as any;
    // Handle form elements with signal value
    if (
      this.isFormElementType &&
      attrs?.value &&
      isSignal(attrs.value)
    ) {
      this.valueSignal = attrs.value;
      // Set initial value from signal
      (
        this.element as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement
      ).value = this.valueSignal();

      // Listen for input events and update the signal
      const inputHandler = (e: Event) => {
        const target = e.target as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement;
        this.valueSignal.set(target.value);
      };

      this.eventListeners.set("input", inputHandler);
      this.element.addEventListener("input", inputHandler, false);
    }
  }

  onUpdate(props: DOMContainerProps) {
    if (!this.element) return;
    for (const [key, value] of Object.entries(props.attrs || {})) {
      if (key === "tabindex") {
        // Handle tabindex attribute
        const tabindexValue = isSignal(value) ? value() : value;
        if (tabindexValue !== undefined && tabindexValue !== null) {
          this.element.setAttribute('tabindex', String(tabindexValue));
        } else {
          this.element.removeAttribute('tabindex');
        }
      } else if (key === "class") {
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
      } else if (key === "value" && this.isFormElementType) {
        // Handle value attribute for form elements
        if (isSignal(value)) {
          // If it's a signal, the value is already handled in onInit
          // Update the DOM element value if the signal value changed
          const currentValue = (
            this.element as
              | HTMLInputElement
              | HTMLTextAreaElement
              | HTMLSelectElement
          ).value;
          const signalValue = value();
          if (currentValue !== signalValue) {
            (
              this.element as
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement
            ).value = signalValue;
          }
        } else {
          // If it's not a signal, set the value directly
          (
            this.element as
              | HTMLInputElement
              | HTMLTextAreaElement
              | HTMLSelectElement
          ).value = value;
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
      if (this.onBeforeDestroy) {
        await this.onBeforeDestroy();
      }

      for (const [event, handler] of this.eventListeners) {
        this.element.removeEventListener(event, handler, false);
      }

      this.eventListeners.clear();

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
