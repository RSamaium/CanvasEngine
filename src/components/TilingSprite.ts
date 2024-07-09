import { TilingSprite as PixiTilingSprite, Texture } from 'pixi.js';
import { createComponent, registerComponent } from '../engine/reactive';
import { DisplayObject } from './DisplayObject';

class CanvasTilingSprite extends DisplayObject(PixiTilingSprite) {
    onUpdate(props: any): void {
        console.log(props)
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
        if (props.width) {
            this.width = props.width;
        }
        if (props.height) {
            this.height = props.height;
        }
    }
}

registerComponent('TilingSprite', CanvasTilingSprite)

export function TilingSprite(props) {
    return createComponent('TilingSprite', props)
}