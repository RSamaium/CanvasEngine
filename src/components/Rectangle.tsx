import { useCallback } from "react";
import { Graphic } from "../Graphic";
import { $changeLayout } from "../stores/canvas";
import { CanvasGraphics } from "../services/Graphic";

export function Rectangle(props) {
    const draw = useCallback(
        (g: CanvasGraphics) => {
            console.log(g.node.getMaxWidth())
            g.clear();
            g.beginFill(props.color);
            g.drawRect(props.x, props.y, props.width, props.height);
            g.endFill();
        },
        [props],
    );

    return <Graphic draw={draw} {...props} />
}