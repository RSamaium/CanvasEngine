import { CanvasContainer } from './services/Container';
import { useDisplayObject } from './hooks/DisplayObject';
import { memo, useEffect, useMemo } from 'react';
import { Container as PixiContainer } from 'pixi.js';
import { DisplayObjectProps } from './types/DisplayObject';

export const Container = (props: DisplayObjectProps) => {
    console.log(props)
    return new PixiContainer();
}

Container.displayName = 'Container';

export interface ContainerProps extends PixiContainer {}