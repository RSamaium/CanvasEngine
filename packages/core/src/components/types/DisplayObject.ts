import * as PIXI from "pixi.js";
import { SignalOrPrimitive } from ".";
import { DragProps } from "../../directives/Drag";
import { ViewportFollowProps } from "../../directives/ViewportFollow";
import { ShakeProps } from "../../directives/Shake";
import { FlashProps } from "../../directives/Flash";

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
export type AlignContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
export type Size = number | `${number}%`
export type EdgeSize = SignalOrPrimitive<Size | [Size, Size] | [Size, Size, Size, Size]>
export type ObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
export type ObjectPosition = string;
export type TransformOrigin = string;
export type PositionType = 'relative' | 'absolute' | 'static';

export interface DisplayObjectProps {
    attach?: any;
    ref?: string;
    x?: SignalOrPrimitive<number>;
    y?: SignalOrPrimitive<number>;
    width?: SignalOrPrimitive<Size>;
    height?: SignalOrPrimitive<Size>;
    minWidth?: SignalOrPrimitive<Size>;
    minHeight?: SignalOrPrimitive<Size>;
    maxWidth?: SignalOrPrimitive<Size>;
    maxHeight?: SignalOrPrimitive<Size>;
    aspectRatio?: SignalOrPrimitive<number>;
    flexGrow?: SignalOrPrimitive<number>;
    flexShrink?: SignalOrPrimitive<number>;
    flexBasis?: SignalOrPrimitive<Size>;
    rowGap?: SignalOrPrimitive<number>;
    columnGap?: SignalOrPrimitive<number>;
    positionType?: PositionType;
    top?: SignalOrPrimitive<Size>;
    right?: SignalOrPrimitive<Size>;
    bottom?: SignalOrPrimitive<Size>;
    left?: SignalOrPrimitive<Size>;
    objectFit?: ObjectFit;
    objectPosition?: ObjectPosition;
    transformOrigin?: TransformOrigin;
    children?: any[];
    flexDirection?: FlexDirection;
    justifyContent?: JustifyContent;
    alpha?: SignalOrPrimitive<number>;
    margin?: EdgeSize;
    padding?: EdgeSize;
    border?: EdgeSize;
    absolute?: SignalOrPrimitive<boolean>;
    scale?: SignalOrPrimitive<{ x: number, y: number } | number>;
    anchor?: SignalOrPrimitive<{ x: number, y: number }>;
    skew?: SignalOrPrimitive<{ x: number, y: number }>;
    tint?: SignalOrPrimitive<number>;
    rotation?: SignalOrPrimitive<number>;
    angle?: SignalOrPrimitive<number>;
    zIndex?: SignalOrPrimitive<number>;
    roundPixels?: SignalOrPrimitive<boolean>;
    cursor?: SignalOrPrimitive<string>;
    visible?: SignalOrPrimitive<boolean>;
    pivot?: SignalOrPrimitive<{ x: number, y: number }>;
    filters?: any[];
    blendMode?: SignalOrPrimitive<PIXI.BLEND_MODES>;
    blur?: SignalOrPrimitive<number>;

    // Directives
    drag?: DragProps;
    viewportFollow?: ViewportFollowProps;
    shake?: ShakeProps;
    flash?: FlashProps;

    // Events
    click?: PIXI.FederatedEventHandler;
    mousedown?: PIXI.FederatedEventHandler;
    mouseenter?: PIXI.FederatedEventHandler;
    mouseleave?: PIXI.FederatedEventHandler;
    mousemove?: PIXI.FederatedEventHandler;
    mouseout?: PIXI.FederatedEventHandler;
    mouseover?: PIXI.FederatedEventHandler;
    mouseup?: PIXI.FederatedEventHandler;
    mouseupoutside?: PIXI.FederatedEventHandler;
    pointercancel?: PIXI.FederatedEventHandler;
    pointerdown?: PIXI.FederatedEventHandler;
    pointerenter?: PIXI.FederatedEventHandler;
    pointerleave?: PIXI.FederatedEventHandler;
    pointermove?: PIXI.FederatedEventHandler;
    pointerout?: PIXI.FederatedEventHandler;
    pointerover?: PIXI.FederatedEventHandler;
    pointertap?: PIXI.FederatedEventHandler;
    pointerup?: PIXI.FederatedEventHandler;
    pointerupoutside?: PIXI.FederatedEventHandler;
    rightclick?: PIXI.FederatedEventHandler;
    rightdown?: PIXI.FederatedEventHandler;
    rightup?: PIXI.FederatedEventHandler;
    rightupoutside?: PIXI.FederatedEventHandler;
    tap?: PIXI.FederatedEventHandler;
    touchcancel?: PIXI.FederatedEventHandler;
    touchend?: PIXI.FederatedEventHandler;
    touchendoutside?: PIXI.FederatedEventHandler;
    touchmove?: PIXI.FederatedEventHandler;
    touchstart?: PIXI.FederatedEventHandler;
    wheel?: PIXI.FederatedEventHandler<PIXI.FederatedWheelEvent>;
    tabindex?: SignalOrPrimitive<number>;
}