import { Viewport as PixiViewport } from 'pixi-viewport';
import pkg from 'pixi-viewport';

import { Subscription } from 'rxjs';
import { createComponent, registerComponent } from '../engine/reactive';
import { DisplayObject } from './DisplayObject';
import { effect } from '@signe/reactive';

export class CanvasViewport extends DisplayObject(PixiViewport) {
    private tickSubscription: Subscription

    constructor() {
        const defaultOptions = {
            noTicker: true,
            events: {
                domElement: {
                    addEventListener: () => {}
                }
            },
        }
        // @ts-ignore
        super(defaultOptions) 
    }

    onMount(element) {
        super.onMount(element)
        const { tick, renderer, canvasSize } = element.props.context
        
        effect(() => {
            this.screenWidth = canvasSize().width
            this.screenHeight = canvasSize().height
        })

        renderer.events.domElement.addEventListener(
            'wheel',
            this.input.wheelFunction
        );
        this.options.events = renderer.events
 
        this.tickSubscription = tick.observable.subscribe(({ value }) => {
            this.update(value.timestamp)
        })

        element.props.context.viewport = this
        this.updateViewportSettings(element.props)
    }

    onUpdate(props) {
        super.onUpdate(props)
        this.updateViewportSettings(props)
    }

    private updateViewportSettings(props) {
        if (props.screenWidth !== undefined) {
            this.screenWidth = props.screenWidth
        }
        if (props.screenHeight !== undefined) {
            this.screenHeight = props.screenHeight
        }
        if (props.worldWidth !== undefined) {
            this.worldWidth = props.worldWidth
        }
        if (props.worldHeight !== undefined) {
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

export interface ViewportProps {
    screenWidth?: number;
    screenHeight?: number;
    worldWidth?: number;
    worldHeight?: number;
    clamp?: boolean | {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    };
    [key: string]: any;
}

export function Viewport(props: ViewportProps) {
    return createComponent('Viewport', props);
}