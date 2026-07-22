import { Element, isElement, Props, isElementFrozen } from "../engine/reactive";
import { setObservablePoint } from "../engine/utils";
import type {
  AlignContent,
  AlignItems,
  AlignSelf,
  EdgeSize,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  LayoutBorder,
  ObjectFit,
  ObjectPosition,
  Size,
  TransformOrigin,
} from "./types/DisplayObject";
import { signal } from "@signe/reactive";
import { BlurFilter, ObservablePoint, type Point, type Rectangle } from "pixi.js";
import * as FILTERS from "pixi-filters";
import { isPercent } from "../utils/functions";
import { BehaviorSubject, filter, Subject } from "rxjs";
import {
  hasLayoutContainerProps,
  hasLayoutNodeProps,
  isLayoutBorder,
  normalizeLayoutProps,
  withLayoutSize,
} from "./layout";

export interface ComponentInstance extends PixiMixins.ContainerOptions {
  id?: string;
  children?: ComponentInstance[];
  onInit?(props: Props): void;
  onUpdate?(props: Props): void;
  onDestroy?(parent: Element, afterDestroy: () => void): void;
  onMount?(context: Element<any>, index?: number): void;
  setWidth(width: number): void;
  setHeight(height: number): void;
  getLocalBounds?(): Rectangle;
  getGlobalPosition?(): Point;
}

export const EVENTS = [
  "added",
  "childAdded",
  "childRemoved",
  "click",
  "clickcapture",
  "destroyed",
  "globalmousemove",
  "globalpointermove",
  "globaltouchmove",
  "mousedown",
  "mousedowncapture",
  "mouseenter",
  "mouseentercapture",
  "mouseleave",
  "mouseleavecapture",
  "mousemove",
  "mousemovecapture",
  "mouseout",
  "mouseoutcapture",
  "mouseover",
  "mouseovercapture",
  "mouseup",
  "mouseupcapture",
  "mouseupoutside",
  "mouseupoutsidecapture",
  "pointercancel",
  "pointercancelcapture",
  "pointerdown",
  "pointerdowncapture",
  "pointerenter",
  "pointerentercapture",
  "pointerleave",
  "pointerleavecapture",
  "pointermove",
  "pointermovecapture",
  "pointerout",
  "pointeroutcapture",
  "pointerover",
  "pointerovercapture",
  "pointertap",
  "pointertapcapture",
  "pointerup",
  "pointerupcapture",
  "pointerupoutside",
  "pointerupoutsidecapture",
  "removed",
  "rightclick",
  "rightclickcapture",
  "rightdown",
  "rightdowncapture",
  "rightup",
  "rightupcapture",
  "rightupoutside",
  "rightupoutsidecapture",
  "tap",
  "tapcapture",
  "touchcancel",
  "touchcancelcapture",
  "touchend",
  "touchendcapture",
  "touchendoutside",
  "touchendoutsidecapture",
  "touchmove",
  "touchmovecapture",
  "touchstart",
  "touchstartcapture",
  "wheel",
  "wheelcapture",
];

export type OnHook = (() => void) | (() => Promise<void> | void);

