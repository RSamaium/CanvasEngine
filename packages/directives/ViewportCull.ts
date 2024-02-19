import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { Simple, SpatialHash } from "pixi-cull"
import { error } from '../engine/utils';
import { ComponentInstance } from '../components/DisplayObject';
import { Container } from 'pixi.js';
import { effect } from '../engine/signal';

export class ViewportCull extends Directive {
    private cull: any

    onInit(element) {
        this.cull = new Simple({
            dirtyTest: false,
        })
    }
    onMount(element: Element<Container>) {
        const tick = element.props.context.tick
        const { viewportCull } = element.props
        const { viewport } = element.props.context
        if (!viewport) {
            throw error('ViewportCull directive requires a Viewport component to be mounted in the same context')
        }
        let init = true
        element.props.children[0].subscribe((val) => {
            // val.fullElements.forEach((el: any) => {
            //     el.componentInstance._boundsViewport = true
            // })
          //  this.cull.lists[0] = val.fullElements.map((el: any) => el.componentInstance)
          
            if (!init) {
                init = false
                return
            }
            this.cull.addList(val.fullElements.map((el: any) => el.componentInstance))
            // for (let i = 0; i < val.fullElements.length; i++) {
            //     this.cull.add(val.fullElements[i].componentInstance)
            // }
            
        })

        effect(() => {
            tick()
            if (viewport.dirty) {
                this.cull.cull(viewport.getVisibleBounds())
                viewport.dirty = false
            }
        })
    }
    onUpdate(props: any) { }
    onDestroy() { }
}

registerDirective('viewportCull', ViewportCull)