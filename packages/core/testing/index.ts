import { bootstrapCanvas, Canvas, ComponentInstance, Element, h } from "canvasengine";
import type { Application } from "pixi.js";

export class TestBed {
    private static lastApp: Application | null = null;

    static async createComponent(
        component: any,
        props: any = {},
        children: any = [],
        options: { enableLayout?: boolean } = {}
    ): Promise<Element<ComponentInstance>> {
        if (TestBed.lastApp) {
            try {
                TestBed.lastApp.destroy(
                    { removeView: true },
                    { children: true, texture: true, textureSource: true, context: true }
                );
            } catch {
                // ignore cleanup errors in test environment
            }
            TestBed.lastApp = null;
        }

        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = '';
        }

        const comp = () => h(Canvas, {
            tickStart: false
        }, h(component, props, children))
        const enableLayout = options.enableLayout ?? true;
        const { canvasElement, app } = await bootstrapCanvas(root, comp, {
            enableLayout,
            ...(enableLayout ? { layout: { throttle: 0 } } : {})
        })
        app.render()
        TestBed.lastApp = app as Application;
        return canvasElement.props.children?.[0]
    }
}
