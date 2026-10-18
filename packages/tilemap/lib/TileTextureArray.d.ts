import { BindGroup, Buffer, TextureSource } from 'pixi.js';
export declare class TileTextureArray {
    max_textures: number;
    constructor(max_textures: number);
    arr: TextureSource[];
    count: number;
    dirty: boolean;
    dirty_gpu: boolean;
    bind_group: BindGroup;
    bind_group_resources: any;
    tex_sizes: Float32Array;
    null_color: Float32Array;
    tex_buf: Buffer;
    get length(): number;
    push(tex: TextureSource): void;
    at(ind: number): TextureSource<any>;
    update(): void;
    markDirty(): void;
    getBindGroup(): BindGroup;
    static generate_gpu_textures(max_textures: number): string;
    static generate_gl_textures(max_textures: number): string;
    static gl_gen_resources(max_textures: number): any;
}