export function DisplayObject(extendClass): any {
  return class DisplayObject extends extendClass {
    #canvasContext: {
      [key: string]: any;
    } | null = null;
    isFlex: boolean = false;
    isLayoutContainer: boolean = false;
    fullProps: Props = {};
    isMounted: boolean = false;
    _anchorPoints = new ObservablePoint({ _onUpdate: () => {} }, 0, 0);
    isCustomAnchor: boolean = false;
    displayWidth = signal<Size>(0);
    displayHeight = signal<Size>(0);
    overrideProps: string[] = [];
    layout = null;
    onBeforeDestroy: OnHook | null = null;
    onAfterMount: OnHook | null = null;
    subjectInit = new BehaviorSubject(null);
    disableLayout: boolean = false;
    // Store registered event listeners for cleanup
    #registeredEvents: Map<string, Function> = new Map();
    // Store computed layout box dimensions
    #computedLayoutBox: { width?: number; height?: number } | null = null;
    // Store reference to element for freeze checking
    #element: Element<any> | null = null;
    #layoutRootSize: { width: Size; height: Size } | null = null;

    /**
     * Get the element reference for freeze checking
     * @returns The element reference or null
     */
    getElement(): Element<any> | null {
      return this.#element;
    }

    onLayoutComputed(_event: any) {}

    get deltaRatio() {
      return this.#canvasContext?.scheduler?.tick.value.deltaRatio;
    }

    get parentIsFlex() {
      if (this.disableLayout) return false;
      return Boolean(
        this.parent?.isLayoutContainer ?? this.parent?.isFlex,
      );
    }

    #hasLayoutSetter() {
      let prototype = Object.getPrototypeOf(this);
      while (prototype) {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "layout");
        if (typeof descriptor?.set === "function") return true;
        prototype = Object.getPrototypeOf(prototype);
      }
      return false;
    }

    ensureLayout() {
      if (this.disableLayout) return;

      const currentLayout = this.layout as any;
      if (currentLayout?.yoga) return;

      // Elements can be created before bootstrapCanvas() has loaded @pixi/layout.
      // Discard any plain object written before the Pixi layout setter existed,
      // then let the setter create the actual Layout instance at mount time.
      if (Object.prototype.hasOwnProperty.call(this, "layout")) {
        delete (this as any).layout;
      }

      if (this.#hasLayoutSetter()) {
        this.layout = {};
      }
    }

    #syncLayoutRole(props: Props) {
      this.isLayoutContainer = hasLayoutContainerProps(props);
      // Keep the historical flag as a broad "participates in layout" marker
      // for compatibility. New code must use isLayoutContainer when deciding
      // whether this object lays out its own children.
      this.isFlex = this.isLayoutContainer || hasLayoutNodeProps(props);
    }

    #ensureLayoutChildren() {
      if (!this.isLayoutContainer || !Array.isArray(this.children)) return;
      for (const child of this.children) {
        child?.ensureLayout?.();
        child?.applyLayoutProps?.();
      }
    }

    detachLayoutSubtree() {
      if (Array.isArray(this.children)) {
        for (const child of this.children) {
          child?.detachLayoutSubtree?.();
        }
      }
      if (this.layout) this.layout = null;
      this.#computedLayoutBox = null;
    }

    rehydrateLayoutSubtree() {
      this.applyLayoutProps();
      if (!Array.isArray(this.children)) return;
      for (const child of this.children) {
        child?.rehydrateLayoutSubtree?.();
      }
    }

    applyLayoutProps(props: Props = this.fullProps) {
      if (this.disableLayout) return;
      const source = this.#layoutRootSize
        ? withLayoutSize(props, this.#layoutRootSize.width, this.#layoutRootSize.height)
        : props;
      const shouldHaveLayout =
        this.isLayoutContainer ||
        Boolean(this.parent?.isLayoutContainer) ||
        hasLayoutNodeProps(source);
      if (!shouldHaveLayout) return;

      this.ensureLayout();
      if (this.layout) {
        this.layout = normalizeLayoutProps(source, {
          containerAnchor: this.isCustomAnchor && this.isLayoutContainer,
        });
      }
    }

    setLayoutRootSize(width: Size, height: Size) {
      this.#layoutRootSize = { width, height };
      this.applyLayoutProps();
    }

    onInit(props: Props) {
      // Ensure layout setter from @pixi/layout is used when available.
      if (Object.prototype.hasOwnProperty.call(this, "layout")) {
        delete (this as any).layout;
      }
      this._id = props.id;
      for (let event of EVENTS) {
        if (props[event] && !this.overrideProps.includes(event)) {
          this.eventMode = "static";
          const originalEventHandler = props[event];
          
          // Wrap event handler to check freeze state
          const wrappedHandler = (...args: any[]) => {
            // Check if element is frozen before executing handler
            if (this.#element && isElementFrozen(this.#element)) {
              return;
            }
            return originalEventHandler(...args);
          };
          
          // Store the wrapped event handler for cleanup
          if (event === 'click') {
            this.on('pointertap', wrappedHandler);
            this.#registeredEvents.set('pointertap', wrappedHandler);
          } else {
            this.on(event, wrappedHandler);
            this.#registeredEvents.set(event, wrappedHandler);
          }
        }
      }
      if (props.onBeforeDestroy || props['on-before-destroy']) {
        this.onBeforeDestroy = props.onBeforeDestroy || props['on-before-destroy'];
      }
      if (props.onAfterMount || props['on-after-mount']) {
        this.onAfterMount = props.onAfterMount || props['on-after-mount'];
      }
      this.fullProps = { ...props };
      this.#syncLayoutRole(this.fullProps);

      this.subjectInit.next(this);
    }

    async onMount(element: Element<any>, index?: number) {
      if (this.destroyed) return
      this.#element = element;
      this.#canvasContext = element.props.context;
      if (this.isLayoutContainer || hasLayoutNodeProps(this.fullProps)) {
        this.ensureLayout();
      }
      if (element.parent) {
        let parentElement = element.parent;
        let instance = parentElement.componentInstance as DisplayObject;
        if (typeof (instance as any)?.addChild !== "function") {
          let search = parentElement.parent;
          while (search && typeof (search.componentInstance as any)?.addChild !== "function") {
            search = search.parent;
          }
          if (search && typeof (search.componentInstance as any)?.addChild === "function") {
            parentElement = search;
            instance = parentElement.componentInstance as DisplayObject;
          } else {
            console.warn("DisplayObject mount skipped: parent has no addChild", {
              child: element.tag,
              parent: element.parent?.tag,
            });
            return;
          }
        }
        if ((instance.isLayoutContainer || this.isLayoutContainer || hasLayoutNodeProps(this.fullProps)) && !this.disableLayout) {
          try {
            this.ensureLayout();
          } catch (error) {
            console.warn('Failed to set layout:', error);
          }
        }
        if (index === undefined || parentElement !== element.parent || typeof (instance as any)?.addChildAt !== "function") {
          instance.addChild(this);
        } else {
          instance.addChildAt(this, index);
        }
        this.isMounted = true;
        this.onUpdate(element.props);
        this.#ensureLayoutChildren();
        
        // Listen to layout events to store computed layout dimensions
        const layoutHandler = (event: any) => {
          if (event.computedLayout) {
            this.#computedLayoutBox = {
              width: event.computedLayout.width,
              height: event.computedLayout.height,
            };
          }
          this.onLayoutComputed(event);
        };
        this.on('layout', layoutHandler);
        this.#registeredEvents.set('layout', layoutHandler);
        
        if (this.onAfterMount) {
          await this.onAfterMount();
        }
      }
    }

    onUpdate(props: Props) {
      this.fullProps = {
        ...this.fullProps,
        ...props,
      };

      const wasLayoutContainer = this.isLayoutContainer;
      this.#syncLayoutRole(this.fullProps);
      const layoutContainerDeactivated = wasLayoutContainer && !this.isLayoutContainer;

      if (this.destroyed) return
      if (!this.#canvasContext) return;

      if (layoutContainerDeactivated) {
        // @pixi/layout merges new styles into the existing Layout instance.
        // Rebuild the affected tree so removed reactive props cannot survive,
        // and only nodes that still independently need Yoga are reattached.
        this.detachLayoutSubtree();
        this.rehydrateLayoutSubtree();
      } else if (
        this.isLayoutContainer ||
        Boolean(this.parent?.isLayoutContainer) ||
        hasLayoutNodeProps(this.fullProps)
      ) {
        this.ensureLayout();
      }
      if (!wasLayoutContainer && this.isLayoutContainer) {
        this.#ensureLayoutChildren();
      }

      if (props.x !== undefined) this.setX(props.x);
      if (props.y !== undefined) this.setY(props.y);
      if (props.scale !== undefined)
        setObservablePoint(this.scale, props.scale);
      if (props.anchor !== undefined && !this.isCustomAnchor) {
        setObservablePoint(this.anchor, props.anchor);
      }
      if (props.width !== undefined) this.setWidth(props.width);
      if (props.height !== undefined) this.setHeight(props.height);
      if (props.skew !== undefined) setObservablePoint(this.skew, props.skew);
      if (props.tint) this.tint = props.tint;
      if (props.rotation !== undefined) this.rotation = props.rotation;
      if (props.angle !== undefined) this.angle = props.angle;
      if (props.zIndex !== undefined) this.zIndex = props.zIndex;
      if (props.roundPixels !== undefined) this.roundPixels = props.roundPixels;
      if (props.cursor) this.cursor = props.cursor;
      if (props.visible !== undefined || props.display !== undefined) {
        this.visible = this.fullProps.display === "none"
          ? false
          : this.fullProps.visible ?? true;
      }
      if (props.alpha !== undefined) this.alpha = props.alpha;
      if (props.pivot) setObservablePoint(this.pivot, props.pivot);
      this.applyLayoutProps();
      if (props.filters) this.filters = props.filters;
      if (props.maskOf) {
        if (isElement(props.maskOf)) {
          props.maskOf.componentInstance.mask = this as any;
        }
      }
      if (props.shadowCaster !== undefined) {
        const shadowCasterValue = (props.shadowCaster as any)?.value ?? props.shadowCaster;
        if (
          shadowCasterValue &&
          typeof shadowCasterValue === "object" &&
          !Array.isArray(shadowCasterValue)
        ) {
          const current = ((this as any).shadowCaster ?? {}) as Record<string, unknown>;
          (this as any).shadowCaster = { ...current, ...shadowCasterValue };
        } else {
          (this as any).shadowCaster = shadowCasterValue;
        }
      }
      if (props.footprintCaster !== undefined) {
        const footprintCasterValue =
          (props.footprintCaster as any)?.value ?? props.footprintCaster;
        if (
          footprintCasterValue &&
          typeof footprintCasterValue === "object" &&
          !Array.isArray(footprintCasterValue)
        ) {
          const current = ((this as any).footprintCaster ?? {}) as Record<string, unknown>;
          (this as any).footprintCaster = { ...current, ...footprintCasterValue };
        } else {
          (this as any).footprintCaster = footprintCasterValue;
        }
      }
      if (props.blendMode) this.blendMode = props.blendMode;
      if (props.filterArea) this.filterArea = props.filterArea;
      const currentFilters = this.filters || [];

      // TODO: Fix DropShadowFilter import issue
      // if (props.shadow) {
      //   let dropShadowFilter = currentFilters.find(
      //     (filter) => filter instanceof FILTERS.DropShadowFilter
      //   );
      //   if (!dropShadowFilter) {
      //     dropShadowFilter = new FILTERS.DropShadowFilter();
      //     currentFilters.push(dropShadowFilter);
      //   }
      //   Object.assign(dropShadowFilter, props.shadow);
      // }

      if (props.blur) {
        let blurFilter = currentFilters.find(
          (filter) => filter instanceof BlurFilter
        );
        if (!blurFilter) {
          const options =
            typeof props.blur === "number"
              ? {
                  strength: props.blur,
                }
              : props.blur;
          blurFilter = new BlurFilter(options);
          currentFilters.push(blurFilter);
        }
        Object.assign(blurFilter, props.blur);
      }

      this.filters = currentFilters;
    }

    async onDestroy(parent: Element, afterDestroy?: () => void) {
      // Remove all registered event listeners
      for (const [eventName, eventHandler] of this.#registeredEvents) {
        this.off(eventName, eventHandler);
      }
      this.#registeredEvents.clear();
      this.#element = null;

      if (this.onBeforeDestroy) {
        await this.onBeforeDestroy();
      }
      if (afterDestroy) afterDestroy();
      if (this.parent && typeof this.parent.removeChild === "function") {
        this.parent.removeChild(this);
      }
      super.destroy();
    }

    setFlexDirection(direction: FlexDirection) {
      this.layout = { flexDirection: direction };
    }

    setFlexWrap(wrap: FlexWrap) {
      this.layout = { flexWrap: wrap };
    }

    setAlignContent(align: AlignContent) {
      this.layout = { alignContent: align };
    }

    setAlignSelf(align: AlignSelf) {
      this.layout = { alignSelf: align };
    }

    setAlignItems(align: AlignItems) {
      this.layout = { alignItems: align };
    }

    setJustifyContent(justifyContent: JustifyContent) {
      this.layout = { justifyContent };
    }

    setPosition(position: EdgeSize) {
      if (position instanceof Array) {
        if (position.length === 2) {
          this.layout = {
            positionY: position[0],
            positionX: position[1],
          };
        } else if (position.length === 4) {
          this.layout = {
            positionTop: position[0],
            positionRight: position[1],
            positionBottom: position[2],
            positionLeft: position[3],
          };
        }
      } else {
        this.layout = { position };
      }
    }

    setX(x: number) {
      x = x + this.getWidth() * this._anchorPoints.x;
      if (!this.parentIsFlex) {
        this.x = x;
      } else {
        this.x = x;
        this.layout = { x };
      }
    }

    setY(y: number) {
      y = y + this.getHeight() * this._anchorPoints.y;
      if (!this.parentIsFlex) {
        this.y = y;
      } else {
        this.y = y;
        this.layout = { y };
      }
    }

    setPadding(padding: EdgeSize) {
      this.layout = normalizeLayoutProps({ padding });
    }

    setMargin(margin: EdgeSize) {
      this.layout = normalizeLayoutProps({ margin });
    }

    setGap(gap: Size) {
      this.layout = { gap };
    }

    setBorder(border: LayoutBorder) {
      if (isLayoutBorder(border)) this.layout = normalizeLayoutProps({ border });
    }

    setPositionType(positionType: "relative" | "absolute" | "static") {
      this.layout = { position: positionType };
    }

    setWidth(width: Size) {
      this.displayWidth.set(width);
      if (!this.parentIsFlex && !this.layout) {
        if (!isPercent(width)) this.width = width;
      } else {
        this.layout = { width };
      }
    }

    setHeight(height: Size) {
      this.displayHeight.set(height);
      if (!this.parentIsFlex && !this.layout) {
        if (!isPercent(height)) this.height = height;
      } else {
        this.layout = { height };
      }
    }

    getWidth(): number {
      // If width is a percentage, use computed layout box
      if (isPercent(this.fullProps.width)) {
        if (this.#computedLayoutBox?.width !== undefined) {
          return this.#computedLayoutBox.width;
        }
        // Fallback to native width if layout not yet computed
        return typeof this.width === 'number' ? this.width : 0;
      }
      // For static values, use native PixiJS width or displayWidth signal
      const requestedWidth = this.displayWidth();
      const staticWidth = typeof this.width === 'number' && this.width > 0 
        ? this.width 
        : (typeof requestedWidth === 'number' ? requestedWidth : 0);
      return staticWidth;
    }

    getHeight(): number {
      // If height is a percentage, use computed layout box
      if (isPercent(this.fullProps.height)) {
        if (this.#computedLayoutBox?.height !== undefined) {
          return this.#computedLayoutBox.height;
        }
        // Fallback to native height if layout not yet computed
        return typeof this.height === 'number' ? this.height : 0;
      }
      // For static values, use native PixiJS height or displayHeight signal
      const requestedHeight = this.displayHeight();
      const staticHeight = typeof this.height === 'number' && this.height > 0 
        ? this.height 
        : (typeof requestedHeight === 'number' ? requestedHeight : 0);
      return staticHeight;
    }

    // Min/Max constraints
    setMinWidth(minWidth: number | string) {
      this.layout = { minWidth };
    }

    setMinHeight(minHeight: number | string) {
      this.layout = { minHeight };
    }

    setMaxWidth(maxWidth: number | string) {
      this.layout = { maxWidth };
    }

    setMaxHeight(maxHeight: number | string) {
      this.layout = { maxHeight };
    }

    // Aspect ratio
    setAspectRatio(aspectRatio: number) {
      this.layout = { aspectRatio };
    }

    // Flex properties
    setFlexGrow(flexGrow: number) {
      this.layout = { flexGrow };
    }

    setFlexShrink(flexShrink: number) {
      this.layout = { flexShrink };
    }

    setFlexBasis(flexBasis: number | string) {
      this.layout = { flexBasis };
    }

    // Gap properties
    setRowGap(rowGap: Size) {
      this.layout = { rowGap };
    }

    setColumnGap(columnGap: Size) {
      this.layout = { columnGap };
    }

    // Position insets
    setTop(top: number | string) {
      this.layout = { top };
    }

    setLeft(left: number | string) {
      this.layout = { left };
    }

    setRight(right: number | string) {
      this.layout = { right };
    }

    setBottom(bottom: number | string) {
      this.layout = { bottom };
    }

    // Object properties
    setObjectFit(objectFit: ObjectFit) {
      try {
        this.layout = { objectFit };
      } catch (error) {
        // Ignore layout errors in test environments or when yoga-layout is not available
      }
    }

    setObjectPosition(objectPosition: ObjectPosition) {
      try {
        this.layout = { objectPosition };
      } catch (error) {
        // Ignore layout errors in test environments or when yoga-layout is not available
      }
    }

    setTransformOrigin(transformOrigin: TransformOrigin) {
      try {
        this.layout = { transformOrigin };
      } catch (error) {
        // Ignore layout errors in test environments or when yoga-layout is not available
      }
    }
  };
}
