import { createComponent, registerComponent, type ComponentFunction } from "canvasengine";
import { Container3D } from "@pixi/3d";
import { Node3D, type Node3DProps } from "./Node3D";

class CanvasGroup3D extends Node3D(Container3D) {}

registerComponent("Group3D", CanvasGroup3D);

/** Groups 3D nodes to move, rotate or scale them together. */
export const Group3D: ComponentFunction<Node3DProps> = (props) => createComponent("Group3D", props);

export { CanvasGroup3D };
