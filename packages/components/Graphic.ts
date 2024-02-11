import { Graphics } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { registerComponent } from '../engine/reactive';

registerComponent('Graphic', class CanvasGraphics extends DisplayObject(Graphics) {
    onInit(props) {
        this.beginFill(0xFF0000)
        this.drawRect(0, 0, 100, 100)
        this.endFill()
    }

    onUpdate(props) {
        this.x = props.x ?? 0
        this.y = props.y ?? 0
        
    }
})