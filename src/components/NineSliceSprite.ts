import { effect } from "@signe/reactive";
import { Assets, NineSliceSprite as PixiNineSliceSprite, Texture } from "pixi.js";
import { createComponent, registerComponent } from "../engine/reactive";
import { DisplayObject } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";

interface NineSliceSpriteProps extends DisplayObjectProps {
    image?: string;
    texture?: Texture;
    width?: number;
    height?: number;
    leftWidth?: number;
    rightWidth?: number;
    topHeight?: number;
    bottomHeight?: number;
    roundPixels?: boolean;
}

class CanvasNineSliceSprite extends DisplayObject(PixiNineSliceSprite) {
  constructor() {
    // @ts-ignore
    super({
        width: 0,
        height: 0
    });
  }

  async onUpdate(props: NineSliceSpriteProps) {
    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined) {
        if (key === 'image') {
          this.texture = await Assets.load(value);
        } else if (key in this) {
          (this as any)[key] = value;
        }
      }
    }
  }
}

interface CanvasNineSliceSprite extends PixiNineSliceSprite {}

registerComponent("NineSliceSprite", CanvasNineSliceSprite);

export function NineSliceSprite(props: NineSliceSpriteProps) {
  return createComponent("NineSliceSprite", props);
}
