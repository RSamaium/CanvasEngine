import { Bounds, State, Texture, TextureSource, ViewContainer } from 'pixi.js';
import { TilemapInstruction, TilemapPipe } from './TilemapPipe';
import { TileTextureArray } from './TileTextureArray';
import type { DestroyOptions } from 'pixi.js';
import type { TilemapGeometry } from './TilemapGeometry';
export declare const POINT_STRUCT_SIZE: number;
/**
 * A rectangular tilemap implementation that renders a predefined set of tile textures.
 *
 * The {@link Tilemap.tileset tileset} of a tilemap defines the list of base-textures that can be painted in the
 * tilemap. A texture is identified using its base-texture's index into the this list, i.e. changing the base-texture
 * at a given index in the tileset modifies the paint of all tiles pointing to that index.
 *
 * The size of the tileset is limited by the texture units supported by the client device. The minimum supported
 * value is 8, as defined by the WebGL 1 specification. `gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS`) can be used
 * to extract this limit. {@link CompositeTilemap} can be used to get around this limit by layering multiple tilemap
 * instances.
 *
 * @example
 * import { Tilemap } from '@pixi/tilemap';
 * import { Loader } from '@pixi/loaders';
 *
 * // Add the spritesheet into your loader!
 * Loader.shared.add('atlas', 'assets/atlas.json');
 *
 * // Make the tilemap once the tileset assets are available.
 * Loader.shared.load(function onTilesetLoaded()
 * {
 *      // The base-texture is shared between all the tile textures.
 *      const tilemap = new Tilemap([Texture.from('grass.png').baseTexture])
 *          .tile('grass.png', 0, 0)
 *          .tile('grass.png', 100, 100)
 *          .tile('brick_wall.png', 0, 100);
 * });
 */
export declare class Tilemap extends ViewContainer {
    /**
     * Currently doesnt work.
     */
    shadowColor: Float32Array;
    state: State;
    is_valid: boolean;
    readonly renderPipeId = "tilemap";
    readonly canBundle = true;
    _instruction: TilemapInstruction;
    /**
     * @internal
     * @ignore
     */
    checkValid(): boolean;
    /**
     * The tile animation frame.
     *
     * @see CompositeTilemap.tileAnim
     */
    tileAnim: [number, number];
    /**
     * This is the last uploaded size of the tilemap geometry.
     * @ignore
     */
    rects_count: number;
    /** @ignore */
    compositeParent: boolean;
    /**
     * The list of base-textures being used in the tilemap.
     *
     * This should not be shuffled after tiles have been added into this tilemap. Usually, only tile textures
     * should be added after tiles have been added into the map.
     */
    protected tileset: TileTextureArray;
    /**
     * The local bounds of the tilemap itself. This does not include DisplayObject children.
     */
    protected readonly tilemapBounds: Bounds;
    /** Flags whether any animated tile was added. */
    protected hasAnimatedTile: boolean;
    /** The interleaved geometry of the tilemap. */
    private pointsBuf;
    protected updateBounds(): void;
    batched: boolean;
    /**
     * @param tileset - The tileset to use for the tilemap. This can be reset later with {@link Tilemap.setTileset}. The
     *      base-textures in this array must not be duplicated.
     */
    constructor(tileset: TextureSource | Array<TextureSource>);
    /**
     * @returns The tileset of this tilemap.
     */
    getTileset(): TileTextureArray;
    /**
     * Define the tileset used by the tilemap.
     *
     * @param textureOrArray - The list of textures to use in the tilemap. If a base-texture (not array) is passed, it will
     *  be wrapped into an array. This should not contain any duplicates.
     */
    setTileset(textureOrArray?: TileTextureArray | TextureSource | Array<TextureSource>): this;
    /**  Clears all the tiles added into this tilemap. */
    clear(): this;
    /**
     * Adds a tile that paints the given texture at (x, y).
     *
     * @param tileTexture - The tiling texture to render.
     * @param x - The local x-coordinate of the tile's position.
     * @param y - The local y-coordinate of the tile's position.
     * @param options - Additional tile options.
     * @param [options.u=texture.frame.x] - The x-coordinate of the texture in its base-texture's space.
     * @param [options.v=texture.frame.y] - The y-coordinate of the texture in its base-texture's space.
     * @param [options.tileWidth=texture.orig.width] - The local width of the tile.
     * @param [options.tileHeight=texture.orig.height] - The local height of the tile.
     * @param [options.animX=0] - For animated tiles, this is the "offset" along the x-axis for adjacent
     *      animation frame textures in the base-texture.
     * @param [options.animY=0] - For animated tiles, this is the "offset" along the y-axis for adjacent
     *      animation frames textures in the base-texture.
     * @param [options.rotate=0]
     * @param [options.animCountX=1024] - For animated tiles, this is the number of animation frame textures
     *      per row.
     * @param [options.animCountY=1024] - For animated tiles, this is the number of animation frame textures
     *      per column.
     * @param [options.animDivisor=1] - For animated tiles, this is the animation duration of each frame
     * @param [options.alpha=1] - Tile alpha
     * @return This tilemap, good for chaining.
     */
    tile(tileTexture: number | string | Texture | TextureSource, x: number, y: number, options?: {
        u?: number;
        v?: number;
        tileWidth?: number;
        tileHeight?: number;
        animX?: number;
        animY?: number;
        rotate?: number;
        animCountX?: number;
        animCountY?: number;
        animDivisor?: number;
        alpha?: number;
    }): this;
    /** Changes the rotation of the last tile. */
    tileRotate(rotate: number): void;
    /** Changes the `animX`, `animCountX` of the last tile. */
    tileAnimX(offset: number, count: number): void;
    /** Changes the `animY`, `animCountY` of the last tile. */
    tileAnimY(offset: number, count: number): void;
    /** Changes the `animDivisor` value of the last tile. */
    tileAnimDivisor(divisor: number): void;
    tileAlpha(alpha: number): void;
    private vbId;
    vb: TilemapGeometry;
    private vbBuffer;
    private vbArray;
    private vbInts;
    private destroyVb;
    updateBuffer(plugin: TilemapPipe): void;
    /**
     * @internal
     * @ignore
     */
    isModified(anim: boolean): boolean;
    /**
     * This will pull forward the modification marker.
     *
     * @internal
     * @ignore
     */
    clearModify(): void;
    addBounds(bounds: Bounds): void;
    get bounds(): Bounds;
    /** @override */
    destroy(options?: DestroyOptions): void;
    /**
     * Deprecated signature for {@link Tilemap.tile tile}.
     *
     * @deprecated Since @pixi/tilemap 3.
     */
    addFrame(texture: Texture | string | number, x: number, y: number, animX: number, animY: number): boolean;
    /**
     * Deprecated signature for {@link Tilemap.tile tile}.
     *
     * @deprecated Since @pixi/tilemap 3.
     */
    addRect(textureIndex: number, u: number, v: number, x: number, y: number, tileWidth: number, tileHeight: number, animX?: number, animY?: number, rotate?: number, animCountX?: number, animCountY?: number, animDivisor?: number, alpha?: number): this;
}
