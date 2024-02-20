import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { Container } from 'pixi.js';
import { isSignal } from '../engine/signal';

const EVENTS = ['']

export class Drag extends Directive {

    onInit(element: Element<Container>) {

    }

    onMount(element: Element<Container>) {
        const { rootElement } = element.props.context
        const { propObservables } = element
        const { drag } = element.props
        const instance = element.componentInstance
        const stage =  rootElement.componentInstance
        instance.eventMode = 'static'
        stage.eventMode = 'static'

        const onDragMove = (event) => {
            drag.move?.(event)
            const value = instance.parent.toLocal(event.global, null, instance.position)
            const { x, y } = propObservables as any
            if (x !== undefined && isSignal(x)) {
                x.set(value.x)
            }
            if (y !== undefined && isSignal(y)) {
                y.set(value.y)
            }
        }

        const onDragEnd = () => {
            drag.end?.()
            stage.off('pointermove', onDragMove)
        }   

        instance.on('pointerdown', () => {
            drag.start?.()
            stage.on('pointermove', onDragMove)
        });

        stage.on('pointerup', onDragEnd)
        stage.on('pointerupoutside', onDragEnd)
    }

    onUpdate(props: any) {

    }

    onDestroy() {

    }
}

registerDirective('drag', Drag)