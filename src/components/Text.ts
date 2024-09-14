import { Text as PixiText, TextStyle } from 'pixi.js';
import { createComponent, registerComponent } from '../engine/reactive';
import { DisplayObject } from './DisplayObject';
import { DisplayObjectProps } from './types/DisplayObject';

interface TextProps extends DisplayObjectProps {
  text?: string;
  style?: Partial<TextStyle>;
}

class CanvasText extends DisplayObject(PixiText) {
    onUpdate(props: TextProps) {
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

export function Text(props: TextProps) {
    return createComponent('Text', props)
}