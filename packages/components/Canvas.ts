import { Container as PixiContainer, Renderer, autoDetectRenderer } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { registerComponent } from '../engine/reactive';

registerComponent('Canvas', class Canvas extends DisplayObject(PixiContainer) {
    private renderer: Renderer;

    onInsert() {
        super.onInsert()
        this.renderer = autoDetectRenderer()
        document.body.appendChild(this.renderer.view)
    }
})