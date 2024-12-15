import { Container, DisplacementFilter, Sprite, Texture, WRAP_MODES } from 'pixi.js';
import { animate } from 'popmotion';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';


export class Transition extends Directive {
   

    onInit(element: Element<Container>) {
    }

    onMount(element: Element<Container>) {
        const { image } = element.props.transition
        const displacementSprite = new Sprite(Texture.from(image))
        displacementSprite.texture.baseTexture.wrapMode = WRAP_MODES.REPEAT
        const displacementFilter = new DisplacementFilter(displacementSprite)
        const instance = element.componentInstance
        instance.filters = [displacementFilter]

        instance.addChild(displacementSprite)

        setTimeout(() => {
            animate({
                from: 0,
                to: 1,
                duration: 500,
                onUpdate: (progress) => {
                    displacementFilter.scale.x = progress
                    displacementFilter.scale.y = progress
                }
            })
        }, 5000)
    }

    onUpdate(props: any) {

    }

    onDestroy() {

    }
}

registerDirective('transition', Transition)