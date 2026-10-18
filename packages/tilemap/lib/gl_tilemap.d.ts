import { ExtensionType, Shader } from 'pixi.js';
import { Tilemap } from './Tilemap';
import { TilemapAdaptor, TilemapPipe } from './TilemapPipe';
export declare class GlTilemapAdaptor extends TilemapAdaptor {
    static extension: {
        readonly type: readonly [ExtensionType.WebGLPipesAdaptor];
        readonly name: "tilemap";
    };
    _shader: Shader;
    max_textures: number;
    destroy(): void;
    execute(pipe: TilemapPipe, tilemap: Tilemap): void;
    init(): void;
}
