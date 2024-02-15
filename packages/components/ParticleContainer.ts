import { ParticleContainer as PixiParticleContainer } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { createComponent, registerComponent } from '../engine/reactive';

class CanvasParticleContainer extends DisplayObject(PixiParticleContainer) {
    onUpdate(props) {
        super.onUpdate(props)
        if (props.maxSize) {
            this.autoResize(props.maxSize)
        }
    }
}

interface CanvasParticleContainer extends PixiParticleContainer { }

registerComponent('ParticleContainer', CanvasParticleContainer)

export function ParticleContainer(props) {
    return createComponent('ParticleContainer', props)
}