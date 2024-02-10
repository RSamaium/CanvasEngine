import { memo, useCallback, useContext, useRef } from "react";
import { Graphic } from "../Graphic";
import { $changeLayout } from "../stores/canvas";
import { CanvasGraphics } from "../services/Graphic";
import { PixiAppContext } from "../contexts/CanvasContext";

export const Rectangle = function (props) {

    // const draw = useCallback(
    //     (g: CanvasGraphics) => {
    //         // $changeLayout.listen(() => {
    //         //     const { width, height } = g.getComputedLayout()
    //         //     g.clear();
    //         //     g.beginFill(props.color);
    //         //     g.drawRect(props.x, props.y, width, height);
    //         //     g.endFill();
    //         // })

            // g.clear();
            // g.beginFill(props.color);
            // g.drawRect(props.x, props.y, props.width, props.height);
            // g.endFill();

    //     },
    //     [props],
    // );

    const g =  new CanvasGraphics();
    g.clear();
    g.beginFill(props.color);
    g.drawRect(props.x, props.y, props.width, props.height);
    g.endFill();
    return g
}