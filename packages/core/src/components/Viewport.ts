import { Viewport as PixiViewport } from 'pixi-viewport';
import { Subscription } from 'rxjs';
import { createComponent, registerComponent, Element, Props } from '../engine/reactive';
import { DisplayObject, ComponentInstance } from './DisplayObject';
import { effect, Signal } from '@signe/reactive';

const EVENTS = [
    'bounce-x-end',
    'bounce-x-start',
    'bounce-y-end',
    'bounce-y-start',
    'clicked',
    'drag-end',
    'drag-start',
    'frame-end',
    'mouse-edge-end',
    'mouse-edge-start',
    'moved',
    'moved-end',
    'pinch-end',
    'pinch-start',
    'snap-end',
    'snap-start',
    'snap-zoom-end',
    'snap-zoom-start',
    'wheel-scroll',
    'zoomed',
    'zoomed-end'
]

export interface ViewportProps extends Props {
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
    context?: any;
    [key: string]: any;
}

export class CanvasViewport extends DisplayObject(PixiViewport) {
    private tickSubscription: Subscription
    overrideProps = ['wheel']

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

    onInit(props) {
        super.onInit(props)
        for (let event of EVENTS) {
            if (props[event]) this.on(event, props[event])
        }
    }

    /**
     * Called when the component is mounted to the scene graph.
     * Initializes viewport settings and subscriptions.
     * @param {Element<CanvasViewport>} element - The element being mounted. Its `props` property (of type ViewportProps) contains component properties and context.
     * @param {number} [index] - The index of the component among its siblings.
     */
    async onMount(element: Element<CanvasViewport>, index?: number): Promise<void> {
        await super.onMount(element, index);
        const { props } = element;
        const { tick, app, canvasSize } = props.context;
        let isDragging = false
        
        effect(() => {
            this.screenWidth = canvasSize().width
            this.screenHeight = canvasSize().height
        })

        effect(() => {
            const _app = app()
            if (!_app) return

            const renderer = _app.renderer
            
            renderer.events.domElement.addEventListener(
                'wheel',
                this.input.wheelFunction
            );

            this.options.events = renderer.events
        })
 
        this.tickSubscription = tick.observable.subscribe(({ value }) => {
            this.update(value.timestamp)
        })

        element.props.context.viewport = this
        this.updateViewportSettings(props)
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
        if (props.drag) {
            this.drag(props.drag)
        }
        if (props.clamp) {
            this.clamp(props.clamp.value ?? props.clamp)
        }
        if (props.wheel) {
            if (props.wheel === true) {
                this.wheel()
            } else {
                this.wheel(props.wheel)
            }
        }
        if (props.decelerate) {
            if (props.decelerate === true) {
                this.decelerate()
            } else {
                this.decelerate(props.decelerate)
            }
        }
        if (props.pinch) {
            if (props.pinch === true) {
                this.pinch()
            } else {
                this.pinch(props.pinch)
            }
        }
    }

    /**
     * Called when the component is about to be destroyed.
     * Unsubscribes from the tick observable.
     * @param {Element<any>} parent - The parent element.
     * @param {() => void} [afterDestroy] - An optional callback function to be executed after the component's own destruction logic.
     */
    async onDestroy(parent: Element<any>, afterDestroy?: () => void): Promise<void> {
        const _afterDestroy = async () => {
            this.tickSubscription.unsubscribe()
            afterDestroy()
        }
        await super.onDestroy(parent, _afterDestroy);
    }
}

registerComponent('Viewport', CanvasViewport)

export function Viewport(props: ViewportProps) {
    return createComponent('Viewport', props);
}