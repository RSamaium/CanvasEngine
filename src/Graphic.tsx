import { useDisplayObject } from './hooks/DisplayObject';
import { CanvasGraphics } from './services/Graphic';
import { memo, useEffect, useMemo } from 'react';
import { DisplayObjectProps } from './types/DisplayObject';

export const Graphic = (props: DisplayObjectProps & { draw: (g: CanvasGraphics) => void }) => {
    //const graphics = useMemo(() => new CanvasGraphics(), [])


    // useEffect(() => {
    //     props.draw(graphics)
 
    //     return () => {
    //         //graphics.destroy()
    //     }
    // }, [props.draw])

    // const { element } = useDisplayObject(graphics, props)
    return new CanvasGraphics();
}