import { ComponentInstance } from '../components/DisplayObject';
import { SignalOrPrimitive } from '../components/types';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { error } from '../engine/utils';
import { useProps } from '../hooks/useProps';

export type ViewportFollowProps = {
    viewportFollow?: boolean | {
        speed?: SignalOrPrimitive<number>;
        acceleration?: SignalOrPrimitive<number>;
        radius?: SignalOrPrimitive<number>;
    };
}

export class ViewportFollow extends Directive {
    onInit(element: Element<ComponentInstance>) {

    }
    onMount(element: Element) {
       this.onUpdate(element.props.viewportFollow, element)
    }
    onUpdate(viewportFollow: any, element: Element) {
        const { viewport } = element.props.context
        if (!viewport) {
            throw error('ViewportFollow directive requires a Viewport component to be mounted in the same context')
        }
        if (viewportFollow) {
            if (viewportFollow === true) {
                viewport.follow(element.componentInstance)
            } else {
                const options = useProps(viewportFollow, {
                    speed: undefined,
                    acceleration: undefined,
                    radius: undefined
                })
                viewport.follow(element.componentInstance, {
                    speed: options.speed(),
                    acceleration: options.acceleration(),
                    radius: options.radius()
                })
            }
        } else if (viewportFollow === null) {
            viewport.plugins.remove('follow')
        }
    }
    onDestroy(element: Element) {
        const { viewportFollow } = element.props
        const { viewport } = element.props.context
        if (viewportFollow) viewport.plugins.remove('follow')
    }
}

registerDirective('viewportFollow', ViewportFollow)