import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { ComponentInstance } from '../components/DisplayObject';
import { log } from '../engine/utils';

export class ViewportFollow extends Directive {
    onInit(element: Element<ComponentInstance>) {

    }
    onMount(element) {
        const { viewportFollow } = element.props
        const { viewport } = element.props.context
        if (!viewport) {
            log('ViewportFollow directive requires a Viewport component to be mounted in the same context')
        }
        viewport.follow(this)
    }
    onUpdate(props: any) {

    }
    onDestroy() {

    }
}

registerDirective('viewportFollow', ViewportFollow)