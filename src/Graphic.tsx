import { DisplayObjectProps, useDisplayObject } from './hooks/DisplayObject';
import { CanvasGraphics } from './services/Graphic';
import { useEffect } from 'react';

export function Graphic(props: DisplayObjectProps & { draw: (g: CanvasGraphics) => void }) {
    const graphics = new CanvasGraphics()

    useEffect(() => {
        props.draw(graphics)

        return () => {
            graphics.destroy()
        }
    }, [props.draw])

    const { element } = useDisplayObject(graphics, props)
    return element;
}