import { ExtensionType, Instruction, InstructionPipe, InstructionSet, Matrix, Renderer, RenderPipe, UniformGroup } from 'pixi.js';
import { TilemapGeometry } from './TilemapGeometry';
import type { Tilemap } from './Tilemap';
export declare abstract class TilemapAdaptor {
    abstract init(): void;
    abstract execute(meshPipe: TilemapPipe, mesh: Tilemap): void;
    abstract destroy(): void;
    pipe_uniforms: UniformGroup<{
        u_proj_trans: {
            value: Matrix;
            type: "mat3x3<f32>";
        };
        u_anim_frame: {
            value: Float32Array;
            type: "vec2<f32>";
        };
    }>;
}
export interface TilemapInstruction extends Instruction {
    renderPipeId: 'tilemap';
    tilemap: Tilemap;
}
/**
 * Rendering helper pipeline for tilemaps. This plugin is registered automatically.
 */
export declare class TilemapPipe implements RenderPipe<Tilemap>, InstructionPipe<TilemapInstruction> {
    static extension: {
        readonly type: readonly [ExtensionType.WebGLPipes, ExtensionType.WebGPUPipes];
        readonly name: "tilemap";
    };
    /** The managing renderer */
    readonly renderer: Renderer;
    /** The tile animation frame */
    tileAnim: number[];
    private ibLen;
    /** The index buffer for the tilemaps to share. */
    private indexBuffer;
    /** The shader used to render tilemaps. */
    private shader;
    private adaptor;
    constructor(renderer: Renderer, adaptor: TilemapAdaptor);
    start(): void;
    /**
     * @internal
     * @ignore
     */
    createVb(): TilemapGeometry;
    /** @return The {@link TilemapGeometry} shader that this rendering pipeline is using. */
    getShader(): TilemapGeometry;
    destroy(): void;
    checkIndexBuffer(size: number): void;
    destroyRenderable(_renderable: Tilemap): void;
    addRenderable(tilemap: Tilemap, instructionSet: InstructionSet | undefined): void;
    updateRenderable(tilemap: Tilemap, _instructionSet?: InstructionSet | undefined): void;
    validateRenderable(renderable: Tilemap): boolean;
    execute({ tilemap }: TilemapInstruction): void;
}
