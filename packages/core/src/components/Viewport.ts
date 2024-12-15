import { Viewport as PixiViewport } from 'pixi-viewport';
import { Subscription } from 'rxjs';
import { createComponent, registerComponent } from '../engine/reactive';
import { DisplayObject } from './DisplayObject';
import { effect } from '@signe/reactive';

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
            const camelCaseEvent = event.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (props[camelCaseEvent]) {
                this.on(event, props[camelCaseEvent])
            }
        }
    }

    onMount(element) {
        super.onMount(element)
        const { tick, renderer, canvasSize } = element.props.context
        let isDragging = false
        
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
        // if (props.drag) {
        //     if (props.drag === true) {
                
        //     } else {
        //         this.drag(props.drag)
        //     }
        // }
        if (props.clamp) {
            this.clamp(props.clamp)
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