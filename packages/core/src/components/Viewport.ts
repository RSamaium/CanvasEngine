import { Viewport as PixiViewport } from 'pixi-viewport';
import { Subscription } from 'rxjs';
import { createComponent, registerComponent, Element, Props } from '../engine/reactive';
import { DisplayObject, ComponentInstance } from './DisplayObject';
import { effect, Signal } from '@signe/reactive';
import { Graphics, Container } from 'pixi.js';

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

export class CanvasViewport extends DisplayObject(Container) {
    private tickSubscription: Subscription
    overrideProps = ['wheel']
    #mask: Graphics
    public viewport: PixiViewport

    constructor() {
        super()
        const defaultOptions = {
            noTicker: true,
            events: {
                domElement: {
                    addEventListener: () => { }
                }
            },
        }
        // @ts-ignore
        this.viewport = new PixiViewport(defaultOptions)
        super.addChild(this.viewport)

        this.#mask = new Graphics()
        super.addChild(this.#mask)
        this.mask = this.#mask
    }

    addChild<U extends any[]>(...children: U): U[0] {
        return this.viewport.addChild(...children)
    }

    addChildAt<U extends any>(child: U, index: number): U {
        return this.viewport.addChildAt(child, index)
    }

    onInit(props) {
        super.onInit(props)
        for (let event of EVENTS) {
            if (props[event]) this.viewport.on(event, props[event])
        }
    }

    /**
     * Called when the component is mounted to the scene graph.
     * Initializes viewport settings and subscriptions.
     * @param {Element<CanvasViewport>} element - The element being mounted. Its `props` property (of type ViewportProps) contains component properties and context.
     * @param {number} [index] - The index of the component among its siblings.
     */
    async onMount(element: Element<CanvasViewport>, index?: number): Promise<void> {
        element.props.context.viewport = this.viewport
        await super.onMount(element, index);
        const { props } = element;
        const { tick, app, canvasSize } = props.context;

        effect(() => {
            if (props.screenWidth === undefined) {
                this.viewport.screenWidth = canvasSize().width
            }
            if (props.screenHeight === undefined) {
                this.viewport.screenHeight = canvasSize().height
            }
            this.updateMask()
        })

        effect(() => {
            const _app = app()
            if (!_app) return

            const renderer = _app.renderer

            renderer.events.domElement.addEventListener(
                'wheel',
                this.viewport.input.wheelFunction
            );

            this.viewport.options.events = renderer.events
        })

        this.tickSubscription = tick.observable.subscribe(({ value }) => {
            this.viewport.update(value.deltaTime)
        })

        this.updateViewportSettings(props)
    }

    onUpdate(props) {
        super.onUpdate(props)
        this.updateViewportSettings(props)
    }

    private updateViewportSettings(props) {
        if (props.screenWidth !== undefined) {
            this.viewport.screenWidth = props.screenWidth
        }
        if (props.screenHeight !== undefined) {
            this.viewport.screenHeight = props.screenHeight
        }
        this.updateMask()
        if (props.worldWidth !== undefined) {
            this.viewport.worldWidth = props.worldWidth
        }
        if (props.worldHeight !== undefined) {
            this.viewport.worldHeight = props.worldHeight
        }
        if (props.drag) {
            this.viewport.drag(props.drag)
        }
        if (props.clamp) {
            this.viewport.clamp(props.clamp.value ?? props.clamp)
        }
        if (props.wheel) {
            if (props.wheel === true) {
                this.viewport.wheel()
            } else {
                this.viewport.wheel(props.wheel)
            }
        }
        if (props.decelerate) {
            if (props.decelerate === true) {
                this.viewport.decelerate()
            } else {
                this.viewport.decelerate(props.decelerate)
            }
        }
        if (props.pinch) {
            if (props.pinch === true) {
                this.viewport.pinch()
            } else {
                this.viewport.pinch(props.pinch)
            }
        }
    }

    private updateMask() {
        if (!this.#mask) return
        this.#mask.clear()
        this.#mask.beginFill(0xffffff)
        this.#mask.drawRect(0, 0, this.viewport.screenWidth, this.viewport.screenHeight)
        this.#mask.endFill()
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

    // Proxy methods for viewport plugins
    follow(...args: any[]) {
        return (this.viewport.follow as any)(...args)
    }

    get plugins() {
        return this.viewport.plugins
    }
}

registerComponent('Viewport', CanvasViewport)

export function Viewport(props: ViewportProps) {
    return createComponent('Viewport', props);
}