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
import { signal, type WritableSignal } from "@signe/reactive";
import { BlurFilter, ObservablePoint, type Point, type Rectangle } from "pixi.js";
import * as FILTERS from "pixi-filters";
import { isPercent } from "../utils/functions";
import { BehaviorSubject, filter, Subject } from "rxjs";
import {
  hasLayoutContainerProps,
  hasLayoutNodeProps,
  isLayoutBorder,
  normalizeLayoutProps,
  requiresLayoutParent,
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
    isLayoutBoundary: boolean = false;
    fullProps: Props = {};
    isMounted: boolean = false;
    _anchorPoints = new ObservablePoint({ _onUpdate: () => {} }, 0, 0);
    isCustomAnchor: boolean = false;
    // Requested size. The signals are only created when read from outside:
    // creating two signals per display object was a measurable part of
    // mounting large scenes.
    #displayWidthValue: Size = 0;
    #displayHeightValue: Size = 0;
    #displayWidthSignal: WritableSignal<Size> | null = null;
    #displayHeightSignal: WritableSignal<Size> | null = null;
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
    #layoutDependentChildren = new Set<any>();
    #layoutParentDependency: any = null;
    #tearingDown = false;
    // Layout checks of `fullProps`, which is replaced (never mutated) on update
    #layoutFlagsProps: Props | null = null;
    #layoutContainerFlag = false;
    #layoutNodeFlag = false;
    #requiresLayoutParentFlag = false;
    // Layout styles written while props are applied, sent to @pixi/layout as
    // one style update (it merges styles, so the result is the same). Each
    // update stringifies and diffs the whole style and writes to Yoga: a few
    // setters per element made it the main cost of mounting laid out scenes.
    #layoutBatch: Record<string, unknown> | null = null;
    #layoutBatchDepth = 0;
    defaultLayoutObjectFit: ObjectFit | undefined = undefined;

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

    /** True when the current parent lays this object out. A detached object (parent `null`) never is. */
    #hasLayoutParentDependency() {
      return Boolean(this.parent) && this.#layoutParentDependency === this.parent;
    }

    get parentIsFlex() {
      if (this.disableLayout) return false;
      const parentHasExplicitLayoutRole =
        typeof this.parent?.isLayoutContainer === "boolean";
      return Boolean(
        this.parent?.isLayoutContainer ||
        this.#hasLayoutParentDependency() ||
        (!parentHasExplicitLayoutRole && this.parent?.isFlex),
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

    /** Computes the layout checks once per `fullProps` object. */
    #syncLayoutFlags() {
      const props = this.fullProps;
      if (props === this.#layoutFlagsProps) return;
      this.#layoutFlagsProps = props;
      this.#layoutContainerFlag = hasLayoutContainerProps(props);
      this.#layoutNodeFlag = this.#layoutContainerFlag || hasLayoutNodeProps(props);
      this.#requiresLayoutParentFlag = requiresLayoutParent(props);
    }

    #hasLayoutContainerProps(props: Props) {
      if (props !== this.fullProps) return hasLayoutContainerProps(props);
      this.#syncLayoutFlags();
      return this.#layoutContainerFlag;
    }

    #hasLayoutNodeProps(props: Props) {
      if (props !== this.fullProps) return hasLayoutNodeProps(props);
      this.#syncLayoutFlags();
      return this.#layoutNodeFlag;
    }

    #requiresLayoutParent(props: Props) {
      if (props !== this.fullProps) return requiresLayoutParent(props);
      this.#syncLayoutFlags();
      return this.#requiresLayoutParentFlag;
    }

    #syncLayoutRole(props: Props) {
      this.isLayoutContainer = this.#hasLayoutContainerProps(props);
      this.isLayoutBoundary =
        this.isLayoutContainer || this.#layoutDependentChildren.size > 0;
      // Keep the historical flag as a broad "participates in layout" marker
      // for compatibility. New code must use isLayoutContainer when deciding
      // whether this object lays out its own children.
      this.isFlex = this.isLayoutBoundary || this.#hasLayoutNodeProps(props);
    }

    #ensureLayoutChildren() {
      if (!this.isLayoutContainer || !Array.isArray(this.children)) return;
      for (const child of this.children) {
        child?.ensureLayout?.();
        child?.applyLayoutProps?.();
      }
    }

    registerLayoutDependentChild(child: any) {
      if (this.disableLayout || this.#layoutDependentChildren.has(child)) return;

      const wasLayoutBoundary = this.isLayoutBoundary;
      this.#layoutDependentChildren.add(child);
      this.#syncLayoutRole(this.fullProps);
      this.ensureLayout();
      this.applyLayoutProps();

      if (!wasLayoutBoundary) {
        for (const dependent of this.#layoutDependentChildren) {
          dependent?.ensureLayout?.();
          dependent?.applyLayoutProps?.();
        }
      }
    }

    unregisterLayoutDependentChild(child: any) {
      if (!this.#layoutDependentChildren.delete(child)) return;

      const wasLayoutBoundary = this.isLayoutBoundary;
      this.#syncLayoutRole(this.fullProps);
      if (wasLayoutBoundary && !this.isLayoutBoundary) {
        this.detachLayoutSubtree();
        this.rehydrateLayoutSubtree();
      }
    }

    #syncLayoutParentDependency(parent: any = this.parent) {
      const canProvideLayoutParent =
        !parent?.disableLayout &&
        typeof parent?.registerLayoutDependentChild === "function";
      const nextParent =
        !this.disableLayout &&
        canProvideLayoutParent &&
        this.#requiresLayoutParent(this.fullProps)
          ? parent
          : null;

      if (this.#layoutParentDependency === nextParent) return;

      this.#layoutParentDependency?.unregisterLayoutDependentChild?.(this);
      this.#layoutParentDependency = nextParent;
      this.#layoutParentDependency?.registerLayoutDependentChild?.(this);
    }

    /** Writes layout styles, deferred while a batch is open and the layout exists. */
    #writeLayout(style: Record<string, unknown>) {
      if (this.#layoutBatchDepth > 0 && this.layout) {
        this.#layoutBatch = this.#layoutBatch
          ? Object.assign(this.#layoutBatch, style)
          : { ...style };
        return;
      }
      this.layout = style as any;
    }

    #beginLayoutBatch() {
      this.#layoutBatchDepth++;
    }

    #endLayoutBatch() {
      if (--this.#layoutBatchDepth > 0) return;
      const style = this.#layoutBatch;
      this.#layoutBatch = null;
      if (style && this.layout && !this.destroyed) {
        this.layout = style as any;
      }
    }

    detachLayoutSubtree() {
      if (Array.isArray(this.children)) {
        for (const child of this.children) {
          child?.detachLayoutSubtree?.();
        }
      }
      this.#layoutBatch = null;
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
        this.isLayoutBoundary ||
        Boolean(this.parent?.isLayoutContainer) ||
        this.#hasLayoutParentDependency() ||
        this.#hasLayoutNodeProps(source);
      if (!shouldHaveLayout) return;

      this.ensureLayout();
      if (this.layout) {
        const normalizedSource =
          source.objectFit === undefined && this.defaultLayoutObjectFit !== undefined
            ? { ...source, objectFit: this.defaultLayoutObjectFit }
            : source;
        this.#writeLayout(normalizeLayoutProps(normalizedSource, {
          containerAnchor: this.isCustomAnchor && this.isLayoutBoundary,
        }));
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
          // An explicit eventMode (e.g. "none" on a visual overlay) wins
          if (props.eventMode === undefined) this.eventMode = "static";
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
      if (this.isLayoutBoundary || this.#hasLayoutNodeProps(this.fullProps)) {
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
        this.#syncLayoutParentDependency(instance);
        if ((instance.isLayoutContainer || this.isLayoutBoundary || this.#hasLayoutNodeProps(this.fullProps)) && !this.disableLayout) {
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
      // Prop setters write layout styles one by one: apply them at once
      this.#beginLayoutBatch();
      try {
        this.#applyProps(props);
      } finally {
        this.#endLayoutBatch();
      }
    }

    #applyProps(props: Props) {
      this.fullProps = {
        ...this.fullProps,
        ...props,
      };

      const wasLayoutContainer = this.isLayoutContainer;
      this.#syncLayoutRole(this.fullProps);
      const layoutContainerDeactivated = wasLayoutContainer && !this.isLayoutContainer;

      if (this.destroyed) return
      if (!this.#canvasContext) return;

      this.#syncLayoutParentDependency();

      if (layoutContainerDeactivated) {
        // @pixi/layout merges new styles into the existing Layout instance.
        // Rebuild the affected tree so removed reactive props cannot survive,
        // and only nodes that still independently need Yoga are reattached.
        this.detachLayoutSubtree();
        this.rehydrateLayoutSubtree();
      } else if (
        this.isLayoutBoundary ||
        Boolean(this.parent?.isLayoutContainer) ||
        this.#hasLayoutParentDependency() ||
        this.#hasLayoutNodeProps(this.fullProps)
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
      if (props.eventMode !== undefined) this.eventMode = props.eventMode;
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

    /** True from the start of this object's teardown. */
    get isTearingDown() {
      return this.#tearingDown;
    }

    /**
     * Called by the engine when the teardown of this element starts, before
     * its descendants are destroyed. The first object of a torn down tree
     * leaves the stage here, once: its descendants are then removed from a
     * detached subtree, without render group or layout work on the live
     * scene. An object with an exit hook (`onBeforeDestroy`) stays on stage
     * until the hook resolves.
     */
    beginTeardown() {
      if (this.#tearingDown) return;
      this.#tearingDown = true;
      if (this.onBeforeDestroy) return;
      const pixiParent = this.parent as any;
      if (!pixiParent || pixiParent.isTearingDown) return;
      pixiParent.removeChild(this);
      this.#syncLayoutParentDependency(null);
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
      const pixiParent = this.parent as any;
      if (pixiParent && typeof pixiParent.removeChild === "function") {
        pixiParent.removeChild(this);
      }
      if (pixiParent?.isTearingDown) {
        // The parent is destroyed too: no need to update its layout role
        this.#layoutParentDependency = null;
      } else {
        this.#syncLayoutParentDependency(null);
      }
      super.destroy();
    }

    setFlexDirection(direction: FlexDirection) {
      this.#writeLayout({ flexDirection: direction });
    }

    setFlexWrap(wrap: FlexWrap) {
      this.#writeLayout({ flexWrap: wrap });
    }

    setAlignContent(align: AlignContent) {
      this.#writeLayout({ alignContent: align });
    }

    setAlignSelf(align: AlignSelf) {
      this.#writeLayout({ alignSelf: align });
    }

    setAlignItems(align: AlignItems) {
      this.#writeLayout({ alignItems: align });
    }

    setJustifyContent(justifyContent: JustifyContent) {
      this.#writeLayout({ justifyContent });
    }

    setPosition(position: EdgeSize) {
      if (position instanceof Array) {
        if (position.length === 2) {
          this.#writeLayout({
            positionY: position[0],
            positionX: position[1],
          });
        } else if (position.length === 4) {
          this.#writeLayout({
            positionTop: position[0],
            positionRight: position[1],
            positionBottom: position[2],
            positionLeft: position[3],
          });
        }
      } else {
        this.#writeLayout({ position });
      }
    }

    setX(x: number) {
      x = x + this.getWidth() * this._anchorPoints.x;
      if (!this.parentIsFlex) {
        this.x = x;
      } else {
        this.x = x;
        this.#writeLayout({ x });
      }
    }

    setY(y: number) {
      y = y + this.getHeight() * this._anchorPoints.y;
      if (!this.parentIsFlex) {
        this.y = y;
      } else {
        this.y = y;
        this.#writeLayout({ y });
      }
    }

    setPadding(padding: EdgeSize) {
      this.#writeLayout(normalizeLayoutProps({ padding }));
    }

    setMargin(margin: EdgeSize) {
      this.#writeLayout(normalizeLayoutProps({ margin }));
    }

    setGap(gap: Size) {
      this.#writeLayout({ gap });
    }

    setBorder(border: LayoutBorder) {
      if (isLayoutBorder(border)) this.#writeLayout(normalizeLayoutProps({ border }));
    }

    setPositionType(positionType: "relative" | "absolute" | "static") {
      this.#writeLayout({ position: positionType });
    }

    /** Requested width as a signal, created on first access. */
    get displayWidth(): WritableSignal<Size> {
      return (this.#displayWidthSignal ??= signal<Size>(this.#displayWidthValue));
    }

    set displayWidth(value: WritableSignal<Size>) {
      this.#displayWidthSignal = value;
    }

    /** Requested height as a signal, created on first access. */
    get displayHeight(): WritableSignal<Size> {
      return (this.#displayHeightSignal ??= signal<Size>(this.#displayHeightValue));
    }

    set displayHeight(value: WritableSignal<Size>) {
      this.#displayHeightSignal = value;
    }

    /** Updates the requested size (and its signals, when they exist). */
    setDisplaySize(width?: Size, height?: Size) {
      if (width !== undefined) {
        this.#displayWidthValue = width;
        this.#displayWidthSignal?.set(width);
      }
      if (height !== undefined) {
        this.#displayHeightValue = height;
        this.#displayHeightSignal?.set(height);
      }
    }

    setWidth(width: Size) {
      this.setDisplaySize(width, undefined);
      if (!this.parentIsFlex && !this.layout) {
        if (!isPercent(width)) this.width = width;
      } else {
        this.#writeLayout({ width });
      }
    }

    setHeight(height: Size) {
      this.setDisplaySize(undefined, height);
      if (!this.parentIsFlex && !this.layout) {
        if (!isPercent(height)) this.height = height;
      } else {
        this.#writeLayout({ height });
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
      const requestedWidth = this.#displayWidthSignal
        ? this.#displayWidthSignal()
        : this.#displayWidthValue;
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
      const requestedHeight = this.#displayHeightSignal
        ? this.#displayHeightSignal()
        : this.#displayHeightValue;
      const staticHeight = typeof this.height === 'number' && this.height > 0 
        ? this.height 
        : (typeof requestedHeight === 'number' ? requestedHeight : 0);
      return staticHeight;
    }

    // Min/Max constraints
    setMinWidth(minWidth: number | string) {
      this.#writeLayout({ minWidth });
    }

    setMinHeight(minHeight: number | string) {
      this.#writeLayout({ minHeight });
    }

    setMaxWidth(maxWidth: number | string) {
      this.#writeLayout({ maxWidth });
    }

    setMaxHeight(maxHeight: number | string) {
      this.#writeLayout({ maxHeight });
    }

    // Aspect ratio
    setAspectRatio(aspectRatio: number) {
      this.#writeLayout({ aspectRatio });
    }

    // Flex properties
    setFlexGrow(flexGrow: number) {
      this.#writeLayout({ flexGrow });
    }

    setFlexShrink(flexShrink: number) {
      this.#writeLayout({ flexShrink });
    }

    setFlexBasis(flexBasis: number | string) {
      this.#writeLayout({ flexBasis });
    }

    // Gap properties
    setRowGap(rowGap: Size) {
      this.#writeLayout({ rowGap });
    }

    setColumnGap(columnGap: Size) {
      this.#writeLayout({ columnGap });
    }

    // Position insets
    setTop(top: number | string) {
      this.#writeLayout({ top });
    }

    setLeft(left: number | string) {
      this.#writeLayout({ left });
    }

    setRight(right: number | string) {
      this.#writeLayout({ right });
    }

    setBottom(bottom: number | string) {
      this.#writeLayout({ bottom });
    }

    // Object properties
    setObjectFit(objectFit: ObjectFit) {
      try {
        this.#writeLayout({ objectFit });
      } catch (error) {
        // Ignore layout errors in test environments or when yoga-layout is not available
      }
    }

    setObjectPosition(objectPosition: ObjectPosition) {
      try {
        this.#writeLayout({ objectPosition });
      } catch (error) {
        // Ignore layout errors in test environments or when yoga-layout is not available
      }
    }

    setTransformOrigin(transformOrigin: TransformOrigin) {
      try {
        this.#writeLayout({ transformOrigin });
      } catch (error) {
        // Ignore layout errors in test environments or when yoga-layout is not available
      }
    }
  };
}
