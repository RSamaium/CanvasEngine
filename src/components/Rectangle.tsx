import { useCallback } from "react";
import { Graphic } from "../Graphic";

export function Rectangle(props) {
    const draw = useCallback(
        (g) => {
            g.clear();
            g.beginFill(props.color);
            g.drawRect(props.x, props.y, props.width, props.height);
            g.endFill();
        },
        [props],
    );

    return <Graphic draw={draw} {...props} />
}