import { Viewport as PixiViewport } from 'pixi-viewport'
import { DisplayObject } from './DisplayObject';
import { createComponent, registerComponent } from '../engine/reactive';
import { Signal } from '../engine/signal';
import { Subscription } from 'rxjs';

export class CanvasViewport extends DisplayObject(PixiViewport) {
    private tickSubscription: Subscription

    constructor() {
        const defaultOptions = {
            noTicker: true,
            events: {
                domElement: {
                    addEventListener: () => {}
                }
            }
        }
        // @ts-ignore
        super(defaultOptions) 
    }

    onMount(element) {
        super.onMount(element)
        const { tick, renderer } = element.props.context

        renderer.events.domElement.addEventListener(
            'wheel',
            this.input.wheelFunction
        );
        this.options.events = renderer.events
            
        this.tickSubscription = tick.observable.subscribe(({ deltaTime }) => {
            this.update(deltaTime)
        })

        element.props.context.viewport = this
    }

    onUpdate(props) {
        super.onUpdate(props)
        if (props.drag) {
            this.drag()
        }
        if (props.screenWidth) {
            this.screenWidth = props.screenWidth
        }
        if (props.screenHeight) {
            this.screenHeight = props.screenHeight
        }
        if (props.worldWidth) {
            this.worldWidth = props.worldWidth
        }
        if (props.worldHeight) {
            this.worldHeight = props.worldHeight
        }
        if (props.clamp) {
            this.clamp(props.clamp)
        }
    }

    onDestroy(): void {
        super.onDestroy()
        this.tickSubscription.unsubscribe()
    }
}

export interface CanvasViewport extends PixiViewport { }

registerComponent('Viewport', CanvasViewport)

export function Viewport(props) {
    return createComponent('Viewport', props)
}