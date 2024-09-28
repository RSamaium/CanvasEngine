import { effect, isSignal } from '@signe/reactive';
import { Container, Rectangle } from 'pixi.js';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { snap } from 'popmotion';
import { addContext } from '../hooks/addContext';

export class Drop extends Directive {
    onMount(element: Element<Container>) {
        addContext(element, 'drop', element)
    }
}

export class Drag extends Directive {

    onInit(element: Element<Container>) {}

    onMount(element: Element<Container>) {
        const { rootElement, canvasSize } = element.props.context
        const { propObservables } = element
        const { drag } = element.props
        const instance = element.componentInstance
        const stage =  rootElement.componentInstance
        instance.eventMode = 'static'
        stage.eventMode = 'static'

        const snapTo = snap(drag?.snap ?? 0);

        effect(() => {
            stage.hitArea = new Rectangle(0, 0, canvasSize().width, canvasSize().height)
        })

        let x = 0
        let y = 0

        const onDragMove = (event) => {
            drag.move?.(event)
            x += event.movementX
            y += event.movementY
            if (drag?.snap) {
                instance.position.x = snapTo(x)
                instance.position.y = snapTo(y)
            } else {
                instance.position.x = x
                instance.position.y = y
            }
            const { x: xProp, y: yProp } = propObservables as any
            if (xProp !== undefined && isSignal(xProp)) {
                xProp.set(instance.position.x)
            }
            if (yProp !== undefined && isSignal(yProp)) {
                yProp.set(instance.position.y)
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


    onDestroy() {

    }
}

registerDirective('drag', Drag)
registerDirective('drop', Drop)