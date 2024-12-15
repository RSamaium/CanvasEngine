import { ComponentInstance } from '../components/DisplayObject';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { error } from '../engine/utils';

export class ViewportFollow extends Directive {
    onInit(element: Element<ComponentInstance>) {

    }
    onMount(element: Element) {
        const { viewportFollow } = element.props
        const { viewport } = element.props.context
        if (!viewport) {
            throw error('ViewportFollow directive requires a Viewport component to be mounted in the same context')
        }
        viewport.follow(element.componentInstance)
    }
    onUpdate(props: any) {

    }
    onDestroy() {

    }
}

registerDirective('viewportFollow', ViewportFollow)