import { Node } from "yoga-layout";
import { Element, isElement, Props } from "../engine/reactive";
import { setObservablePoint } from "../engine/utils";
import type {
  AlignContent,
  EdgeSize,
  FlexDirection,
  Size,
} from "./types/DisplayObject";
import { effect, Signal, signal } from "@signe/reactive";
import { DropShadowFilter } from "pixi-filters";
import { BlurFilter } from "pixi.js";

export interface ComponentInstance {
  id?: string;
  children?: ComponentInstance[];
  onInit?(props: Props): void;
  onUpdate?(props: Props): void;
  onDestroy?(parent: Element): void;
  onMount?(context: Element, index?: number): void;
}

type AABB = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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

export function DisplayObject(extendClass) {
  return class DisplayObject extends extendClass {
    private _canvasContext: {
      [key: string]: any;
    } | null = null;
    private isFlex: boolean = false;
    protected isMounted: boolean = false;
    private AABB: AABB = { x: 0, y: 0, width: 0, height: 0 };
    displayWidth = signal(0);
    displayHeight = signal(0);
    overrideProps: string[] = []

    public node: Node;

    get yoga() {
      return this._canvasContext?.Yoga;
    }

    get deltaRatio() {
      return this._canvasContext?.scheduler?.tick.value.deltaRatio;
    }

    onInit(props) {
      this._id = props.id;
      for (let event of EVENTS) {
        if (props[event] && !this.overrideProps.includes(event)) {
          this.eventMode = "static";
          this.on(event, props[event]);
        }
      }
    }

    onMount({ parent, props }: Element<DisplayObject>, index?: number) {
      this._canvasContext = props.context;
      this.node = this.yoga.Node.create();
      if (parent) {
        const instance = parent.componentInstance as DisplayObject;
        if (index === undefined) {
          instance.addChild(this);
        } else {
          instance.addChildAt(this, index);
        }
        if (instance.layer) this.parentLayer = instance.layer;
        this.isMounted = true;
        this.onUpdate(props);
        this.parent.node.insertChild(
          this.node,
          this.parent.node.getChildCount()
        );
        if (parent.props.flexDirection) {
          this.parent.node.calculateLayout();
          for (let child of this.parent.children) {
            const { left, top } = child.getComputedLayout();
            child.x = left;
            child.y = top;
          }
        }
        this.effectSize(props.width, props.height)
      }
    }

    effectSize(width: Size, height: Size) {
      const handleSize = (size: Size, setter: (value: number) => void, parentSize: Signal<number>) => {
        if (typeof size === "string" && size.endsWith("%")) {
          effect(() => {
            setter(parentSize() * (parseInt(size) / 100));
            if (this.isFlex) {
              this.applyFlexLayout();
            }
          });
        } else {
          setter(+size);
        }
      };

      if (width != undefined) handleSize(width, this.setWidth.bind(this), this.parent.displayWidth);
      if (height != undefined) handleSize(height, this.setHeight.bind(this), this.parent.displayHeight);
    }

    private applyFlexLayout() {
        this.calculateLayout();
        for (let child of this.children) {
          const { left, top } = child.node.getComputedLayout();
          child.x = left;
          child.y = top;
        }
    }

    private flexRender(props) {
      if (!this.parent) return;
      if (props.flexDirection || props.justifyContent) {
        this.isFlex = true;
        this.applyFlexLayout()
      }
    }

    onUpdate(props) {
      if (!this._canvasContext || !this.parent) return;
      if (props.x !== undefined) this.setX(props.x);
      if (props.y !== undefined) this.setY(props.y);
      if (props.scale !== undefined)
        setObservablePoint(this.scale, props.scale);
      if (props.anchor !== undefined)
        setObservablePoint(this.anchor, props.anchor);
      if (props.skew !== undefined) setObservablePoint(this.skew, props.skew);
      if (props.tint) this.tint = props.tint;
      if (props.rotation !== undefined) this.rotation = props.rotation;
      if (props.angle !== undefined) this.angle = props.angle;
      if (props.zIndex !== undefined) this.zIndex = props.zIndex;
      if (props.roundPixels !== undefined) this.roundPixels = props.roundPixels;
      if (props.cursor) this.cursor = props.cursor;
      if (props.visible !== undefined) this.visible = props.visible;
      if (props.alpha !== undefined) this.alpha = props.alpha;
      if (props.pivot) setObservablePoint(this.pivot, props.pivot);
      if (props.flexDirection) this.setFlexDirection(props.flexDirection);
      if (props.flexWrap) this.setFlexWrap(props.flexWrap);
      if (props.justifyContent) this.setJustifyContent(props.justifyContent);
      if (props.alignItems) this.setAlignItems(props.alignItems);
      if (props.alignContent) this.setAlignContent(props.alignContent);
      if (props.alignSelf) this.setAlignSelf(props.alignSelf);
      if (props.margin) this.setMargin(props.margin);
      if (props.padding) this.setPadding(props.padding);
      if (props.gap) this.setGap(props.gap);
      if (props.border) this.setBorder(props.border);
      if (props.positionType) this.setPositionType(props.positionType);
      if (props.filters) this.filters = props.filters;
      if (props.maskOf) {
        if (isElement(props.maskOf)) {
          props.maskOf.componentInstance.mask = this;
        }
      }
      if (props.blendMode) this.blendMode = props.blendMode;
      if (props.filterArea) this.filterArea = props.filterArea;
      const currentFilters = this.filters || [];
      
      if (props.shadow) {
        let dropShadowFilter = currentFilters.find(filter => filter instanceof DropShadowFilter);
        if (!dropShadowFilter) {
          dropShadowFilter = new DropShadowFilter();
          currentFilters.push(dropShadowFilter);
        }
        Object.assign(dropShadowFilter, props.shadow);
      }

      if (props.blur) {
        let blurFilter = currentFilters.find(filter => filter instanceof BlurFilter);
        if (!blurFilter) {
          const options = typeof props.blur === 'number' ? { 
            strength: props.blur,
          } : props.blur;
          blurFilter = new BlurFilter(options);
          currentFilters.push(blurFilter);
        }
        Object.assign(blurFilter, props.blur);
      }

      this.filters = currentFilters;

      this.flexRender(props);
    }

    onDestroy() {
      super.destroy();
      this.node?.freeRecursive();
    }

    getComputedLayout() {
      return this.node.getComputedLayout();
    }

    applyComputedLayout() {
      const layout = this.getComputedLayout();
      this.x = layout.left;
      this.y = layout.top;
    }

    calculateLayout() {
      this.node.calculateLayout();
    }

    setFlexDirection(direction: FlexDirection) {
      const mapping = {
        row: this.yoga.FLEX_DIRECTION_ROW,
        column: this.yoga.FLEX_DIRECTION_COLUMN,
        "row-reverse": this.yoga.FLEX_DIRECTION_ROW_REVERSE,
        "column-reverse": this.yoga.FLEX_DIRECTION_COLUMN_REVERSE,
      };
      this.node.setFlexDirection(mapping[direction]);
    }

    setFlexWrap(wrap: "wrap" | "nowrap" | "wrap-reverse") {
      const mapping = {
        wrap: this.yoga.WRAP_WRAP,
        nowrap: this.yoga.WRAP_NO_WRAP,
        "wrap-reverse": this.yoga.WRAP_WRAP_REVERSE,
      };
      this.node.setFlexWrap(mapping[wrap]);
    }

    private setAlign(methodName: string, align: AlignContent) {
      const mapping = {
        auto: this.yoga.ALIGN_AUTO,
        "flex-start": this.yoga.ALIGN_FLEX_START,
        "flex-end": this.yoga.ALIGN_FLEX_END,
        center: this.yoga.ALIGN_CENTER,
        stretch: this.yoga.ALIGN_STRETCH,
        baseline: this.yoga.ALIGN_BASELINE,
        "space-between": this.yoga.ALIGN_SPACE_BETWEEN,
        "space-around": this.yoga.ALIGN_SPACE_AROUND,
      };
      const method = (this.node as any)[methodName].bind(this.node);
      method(mapping[align]);
    }

    setAlignContent(align: AlignContent) {
      this.setAlign("setAlignContent", align);
    }

    setAlignSelf(align: AlignContent) {
      this.setAlign("setAlignSelf", align);
    }

    setAlignItems(align: AlignContent) {
      this.setAlign("setAlignItems", align);
    }

    setJustifyContent(
      justifyContent:
        | "flex-start"
        | "flex-end"
        | "center"
        | "space-between"
        | "space-around"
    ) {
      const mapping = {
        "flex-start": this.yoga.JUSTIFY_FLEX_START,
        "flex-end": this.yoga.JUSTIFY_FLEX_END,
        center: this.yoga.JUSTIFY_CENTER,
        "space-between": this.yoga.JUSTIFY_SPACE_BETWEEN,
        "space-around": this.yoga.JUSTIFY_SPACE_AROUND,
      };
      this.node.setJustifyContent(mapping[justifyContent]);
    }

    private setEdgeSize(methodName: string, size: EdgeSize) {
      const method = (this.node as any)[methodName].bind(this.node);
      if (size instanceof Array) {
        if (size.length === 2) {
          method(this.yoga.EDGE_VERTICAL, size[0]);
          method(this.yoga.EDGE_HORIZONTAL, size[1]);
        } else if (size.length === 4) {
          method(this.yoga.EDGE_TOP, size[0]);
          method(this.yoga.EDGE_RIGHT, size[1]);
          method(this.yoga.EDGE_BOTTOM, size[2]);
          method(this.yoga.EDGE_LEFT, size[3]);
        }
      } else {
        method(this.yoga.EDGE_ALL, size);
      }
    }

    setPosition(position: EdgeSize) {
      this.setEdgeSize("setPosition", position);
    }

    setX(x: number) {
      if (!this.parent.isFlex) {
        this.x = x;
      }
      this.node.setPosition(this.yoga.EDGE_LEFT, x);
    }

    setY(y: number) {
      if (!this.parent.isFlex) {
        this.y = y;
      }
      this.node.setPosition(this.yoga.EDGE_TOP, y);
    }

    setPadding(padding: EdgeSize) {
      this.setEdgeSize("setPadding", padding);
    }

    setMargin(margin: EdgeSize) {
      this.setEdgeSize("setMargin", margin);
    }

    setGap(gap: EdgeSize) {
      this.node.setGap(this.yoga.GAP_ALL, +gap);
    }

    setBorder(border: EdgeSize) {
      this.setEdgeSize("setBorder", border);
    }

    setPositionType(positionType: "relative" | "absolute") {
      const mapping = {
        relative: this.yoga.POSITION_TYPE_RELATIVE,
        absolute: this.yoga.POSITION_TYPE_ABSOLUTE,
      };
      this.node.setPositionType(mapping[positionType]);
    }

    calculateBounds() {
      super.calculateBounds();
      if (!this._geometry) return;
      const bounds = this._geometry.bounds;
      const width = Math.abs(bounds.minX - bounds.maxX);
      const height = Math.abs(bounds.minY - bounds.maxY);
      // this.node.setWidth(width);
      // this.node.setHeight(height);
    }

    setWidth(width: number) {
      this.displayWidth.set(width);
      this.node?.setWidth(width);
    }

    setHeight(height: number) {
      this.displayHeight.set(height);
      this.node?.setHeight(height);
    }

    getWidth() {
      return this.node.getWidth();
    }

    //    updateAABB() {
    //         const box = this.getLocalBounds()
    //         this.AABB.x = this.x + (box.x - this.pivot.x) * Math.abs(this.scale.x)
    //         this.AABB.y = this.y + (box.y - this.pivot.y) * Math.abs(this.scale.y)
    //         this.AABB.width = box.width * Math.abs(this.scale.x)
    //         this.AABB.height = box.height * Math.abs(this.scale.y)
    //     }

    //     render(args) {
    //         super.render(args);
    //         this.updateAABB()
    //         if (this._boundsViewport) {
    //             const bounds = this._context.viewport.getVisibleBounds()
    //             const box = this.AABB
    //             this.visible =
    //                 box.x + box.width > bounds.x && box.x < bounds.x + bounds.width &&
    //                 box.y + box.height > bounds.y && box.y < bounds.y + bounds.height
    //         }

    //     }
  };
}
