import React, { useRef, useEffect, useContext, useState } from 'react';
import { PixiAppContext } from '../contexts/CanvasContext';
import { ContainerContext } from '../contexts/ContainerContext';
import { setChangeLayout } from '../stores/canvas';

export interface DisplayObjectProps {
    x?: number;
    y?: number;
    width?: number | string;
    height?: number | string;
    children?: React.ReactNode
    flexDirection?: 'row' | 'column'
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around'
    alpha?: number
}

export function useDisplayObject(object, { children, x, y, width, height, flexDirection, justifyContent, alpha }: DisplayObjectProps) {
    const { pixiApp, isRootCanvas } = useContext(PixiAppContext);
    const parentContainerRef = useContext(ContainerContext);
    const containerRef = useRef(object);
    const [renderChild, setRenderChild] = useState(false);

    useEffect(() => {
        if (width !== undefined) {
            containerRef.current.setWidth(width)
        }
        if (height !== undefined) {
            containerRef.current.setHeight(height)
        }
    }, [width, height]);

    useEffect(() => {
        if (x != undefined) containerRef.current.x = x
        if (y != undefined) containerRef.current.y = y
        if (alpha != undefined) containerRef.current.alpha = alpha
    }, [x, y, alpha]);

    useEffect(() => {
        if (flexDirection) {
            containerRef.current.setFlexDirection(flexDirection)
        }
        if (justifyContent) {
            containerRef.current.setJustifyContent(justifyContent)
        }
        setRenderChild(true);
    }, [flexDirection, justifyContent]);

    useEffect(() => {
        if (parentContainerRef) {
            parentContainerRef.insertChild(containerRef.current);
        }
        else {
            pixiApp.insertChild(containerRef.current);
        }

        pixiApp.calculateLayout();
        setChangeLayout()

        return () => {
            if (parentContainerRef) {
                parentContainerRef.removeChild(containerRef.current);
            }
            else {
                pixiApp.removeChild(containerRef.current);
            }
        };
    }, [pixiApp]);

    return {
        element: (
            <ContainerContext.Provider value={containerRef.current}>
                {renderChild && children}
            </ContainerContext.Provider>
        )
    }
}