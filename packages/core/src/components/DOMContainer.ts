import { DOMContainer as PixiDOMContainer } from "pixi.js";
import { effect } from "@signe/reactive";
import {
  createComponent,
  Element,
  isElement,
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
  private static readonly DOM_ROUTING_MAP: Record<string, string> = {
    Sprite: "DOMSprite",
  };
  private static readonly DOM_ALLOWED_TAGS = new Set([
    "DOMContainer",
    "DOMElement",
    "DOMSprite",
  ]);
  private static readonly DOM_UNSUPPORTED_TAGS = new Set([
    "Canvas",
    "Container",
    "Graphics",
    "Rect",
    "Circle",
    "Ellipse",
    "Triangle",
    "Svg",
    "Mesh",
    "Scene",
    "ParticlesEmitter",
    "Sprite",
    "Video",
    "Text",
    "TilingSprite",
    "Viewport",
    "NineSliceSprite",
    "Button",
    "Joystick",
    "FocusContainer",
  ]);

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

  private routeDomChildren(children: any): any {
    if (!children) return children;
    if (Array.isArray(children)) {
      return children.map((child) => this.routeDomChildren(child));
    }
    if (isElement(children)) {
      if (CanvasDOMContainer.DOM_ALLOWED_TAGS.has(children.tag)) {
        return children;
      }
      const routedTag = CanvasDOMContainer.DOM_ROUTING_MAP[children.tag];
      if (routedTag) {
        children.propSubscriptions?.forEach((sub) => sub.unsubscribe());
        children.effectSubscriptions?.forEach((sub) => sub.unsubscribe());
        children.effectUnmounts?.forEach((fn) => fn?.());
        const routedProps = children.propObservables ?? children.props;
        return createComponent(routedTag, routedProps);
      }
      if (CanvasDOMContainer.DOM_UNSUPPORTED_TAGS.has(children.tag)) {
        throw new Error(
          `Component ${children.tag} is not implemented for DOMContainer context yet. Only Sprite is supported.`
        );
      }
      if (children.props?.children) {
        children.props.children = this.routeDomChildren(children.props.children);
      }
      return children;
    }
    return children;
  }

  onInit(props: any) {
    // Handle internal _scopeClass prop for scoped CSS
    const scopeClass = props._scopeClass;
    let divProps: any = { element: "div" };
    const divAttrs = { ...(props.attrs || {}) };

    const mergeScopeClass = (classValue: any) => {
      if (!scopeClass) return classValue;
      if (classValue == null) return scopeClass;
      if (typeof classValue === "string") {
        return `${scopeClass} ${classValue}`;
      }
      if (Array.isArray(classValue)) {
        return [scopeClass, ...classValue];
      }
      if (typeof classValue === "object") {
        if ("items" in classValue) {
          const itemsValue = (classValue as any).items;
          return { ...classValue, items: [scopeClass, itemsValue] };
        }
        if ("value" in classValue) {
          const valueValue = (classValue as any).value;
          return { ...classValue, value: [scopeClass, valueValue] };
        }
        return { [scopeClass]: true, ...classValue };
      }
      return [scopeClass, classValue];
    };

    if (props.class !== undefined) {
      if (divAttrs.class) {
        divAttrs.class = [props.class, divAttrs.class];
      } else {
        divAttrs.class = props.class;
      }
    }

    if (props.style !== undefined) {
      if (
        typeof divAttrs.style === "object"
        && divAttrs.style !== null
        && typeof props.style === "object"
        && props.style !== null
      ) {
        divAttrs.style = { ...divAttrs.style, ...props.style };
      } else if (divAttrs.style === undefined) {
        divAttrs.style = props.style;
      } else if (typeof divAttrs.style === "string" && typeof props.style === "string") {
        divAttrs.style = `${divAttrs.style}; ${props.style}`;
      } else {
        divAttrs.style = props.style;
      }
    }

    if (props.zIndex !== undefined) {
      if (typeof divAttrs.style === "object" && divAttrs.style !== null) {
        divAttrs.style = { ...divAttrs.style, zIndex: props.zIndex };
      } else if (typeof divAttrs.style === "string") {
        divAttrs.style = `${divAttrs.style}; z-index: ${props.zIndex}`;
      } else {
        divAttrs.style = { zIndex: props.zIndex };
      }
    }

    if (scopeClass) {
      // Merge scope class with existing attrs.class
      divProps.attrs = { ...divAttrs };
      divProps.attrs.class = mergeScopeClass(divProps.attrs.class);
    } else if (Object.keys(divAttrs).length > 0) {
      divProps.attrs = divAttrs;
    }

    const routedChildren = this.routeDomChildren(props.children);
    props.children = routedChildren;
    const div = h(DOMElement, divProps, routedChildren) as unknown as Element<CanvasDOMElement>;
    this.element = div.componentInstance.element;
  }

  async onMount(element: Element<any>, index?: number) {
    await super.onMount(element, index);
    this.syncCanvasSizeEffect();
    this.applyElementSize();
  }

  onUpdate(props: any) {
    super.onUpdate(props);
    this.syncCanvasSizeEffect();
    this.applyElementSize();
  }

  onLayoutComputed() {
    this.applyElementSize();
  }

  async onDestroy(parent: Element<any>, afterDestroy?: () => void) {
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
