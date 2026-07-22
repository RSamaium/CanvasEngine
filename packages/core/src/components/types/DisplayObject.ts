import * as PIXI from "pixi.js";
import { SignalOrPrimitive } from ".";
import { DragProps } from "../../directives/Drag";
import { ViewportFollowProps } from "../../directives/ViewportFollow";
import { ShakeProps } from "../../directives/Shake";
import { FlashProps } from "../../directives/Flash";
import { FogVisibilityProps } from "../../directives/FogVisibility";
import type { ClipProps, OcclusionProps, OutlineProps } from "../../directives/SpriteEffects";

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse';
export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignContent = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
export type AlignSelf = 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
export type Size = number | `${number}%`
export type EdgeSizeValue = Size | [Size, Size] | [Size, Size, Size, Size];
export type EdgeSize = EdgeSizeValue;
export type LayoutBorder = number | [number, number] | [number, number, number, number];
export type PixiStrokeObject = Extract<
    NonNullable<Parameters<PIXI.Graphics["stroke"]>[0]>,
    object
>;
export type Border = LayoutBorder | PixiStrokeObject;
export type ObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
export type ObjectPosition = string;
export type TransformOrigin = string;
export type PositionType = 'relative' | 'absolute' | 'static';
export type Display = 'flex' | 'none';

export type ObservablePointSignal = [number, number] | SignalOrPrimitive<[number, number]> | { x: number, y: number } | SignalOrPrimitive<{ x: number, y: number }>;

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
    display?: SignalOrPrimitive<Display>;
    aspectRatio?: SignalOrPrimitive<number>;
    flexGrow?: SignalOrPrimitive<number>;
    flexShrink?: SignalOrPrimitive<number>;
    flexBasis?: SignalOrPrimitive<Size>;
    flexWrap?: SignalOrPrimitive<FlexWrap>;
    gap?: SignalOrPrimitive<Size>;
    rowGap?: SignalOrPrimitive<Size>;
    columnGap?: SignalOrPrimitive<Size>;
    positionType?: SignalOrPrimitive<PositionType>;
    top?: SignalOrPrimitive<Size>;
    right?: SignalOrPrimitive<Size>;
    bottom?: SignalOrPrimitive<Size>;
    left?: SignalOrPrimitive<Size>;
    objectFit?: SignalOrPrimitive<ObjectFit>;
    objectPosition?: SignalOrPrimitive<ObjectPosition>;
    transformOrigin?: SignalOrPrimitive<TransformOrigin>;
    children?: any[];
    flexDirection?: SignalOrPrimitive<FlexDirection>;
    justifyContent?: SignalOrPrimitive<JustifyContent>;
    alignItems?: SignalOrPrimitive<AlignItems>;
    alignContent?: SignalOrPrimitive<AlignContent>;
    alignSelf?: SignalOrPrimitive<AlignSelf>;
    alpha?: SignalOrPrimitive<number>;
    margin?: SignalOrPrimitive<EdgeSize>;
    padding?: SignalOrPrimitive<EdgeSize>;
    border?: SignalOrPrimitive<Border>;
    absolute?: SignalOrPrimitive<boolean>;
    scale?: ObservablePointSignal | number;
    anchor?: ObservablePointSignal;
    skew?: ObservablePointSignal;
    tint?: SignalOrPrimitive<number>;
    rotation?: SignalOrPrimitive<number>;
    angle?: SignalOrPrimitive<number>;
    zIndex?: SignalOrPrimitive<number>;
    roundPixels?: SignalOrPrimitive<boolean>;
    cursor?: SignalOrPrimitive<string>;
    visible?: SignalOrPrimitive<boolean>;
    pivot?: ObservablePointSignal;
    filters?: any[];
    blendMode?: SignalOrPrimitive<PIXI.BLEND_MODES>;
    blur?: SignalOrPrimitive<number>;
    /**
     * Optional metadata used by presets (for example `SpriteShadows`)
     * to mark this display object as a shadow caster.
     */
    shadowCaster?: any;
    /**
     * Optional metadata used by presets (for example `Footprints`)
     * to mark this display object as a footprint caster.
     */
    footprintCaster?: any;

    // Directives
    drag?: DragProps;
    viewportFollow?: ViewportFollowProps;
    shake?: ShakeProps;
    flash?: FlashProps;
    fogVisibility?: FogVisibilityProps;
    outline?: OutlineProps;
    clip?: ClipProps;
    occlusion?: OcclusionProps;

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
