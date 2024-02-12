import { Graphics } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { registerComponent } from '../engine/reactive';
import { effect } from '../engine/signal';

class CanvasGraphics extends DisplayObject(Graphics) {
    onInit(props) {
        super.onInit(props)
        if (props.draw) {
            effect(() => {
                props.draw(this)
            })
        }
    }
}

interface CanvasGraphics extends Graphics { }

registerComponent('Graphic', CanvasGraphics)