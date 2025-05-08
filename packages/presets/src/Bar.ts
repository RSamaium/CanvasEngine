import { Graphics, h, useProps } from "canvasengine";
import * as PIXI from "pixi.js";

interface BarProps {
  backgroundColor?: string;
  foregroundColor?: string;
  value: number;
  maxValue: number;
  width: number;
  height: number;
  border?: any;
  innerMargin?: number;
  borderRadius?: number;
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function Bar(opts: BarProps) {
  const {
    width,
    height,
    value,
    maxValue,
    backgroundColor,
    foregroundColor,
    border,
    innerMargin,
    borderRadius,
  } = useProps(opts, {
    backgroundColor: "#000000",
    foregroundColor: "#FFFFFF",
    innerMargin: 0,
    borderRadius: 0,
  });

  return h(
    Graphics,
    {
      ...opts,
      width,
      height,
      draw(graphics: any) {
        if (borderRadius()) {
          graphics.roundRect(0, 0, width(), height(), borderRadius());
        } else {
          graphics.rect(0, 0, width(), height());
        }
        if (border) {
          graphics.stroke(border);
        }
        graphics.fill(backgroundColor());
      },
    },
    h(Graphics, {
      width,
      height,
      draw(graphics: any) {
        const margin = innerMargin();
        const _borderRadius = borderRadius();
        const w = Math.max(
          0,
          Math.min(
            width() - 2 * margin,
            (value() / maxValue()) * (width() - 2 * margin)
          )
        );
        const h = height() - 2 * margin;
        if (borderRadius) {
          graphics.roundRect(margin, margin, w, h, _borderRadius);
        } else {
          graphics.rect(margin, margin, w, h);
        }
        const color = foregroundColor();
        if (color.startsWith("rgba")) {
          const [r, g, b, a] = color.match(/\d+(\.\d+)?/g).map(Number);
          graphics.fill({ color: rgbToHex(r, g, b), alpha: a });
        } else {
          graphics.fill(color);
        }
      },
    })
  );
}
