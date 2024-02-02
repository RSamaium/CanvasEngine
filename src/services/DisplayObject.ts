import { Node } from "yoga-layout";
import { YogaContext } from "../contexts/YogaContext";
import { $changeLayout } from "../stores/canvas";

export function DisplayObject(extendClass) {
    return class DisplayObject extends extendClass {
        public node: Node;

        constructor() {
            super();
            this.node = YogaContext.Node.create();

            $changeLayout.listen(() => {
                this.applyComputedLayout();
            })
        }

        insertChild<U extends DisplayObject[]>(...children: U): U[0] {
            const child = super.addChild(...children);
            this.node.insertChild(child.node, this.node.getChildCount());

            return child;
        }

        getComputedLayout() {
            return this.node.getComputedLayout();
        }

        applyComputedLayout() {
            const layout = this.getComputedLayout();
            this.x = layout.left;
            this.y = layout.top;
        }

        calculateLayout() {
            this.node.calculateLayout()
        }

        setFlexDirection(direction: "row" | "column") {
            const mapping = {
                row: YogaContext.FLEX_DIRECTION_ROW,
                column: YogaContext.FLEX_DIRECTION_COLUMN
            }
            this.node.setFlexDirection(mapping[direction]);
        }

        setJustifyContent(justifyContent: "flex-start" | "flex-end" | "center" | "space-between" | "space-around") {
            const mapping = {
                "flex-start": YogaContext.JUSTIFY_FLEX_START,
                "flex-end": YogaContext.JUSTIFY_FLEX_END,
                "center": YogaContext.JUSTIFY_CENTER,
                "space-between": YogaContext.JUSTIFY_SPACE_BETWEEN,
                "space-around": YogaContext.JUSTIFY_SPACE_AROUND
            }
            this.node.setJustifyContent(mapping[justifyContent]);
        }

        calculateBounds() {
            super.calculateBounds();
            if (!this._geometry) return;
            const bounds = this._geometry.bounds
            const width = Math.abs(bounds.minX - bounds.maxX)
            const height = Math.abs(bounds.minY - bounds.maxY)
            // this.node.setWidth(width);
            // this.node.setHeight(height);
        }

        setWidth(width: number) {
            this.node.setWidth(width);
            //   this.width = width;
        }

        setHeight(height: number) {
            this.node.setHeight(height);
            //  this.height = height;
        }

        getWidth() {
            return this.node.getWidth();
        }
    }
} 