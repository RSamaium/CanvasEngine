import { Graphics as PixiGraphics } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { createComponent, registerComponent } from '../engine/reactive';
import { effect } from '../engine/signal';

class CanvasGraphics extends DisplayObject(PixiGraphics) {
    onInit(props) {
        super.onInit(props)
        if (props.draw) {
            effect(() => {
                props.draw(this)
            })
        }
    }
}

interface CanvasGraphics extends PixiGraphics { }

registerComponent('Graphics', CanvasGraphics)

export function Graphics(props) {
    return createComponent('Graphics', props)
}