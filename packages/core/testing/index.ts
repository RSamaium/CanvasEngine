import { bootstrapCanvas, Canvas, ComponentInstance, Element, h } from "canvasengine";

export class TestBed {
    static async createComponent(component: any, props: any): Promise<Element<ComponentInstance>> {
        const comp = () => h(Canvas, {
            tickStart: false
        }, h(component, props))
        const canvas = await bootstrapCanvas(document.getElementById('root'), comp)
        return canvas.props.children?.[0]
    }
}