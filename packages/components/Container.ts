import { Container as PixiContainer } from 'pixi.js';
import { DisplayObject } from './DisplayObject';

class Container extends DisplayObject(PixiContainer) {
    onInsert(parent) {
        parent.addChild(this);
    }
}

export interface Container extends PixiContainer { }