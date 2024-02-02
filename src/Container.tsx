import { CanvasContainer } from './services/Container';
import { DisplayObjectProps, useDisplayObject } from './hooks/DisplayObject';
import { useEffect, useMemo } from 'react';
import { Container as PixiContainer } from 'pixi.js';

export function Container(props: DisplayObjectProps) {
    const container = useMemo(() => new CanvasContainer(), [])
    const { element } = useDisplayObject(container, props)

    return element;
}

export interface ContainerProps extends PixiContainer {}