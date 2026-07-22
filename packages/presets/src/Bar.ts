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
  const graphicsProps = { ...opts };
  // Bar.border is a Pixi stroke, not the DisplayObject/Yoga border prop.
  delete graphicsProps.border;

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

  return h(Graphics, {
    ...graphicsProps,
    width,
    height,
    draw(graphics: any) {
      const barWidth = width();
      const barHeight = height();
      const radius = borderRadius();

      if (radius) {
        graphics.roundRect(0, 0, barWidth, barHeight, radius);
      } else {
        graphics.rect(0, 0, barWidth, barHeight);
      }
      if (border) {
        graphics.stroke(border);
      }
      graphics.fill(backgroundColor());

      const margin = innerMargin();
      const fillWidth = Math.max(
        0,
        Math.min(
          barWidth - 2 * margin,
          (value() / maxValue()) * (barWidth - 2 * margin)
        )
      );
      const fillHeight = barHeight - 2 * margin;

      if (radius) {
        graphics.roundRect(margin, margin, fillWidth, fillHeight, radius);
      } else {
        graphics.rect(margin, margin, fillWidth, fillHeight);
      }

      const color = foregroundColor();
      if (color.startsWith("rgba")) {
        const [r, g, b, a] = color.match(/\d+(\.\d+)?/g).map(Number);
        graphics.fill({ color: rgbToHex(r, g, b), alpha: a });
      } else {
        graphics.fill(color);
      }
    },
  });
}
