import { Container as PixiContainer, Renderer, autoDetectRenderer } from 'pixi.js';
import { DisplayObject } from './DisplayObject';
import { Props, createComponent, registerComponent } from '../engine/reactive';
import { loadYoga } from 'yoga-layout';
import { Scheduler } from '../directives/Scheduler';
import { effect, signal } from '../engine/signal';
import { Layer, Stage } from '@pixi/layers';
import { useProps } from '../hooks/useProps';

registerComponent('Canvas', class Canvas extends DisplayObject(Stage) { })

export async function Canvas(props: Props = {}) {
    const { cursorStyles } = useProps(props)
    const Yoga = await loadYoga()
    const renderer = autoDetectRenderer(props)

    if (props.canvasEl) {
        props.canvasEl.appendChild(renderer.view)
    }
    else {
        document.body.appendChild(renderer.view)
    }
    
    props.isRoot = true
    const options: any = {
        ...props,
        context: {
            Yoga,
            renderer
        },
    }
    if (!props.tick) {
        options.context.tick = options.tick = signal({
            timestamp: 0,
            deltaTime: 0,
            frame: 0,
            deltaRatio: 1
        })
    }
    const canvasElement = createComponent('Canvas', options)
    globalThis.__PIXI_STAGE__ = canvasElement.componentInstance;
    globalThis.__PIXI_RENDERER__ = renderer;
    effect(() => {
        canvasElement.propObservables!.tick()
        renderer.render(canvasElement.componentInstance as any)
    })

    if (cursorStyles) {
        effect(() => {
            renderer.events.cursorStyles = cursorStyles()
        })
    }
}