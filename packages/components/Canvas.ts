import { Container as PixiContainer, Renderer, autoDetectRenderer } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { Props, createComponent, registerComponent } from '../engine/reactive';
import { loadYoga } from 'yoga-layout';
import { Scheduler } from '../directives/Scheduler';
import { effect, signal } from '../engine/signal';

registerComponent('Canvas', class Canvas extends DisplayObject(PixiContainer) { })

export async function Canvas(props: Props) {
    const Yoga = await loadYoga()
    const renderer = autoDetectRenderer(props)
    document.body.appendChild(renderer.view)
    const options: any = {
        ...props,
        context: {
            Yoga
        },
    }
    if (!props.tick) {
        options.tick = signal(null)
    }
    const canvasElement = createComponent('Canvas', options)
    effect(() => {
        canvasElement.propObservables.tick()
        renderer.render(canvasElement.componentInstance as any)
    })
}