import { BindGroup, ExtensionType, Shader } from 'pixi.js';
import { Tilemap } from './Tilemap';
import { TilemapAdaptor, TilemapPipe } from './TilemapPipe';
export declare class GpuTilemapAdaptor extends TilemapAdaptor {
    static extension: {
        readonly type: readonly [ExtensionType.WebGPUPipesAdaptor];
        readonly name: "tilemap";
    };
    _shader: Shader;
    max_textures: number;
    bind_group: BindGroup;
    destroy(): void;
    execute(pipe: TilemapPipe, tilemap: Tilemap): void;
    init(): void;
}
