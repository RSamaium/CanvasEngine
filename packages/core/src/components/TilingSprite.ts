import { TilingSprite as PixiTilingSprite, Texture } from 'pixi.js';
import { createComponent, registerComponent } from '../engine/reactive';
import { DisplayObject } from './DisplayObject';
import { DisplayObjectProps } from './types/DisplayObject';

interface TilingSpriteProps extends DisplayObjectProps {
    image?: string;
    tileScale?: { x: number; y: number };
    tilePosition?: { x: number; y: number };
    width?: number;
    height?: number;
}

class CanvasTilingSprite extends DisplayObject(PixiTilingSprite) {
    onUpdate(props: TilingSpriteProps): void {
        super.onUpdate(props);
        if (props.image) {
            this.texture = Texture.from(props.image);
        }
        if (props.tileScale) {
            this.tileScale.set(props.tileScale.x, props.tileScale.y);
        }
        if (props.tilePosition) {
            this.tilePosition.set(props.tilePosition.x, props.tilePosition.y);
        }
        if (props.width !== undefined) {
            this.width = props.width;
        }
        if (props.height !== undefined) {
            this.height = props.height;
        }
    }
}

registerComponent('TilingSprite', CanvasTilingSprite)

export function TilingSprite(props: TilingSpriteProps) {
    return createComponent('TilingSprite', props)
}