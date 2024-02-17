import { Text as PixiText } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { createComponent, registerComponent } from '../engine/reactive';

class CanvasText extends DisplayObject(PixiText) {
    onUpdate(props) {
        super.onUpdate(props)
        if (props.text) {
            this.text = props.text
        }
        if (props.style) {
            this.style = {
                ...this.style,
                ...props.style
            }
        }
    }
}

interface CanvasText extends PixiText { }

registerComponent('Text', CanvasText)

export function Text(props) {
    return createComponent('Text', props)
}