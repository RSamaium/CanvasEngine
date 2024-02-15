import { Container as PixiContainer } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { createComponent, registerComponent } from '../engine/reactive';

export class CanvasContainer extends DisplayObject(PixiContainer) {}

export interface CanvasContainer extends PixiContainer { }

registerComponent('Container', CanvasContainer)

export function Container(props) {
    return createComponent('Container', props)
}