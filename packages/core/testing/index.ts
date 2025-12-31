import { bootstrapCanvas, Canvas, ComponentInstance, Element, h } from "canvasengine";

export class TestBed {
    static async createComponent(component: any, props: any = {}, children: any = []): Promise<Element<ComponentInstance>> {
        const comp = () => h(Canvas, {
            tickStart: false
        }, h(component, props, children))
        const { canvasElement, app } = await bootstrapCanvas(document.getElementById('root'), comp, {
            enableLayout: false
        })
        app.render()
        return canvasElement.props.children?.[0]
    }
}
