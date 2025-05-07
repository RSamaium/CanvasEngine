import { Node } from "yoga-layout";
import { Element, isElement, Props } from "../engine/reactive";
import { setObservablePoint } from "../engine/utils";
import type {
  AlignContent,
  EdgeSize,
  FlexDirection,
  Size,
  ObjectFit,
  ObjectPosition,
  TransformOrigin,
  PositionType,
} from "./types/DisplayObject";
import { effect, Signal, signal } from "@signe/reactive";
import { DropShadowFilter } from "pixi-filters";
import { BlurFilter, ObservablePoint } from "pixi.js";
import { Layout } from "@pixi/layout";
import { isPercent } from "../utils/functions";

export interface ComponentInstance extends PixiMixins.ContainerOptions {
  id?: string;
  children?: ComponentInstance[];
  onInit?(props: Props): void;
  onUpdate?(props: Props): void;
  onDestroy?(parent: Element, afterDestroy: () => void): void;
  onMount?(context: Element, index?: number): void;
  setWidth(width: number): void;
  setHeight(height: number): void;
  layout: Layout | null;
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

type OnHook = (() => void) | (() => Promise<void> | void);

export function DisplayObject(extendClass) {
  return class DisplayObject extends extendClass {
    #canvasContext: {
      [key: string]: any;
    } | null = null;
    isFlex: boolean = false;
    fullProps: Props = {};
    isMounted: boolean = false;
    _anchorPoints = new ObservablePoint({ _onUpdate: () => {} }, 0, 0);
    isCustomAnchor: boolean = false;
    displayWidth = signal(0);
    displayHeight = signal(0);
    overrideProps: string[] = [];
    layout = null;
    onBeforeDestroy: OnHook | null = null;
    onAfterMount: OnHook | null = null;

    get deltaRatio() {
      return this.#canvasContext?.scheduler?.tick.value.deltaRatio;
    }

    onInit(props) {
      this._id = props.id;
      for (let event of EVENTS) {
        if (props[event] && !this.overrideProps.includes(event)) {
          this.eventMode = "static";
          this.on(event, props[event]);
        }
      }
      if (props.onBeforeDestroy || props['on-before-destroy']) {
        this.onBeforeDestroy = props.onBeforeDestroy || props['on-before-destroy'];
      }
      if (props.onAfterMount || props['on-after-mount']) {
        this.onAfterMount = props.onAfterMount || props['on-after-mount'];
      }
      if (
        props.justifyContent ||
        props.alignItems ||
        props.flexDirection ||
        props.flexWrap ||
        props.alignContent ||
        props.display == "flex" ||
        isPercent(props.width) ||
        isPercent(props.height) ||
        props.isRoot
      ) {
        this.layout = {};
        this.isFlex = true;
      }
    }

    async onMount({ parent, props }: Element<DisplayObject>, index?: number) {
      this.#canvasContext = props.context;
      if (parent) {
        const instance = parent.componentInstance as DisplayObject;
        if (instance.isFlex && !this.layout) {
          this.layout = {};
        }
        if (index === undefined) {
          instance.addChild(this);
        } else {
          instance.addChildAt(this, index);
        }
        this.isMounted = true;
        this.onUpdate(props);
        if (this.onAfterMount) {
          await this.onAfterMount();
        }
      }
    }

    onUpdate(props) {
      this.fullProps = {
        ...this.fullProps,
        ...props,
      };

      if (!this.#canvasContext || !this.parent) return;

      if (props.x !== undefined) this.setX(props.x);
      if (props.y !== undefined) this.setY(props.y);
      if (props.scale !== undefined)
        setObservablePoint(this.scale, props.scale);
      if (props.anchor !== undefined && !this.isCustomAnchor) {
        setObservablePoint(this.anchor, props.anchor);
      }
      if (props.width !== undefined) this.setWidth(props.width);
      if (props.height !== undefined) this.setHeight(props.height);
      if (props.minWidth !== undefined) this.setMinWidth(props.minWidth);
      if (props.minHeight !== undefined) this.setMinHeight(props.minHeight);
      if (props.maxWidth !== undefined) this.setMaxWidth(props.maxWidth);
      if (props.maxHeight !== undefined) this.setMaxHeight(props.maxHeight);
      if (props.aspectRatio !== undefined)
        this.setAspectRatio(props.aspectRatio);
      if (props.flexGrow !== undefined) this.setFlexGrow(props.flexGrow);
      if (props.flexShrink !== undefined) this.setFlexShrink(props.flexShrink);
      if (props.flexBasis !== undefined) this.setFlexBasis(props.flexBasis);
      if (props.rowGap !== undefined) this.setRowGap(props.rowGap);
      if (props.columnGap !== undefined) this.setColumnGap(props.columnGap);
      if (props.top !== undefined) this.setTop(props.top);
      if (props.left !== undefined) this.setLeft(props.left);
      if (props.right !== undefined) this.setRight(props.right);
      if (props.bottom !== undefined) this.setBottom(props.bottom);
      if (props.objectFit !== undefined) this.setObjectFit(props.objectFit);
      if (props.objectPosition !== undefined)
        this.setObjectPosition(props.objectPosition);
      if (props.transformOrigin !== undefined)
        this.setTransformOrigin(props.transformOrigin);
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
        let dropShadowFilter = currentFilters.find(
          (filter) => filter instanceof DropShadowFilter
        );
        if (!dropShadowFilter) {
          dropShadowFilter = new DropShadowFilter();
          currentFilters.push(dropShadowFilter);
        }
        Object.assign(dropShadowFilter, props.shadow);
      }

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
      if (this.onBeforeDestroy) {
        await this.onBeforeDestroy();
      }
      super.destroy();
      if (this.onAfterDestroy) this.onAfterDestroy()
    }

    setFlexDirection(direction: FlexDirection) {
      this.layout = { flexDirection: direction };
    }

    setFlexWrap(wrap: "wrap" | "nowrap" | "wrap-reverse") {
      this.layout = { flexWrap: wrap };
    }

    setAlignContent(align: AlignContent) {
      this.layout = { alignContent: align };
    }

    setAlignSelf(align: AlignContent) {
      this.layout = { alignSelf: align };
    }

    setAlignItems(align: AlignContent) {
      this.layout = { alignItems: align };
    }

    setJustifyContent(
      justifyContent:
        | "flex-start"
        | "flex-end"
        | "center"
        | "space-between"
        | "space-around"
    ) {
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
      if (!this.parent.isFlex) {
        this.x = x;
      } else {
        this.x = x;
        this.layout = { x };
      }
    }

    setY(y: number) {
      y = y + this.getHeight() * this._anchorPoints.y;
      if (!this.parent.isFlex) {
        this.y = y;
      } else {
        this.y = y;
        this.layout = { y };
      }
    }

    setPadding(padding: EdgeSize) {
      if (padding instanceof Array) {
        if (padding.length === 2) {
          this.layout = {
            paddingVertical: padding[0],
            paddingHorizontal: padding[1],
          };
        } else if (padding.length === 4) {
          this.layout = {
            paddingTop: padding[0],
            paddingRight: padding[1],
            paddingBottom: padding[2],
            paddingLeft: padding[3],
          };
        }
      } else {
        this.layout = { padding };
      }
    }

    setMargin(margin: EdgeSize) {
      if (margin instanceof Array) {
        if (margin.length === 2) {
          this.layout = {
            marginVertical: margin[0],
            marginHorizontal: margin[1],
          };
        } else if (margin.length === 4) {
          this.layout = {
            marginTop: margin[0],
            marginRight: margin[1],
            marginBottom: margin[2],
            marginLeft: margin[3],
          };
        }
      } else {
        this.layout = { margin };
      }
    }

    setGap(gap: EdgeSize) {
      this.layout = { gap };
    }

    setBorder(border: EdgeSize) {
      if (border instanceof Array) {
        if (border.length === 2) {
          this.layout = {
            borderVertical: border[0],
            borderHorizontal: border[1],
          };
        } else if (border.length === 4) {
          this.layout = {
            borderTop: border[0],
            borderRight: border[1],
            borderBottom: border[2],
            borderLeft: border[3],
          };
        }
      } else {
        this.layout = { border };
      }
    }

    setPositionType(positionType: "relative" | "absolute") {
      this.layout = { position: positionType };
    }

    setWidth(width: number) {
      this.displayWidth.set(width);
      if (!this.parent?.isFlex) {
        this.width = width;
      } else {
        this.layout = { width };
      }
    }

    setHeight(height: number) {
      this.displayHeight.set(height);
      if (!this.parent?.isFlex) {
        this.height = height;
      } else {
        this.layout = { height };
      }
    }

    getWidth() {
      return this.displayWidth();
    }

    getHeight() {
      return this.displayHeight();
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
    setRowGap(rowGap: number) {
      this.layout = { rowGap };
    }

    setColumnGap(columnGap: number) {
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
      this.layout = { objectFit };
    }

    setObjectPosition(objectPosition: ObjectPosition) {
      this.layout = { objectPosition };
    }

    setTransformOrigin(transformOrigin: TransformOrigin) {
      this.layout = { transformOrigin };
    }
  };
}
