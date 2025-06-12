import { Viewport as PixiViewport } from 'pixi-viewport';
import { Subscription } from 'rxjs';
import { createComponent, registerComponent, Element, Props } from '../engine/reactive';
import { DisplayObject } from './DisplayObject';

export interface ScrollProps extends Props {
    follow?: any;
    screenWidth?: number;
    screenHeight?: number;
    worldWidth?: number;
    worldHeight?: number;
    drag?: boolean | object;
    wheel?: boolean | object;
    pinch?: boolean | object;
    decelerate?: boolean | object;
    clamp?: boolean | object | { left?: number; right?: number; top?: number; bottom?: number };
    context?: any;
    [key: string]: any;
}

export class ScrollViewport extends DisplayObject(PixiViewport) {
    private tickSubscription: Subscription;
    overrideProps = ['wheel'];

    constructor() {
        const defaultOptions = {
            noTicker: true,
            events: {
                domElement: {
                    addEventListener: () => {}
                }
            }
        };
        // @ts-ignore
        super(defaultOptions);
    }

    onInit(props) {
        super.onInit(props);
        if (props.follow) {
            this.follow(this.getTarget(props.follow));
        }
    }

    async onMount(element: Element<ScrollViewport>, index?: number): Promise<void> {
        await super.onMount(element, index);
        const { props } = element;
        const { tick, app, canvasSize } = props.context || {};

        if (canvasSize) {
            this.screenWidth = canvasSize().width;
            this.screenHeight = canvasSize().height;
        }

        if (tick) {
            this.tickSubscription = tick.observable.subscribe(({ value }) => {
                this.update(value.timestamp);
            });
        }

        if (app) {
            const renderer = app().renderer;
            renderer.events.domElement.addEventListener('wheel', this.input.wheelFunction);
            this.options.events = renderer.events;
        }

        element.props.context.viewport = this;
        this.updateViewportSettings(props);

        if (props.follow) {
            this.follow(this.getTarget(props.follow));
        }
    }

    onUpdate(props) {
        super.onUpdate(props);
        this.updateViewportSettings(props);
        if (props.follow) {
            this.follow(this.getTarget(props.follow));
        }
    }

    private updateViewportSettings(props: ScrollProps) {
        if (props.screenWidth !== undefined) this.screenWidth = props.screenWidth;
        if (props.screenHeight !== undefined) this.screenHeight = props.screenHeight;
        if (props.worldWidth !== undefined) this.worldWidth = props.worldWidth;
        if (props.worldHeight !== undefined) this.worldHeight = props.worldHeight;
        if (props.drag) this.drag(props.drag);
        if (props.clamp) this.clamp(props.clamp as any);
        if (props.wheel) {
            if (props.wheel === true) {
                this.wheel();
            } else {
                this.wheel(props.wheel);
            }
        }
        if (props.decelerate) {
            if (props.decelerate === true) {
                this.decelerate();
            } else {
                this.decelerate(props.decelerate);
            }
        }
        if (props.pinch) {
            if (props.pinch === true) {
                this.pinch();
            } else {
                this.pinch(props.pinch);
            }
        }
    }

    private getTarget(target: any) {
        return target?.componentInstance ?? target;
    }

    async onDestroy(parent: Element<any>, afterDestroy?: () => void): Promise<void> {
        const _afterDestroy = async () => {
            this.tickSubscription?.unsubscribe();
            afterDestroy && afterDestroy();
        };
        await super.onDestroy(parent, _afterDestroy);
    }
}

registerComponent('Scroll', ScrollViewport);

export function Scroll(props: ScrollProps) {
    return createComponent('Scroll', props);
}
