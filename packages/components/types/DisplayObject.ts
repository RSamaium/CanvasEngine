import React from "react";

export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
export type AlignContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
export type Size = number | `${number}%`
export type EdgeSize = Size | [Size, Size] | [Size, Size, Size, Size]

export interface DisplayObjectProps {
    x?: number;
    y?: number;
    width?: Size;
    height?: Size;
    children?: React.ReactNode
    flexDirection?: FlexDirection
    justifyContent?: JustifyContent
    alpha?: number,
    margin?: EdgeSize
    padding?: EdgeSize
    border?: EdgeSize
    absolute?: boolean
}