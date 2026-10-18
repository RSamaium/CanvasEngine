import { Buffer, Geometry } from 'pixi.js';
export declare class TilemapGeometry extends Geometry {
    static vertSize: number;
    static vertPerQuad: number;
    static stride: number;
    lastTimeAccess: number;
    vertSize: number;
    vertPerQuad: number;
    stride: number;
    constructor(indexBuffer: Buffer);
    buf: Buffer;
}
