import React, { useRef, useEffect, useContext, useState } from 'react';
import { PixiAppContext } from '../contexts/CanvasContext';
import { ContainerContext } from '../contexts/ContainerContext';
import { setChangeLayout } from '../stores/canvas';
import { DisplayObjectProps } from '../types/DisplayObject';
import { MouseEvent } from '../types/MouseEvent';

export function useDisplayObject(object, props: DisplayObjectProps & MouseEvent) {
    const { children, ...otherProps } = props;
    const { pixiApp, isRootCanvas } = useContext(PixiAppContext);
    const parentContainerRef = useContext(ContainerContext);
    const containerRef = useRef(object);
    const [renderChild, setRenderChild] = useState(false);

    useEffect(() => {
        // Gérer les événements et les styles en fonction des changements de props
        const applyPropsToContainer = (container, props) => {
            const { onClick, width, height, x, y, absolute, alpha, flexDirection, justifyContent } = props;

            if (onClick) {
                container.eventMode = 'static';
                container.on('click', onClick); 
            }

            if (width !== undefined) container.setWidth(width);
            if (height !== undefined) container.setHeight(height);
            if (x !== undefined) {
                container.setX(x);
                
            }
            if (y !== undefined) container.setY(y);
            if (absolute) container.setPositionType('absolute');
            else container.setPositionType('relative');
            if (alpha !== undefined) container.alpha = alpha;
            if (flexDirection) container.setFlexDirection(flexDirection);
            if (justifyContent) container.setJustifyContent(justifyContent);
        };

        applyPropsToContainer(containerRef.current, otherProps);

    }, [...Object.values(otherProps)]);

    useEffect(() => {
        if (parentContainerRef) {
            parentContainerRef.insertChild(containerRef.current);
        } else {
            pixiApp.insertChild(containerRef.current);
        }

        // pixiApp.calculateLayout();
        // setChangeLayout();

        setRenderChild(true);

        return () => { };
    }, []);

    return {
        element: (
            <ContainerContext.Provider value={containerRef.current}>
                {renderChild && children}
            </ContainerContext.Provider>
        )
    };
}
