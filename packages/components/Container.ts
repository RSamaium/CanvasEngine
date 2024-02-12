import { Container as PixiContainer } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { h, registerComponent } from '../engine/reactive';

class CanvasContainer extends DisplayObject(PixiContainer) {}

interface CanvasContainer extends PixiContainer { }

registerComponent('Container', CanvasContainer)

export function Container(props) {
    return h('Container', props)
}