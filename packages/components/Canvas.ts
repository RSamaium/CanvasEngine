import { Container as PixiContainer, Renderer, autoDetectRenderer } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { Props, h, registerComponent } from '../engine/reactive';
import { loadYoga } from 'yoga-layout';
import { Scheduler } from '../engine/Scheduler';

registerComponent('Canvas', class Canvas extends DisplayObject(PixiContainer) { })

export async function Canvas(props: Props) {
    const scheduler = new Scheduler()
    const Yoga = await loadYoga()
    const renderer = autoDetectRenderer()
    document.body.appendChild(renderer.view)
    const canvasElement = h('Canvas', {
        ...props,
        context: {
            scheduler,
            Yoga
        },
    })
    const instance = canvasElement.componentInstance
    scheduler.start()
    scheduler.tick.subscribe(() => {
        renderer.render(instance as any)
    })
}