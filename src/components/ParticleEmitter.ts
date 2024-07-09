import * as particles from '@pixi/particle-emitter';
import { createComponent, registerComponent } from '../engine/reactive';
import { CanvasContainer } from './Container';

class CanvasParticlesEmitter extends CanvasContainer {
    private emitter: particles.Emitter | null
    private elapsed: number = Date.now()

    onMount(params) {
        super.onMount(params)
        const { props } = params
        this.emitter = new particles.Emitter(this, props.config)
        //this.emitter.emit = true
    }

    onUpdate(props) {

    }

    onDestroy(): void {
        super.onDestroy()
        this.emitter?.destroy();
        this.emitter = null;
        this.subscriptionTick.unsubscribe()
    }

    render(params) {
        super.render(params)
        if (!this.emitter) return
        const now = Date.now()
        this.emitter.update((now - this.elapsed) * 0.001);
        this.elapsed = now
    }
}

registerComponent('ParticlesEmitter', CanvasParticlesEmitter)

export function ParticlesEmitter(props) {
    return createComponent('ParticlesEmitter', props)
}