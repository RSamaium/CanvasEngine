import { Graphics } from "pixi.js";
import { DisplayObject } from "./DisplayObject";

export class CanvasGraphics extends DisplayObject(Graphics) {}
export interface CanvasGraphics extends Graphics {}