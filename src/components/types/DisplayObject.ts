import React from "react";
import * as PIXI from "pixi.js";
import { EVENTS } from "../DisplayObject";
import { SignalOrPrimitive } from ".";

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
export type AlignContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
export type Size = number | `${number}%`
export type EdgeSize = Size | [Size, Size] | [Size, Size, Size, Size]

export interface DisplayObjectProps extends PIXI.IDisplayObjectOptions {
    x?: SignalOrPrimitive<number>;
    y?: SignalOrPrimitive<number>;
    width?: SignalOrPrimitive<Size>;
    height?: SignalOrPrimitive<Size>;
    children?: React.ReactNode;
    flexDirection?: FlexDirection;
    justifyContent?: JustifyContent;
    alpha?: number;
    margin?: EdgeSize;
    padding?: EdgeSize;
    border?: EdgeSize;
    absolute?: boolean;
    scale?: { x: number, y: number } | number;
    anchor?: { x: number, y: number };
    skew?: { x: number, y: number };
    tint?: number;
    rotation?: number;
    angle?: number;
    zIndex?: number;
    roundPixels?: boolean;
    cursor?: string;
    visible?: boolean;
    pivot?: { x: number, y: number };
    filters?: any[];

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
}