import { effect } from "@signe/reactive";
import { Graphics } from "../components";
import { h } from "../engine/signal";
import * as PIXI from "pixi.js";
import { useProps } from "../hooks/useProps";

interface BarProps {
    backgroundColor?: string;
    foregroundColor?: string;
    value: number;
    maxValue: number;
    width: number;
    height: number;
}

export function Bar(opts: BarProps) {
    const { width, height, value, maxValue } = useProps(opts);
    const backgroundColor = opts.backgroundColor ?? "#000000";
    const foregroundColor = opts.foregroundColor ?? "#FFFFFF";

    effect(() => {
        console.log(opts.value());
    })

    return h(Graphics, {
        width,
        height,
        draw(g: PIXI.Graphics) {
            g.rect(0, 0, width(), height());
            g.fill(backgroundColor);
        }
    }, h(Graphics, {
        width: width * value / maxValue,
        height: height,
        draw(g: PIXI.Graphics) {
            g.rect(0, 0, width(), height());
            g.fill(foregroundColor);
        }
    }))
}