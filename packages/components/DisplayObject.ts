import { Node } from "yoga-layout";
import type { AlignContent, EdgeSize, FlexDirection, Size } from "./types/DisplayObject";

export function DisplayObject(extendClass) {
    return class DisplayObject extends extendClass {
        public node: Node;

        // insertChild<U extends DisplayObject[]>(...children: U): U[0] {
        //     const child = super.addChild(...children);
        //     this.node.insertChild(child.node, this.node.getChildCount());

        //     return child;
        // }

        onInit(props) {
           if (props.click) {
                this.eventMode = 'static';
                this.on('click', props.click)
           }
        }

        onInsert(parent) {
            //this.node = YogaContext.Node.create();
            if (!parent) {
                return
            }
            parent.addChild(this);
        }

        onUpdate(props) {
            if (props.x) this.x = props.x
            if (props.y) this.y = props.y
        }

        onDestroy() {
            super.destroy();
            this.node?.freeRecursive();
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

        setFlexDirection(direction: FlexDirection) {
            const mapping = {
                row: YogaContext.FLEX_DIRECTION_ROW,
                column: YogaContext.FLEX_DIRECTION_COLUMN,
                'row-reverse': YogaContext.FLEX_DIRECTION_ROW_REVERSE,
                'column-reverse': YogaContext.FLEX_DIRECTION_COLUMN_REVERSE
            }
            this.node.setFlexDirection(mapping[direction]);
        }

        setFlexWrap(wrap: "wrap" | "nowrap" | "wrap-reverse") {
            const mapping = {
                wrap: YogaContext.WRAP_WRAP,
                nowrap: YogaContext.WRAP_NO_WRAP,
                'wrap-reverse': YogaContext.WRAP_WRAP_REVERSE
            }
            this.node.setFlexWrap(mapping[wrap]);
        }

        private setAlign(methodName: string, align: AlignContent) {
            const mapping = {
                auto: YogaContext.ALIGN_AUTO,
                "flex-start": YogaContext.ALIGN_FLEX_START,
                "flex-end": YogaContext.ALIGN_FLEX_END,
                center: YogaContext.ALIGN_CENTER,
                stretch: YogaContext.ALIGN_STRETCH,
                baseline: YogaContext.ALIGN_BASELINE,
                "space-between": YogaContext.ALIGN_SPACE_BETWEEN,
                "space-around": YogaContext.ALIGN_SPACE_AROUND
            }
            const method = (this.node as any)[methodName].bind(this.node);
            method(mapping[align]);
        }

        setAlignContent(align: AlignContent) {
            this.setAlign("setAlignContent", align);
        }

        setAlignSelf(align: AlignContent) {
            this.setAlign("setAlignSelf", align);
        }

        setAlinItems(align: AlignContent) {
            this.setAlign("setAlignItems", align);
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

        private setEdgeSize(methodName: string, size: EdgeSize) {
            const method = (this.node as any)[methodName].bind(this.node);
            if (size instanceof Array) {
                if (size.length === 2) {
                    method(YogaContext.EDGE_VERTICAL, size[0]);
                    method(YogaContext.EDGE_HORIZONTAL, size[1]);
                } else if (size.length === 4) {
                    method(YogaContext.EDGE_TOP, size[0]);
                    method(YogaContext.EDGE_RIGHT, size[1]);
                    method(YogaContext.EDGE_BOTTOM, size[2]);
                    method(YogaContext.EDGE_LEFT, size[3]);
                }
            }
            else {
                method(YogaContext.EDGE_ALL, size);
            }
        }

        setPosition(position: EdgeSize) {
            this.setEdgeSize("setPosition", position);
        }

        setX(x: number) {
            this.node.setPosition(YogaContext.EDGE_LEFT, x);
        }

        setY(y: number) {
            this.node.setPosition(YogaContext.EDGE_TOP, y);
        }

        setPadding(padding: EdgeSize) {
            this.setEdgeSize("setPadding", padding);
        }

        setMargin(margin: EdgeSize) {
            this.setEdgeSize("setMargin", margin);
        }

        setBorder(border: EdgeSize) {
            this.setEdgeSize("setBorder", border);
        }

        setPositionType(positionType: "relative" | "absolute") {
            const mapping = {
                relative: YogaContext.POSITION_TYPE_RELATIVE,
                absolute: YogaContext.POSITION_TYPE_ABSOLUTE
            }
            this.node.setPositionType(mapping[positionType]);
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