import { Container, Texture, TextureSource } from 'pixi.js';
import { Tilemap } from './Tilemap';
/**
 * A tilemap composite that lazily builds tilesets layered into multiple tilemaps.
 *
 * The composite tileset is the concatenation of the individual tilesets used in the tilemaps. You can
 * preinitialized it by passing a list of tile textures to the constructor. Otherwise, the composite tilemap
 * is lazily built as you add more tiles with newer tile textures. A new tilemap is created once the last
 * tilemap has reached its limit (as set by {@link CompositeTilemap.texturesPerTilemap texturesPerTilemap}).
 *
 * @example
 * import { Application } from '@pixi/app';
 * import { CompositeTilemap } from '@pixi/tilemap';
 * import { Loader } from '@pixi/loaders';
 *
 * // Setup view & stage.
 * const app = new Application();
 *
 * document.body.appendChild(app.renderer.view);
 * app.stage.interactive = true;
 *
 * // Global reference to the tilemap.
 * let globalTilemap: CompositeTilemap;
 *
 * // Load the tileset spritesheet!
 * Loader.shared.load('atlas.json');
 *
 * // Initialize the tilemap scene when the assets load.
 * Loader.shared.load(function onTilesetLoaded()
 * {
 *      const tilemap = new CompositeTilemap();
 *
 *      // Setup the game level with grass and dungeons!
 *      for (let x = 0; x < 10; x++)
 *      {
 *          for (let y = 0; y < 10; y++)
 *          {
 *              tilemap.tile(
 *                  x % 2 === 0 && (x === y || x + y === 10) ? 'dungeon.png' : 'grass.png',
 *                  x * 100,
 *                  y * 100,
 *              );
 *          }
 *      }
 *
 *      globalTilemap = app.stage.addChild(tilemap);
 * });
 *
 * // Show a bomb at a random location whenever the user clicks!
 * app.stage.on('click', function onClick()
 * {
 *      if (!globalTilemap) return;
 *
 *      const x = Math.floor(Math.random() * 10);
 *      const y = Math.floor(Math.random() * 10);
 *
 *      globalTilemap.tile('bomb.png', x * 100, y * 100);
 * });
 */
export declare class CompositeTilemap extends Container {
    /** The hard limit on the number of tile textures used in each tilemap. */
    readonly texturesPerTilemap: number;
    /**
     * The animation frame vector.
     *
     * Animated tiles have four parameters - `animX`, `animY`, `animCountX`, `animCountY`. The textures
     * of adjacent animation frames are at offset `animX` or `animY` of each other, with `animCountX` per
     * row and `animCountY` per column.
     *
     * The animation frame vector specifies which animation frame texture to use. If the x/y coordinate is
     * larger than the `animCountX` or `animCountY` for a specific tile, the modulus is taken.
     */
    tileAnim: [number, number];
    /** The last modified tilemap. */
    protected lastModifiedTilemap: Tilemap;
    private modificationMarker;
    /**
     * @param tileset - A list of tile base-textures that will be used to eagerly initialized the layered
     *  tilemaps. This is only an performance optimization, and using {@link CompositeTilemap.tile tile}
     *  will work equivalently.
     */
    constructor(tileset?: Array<TextureSource>);
    /**
     * This will preinitialize the tilesets of the layered tilemaps.
     *
     * If used after a tilemap has been created (or a tile added), this will overwrite the tile textures of the
     * existing tilemaps. Passing the tileset to the constructor instead is the best practice.
     *
     * @param tileTextures - The list of tile textures that make up the tileset.
     */
    tileset(tileTextures: Array<TextureSource>): this;
    /** Clears the tilemap composite. */
    clear(): this;
    /** Changes the rotation of the last added tile. */
    tileRotate(rotate: number): this;
    /** Changes `animX`, `animCountX` of the last added tile. */
    tileAnimX(offset: number, count: number): this;
    /** Changes `animY`, `animCountY` of the last added tile. */
    tileAnimY(offset: number, count: number): this;
    /** Changes `tileAnimDivisor` value of the last added tile. */
    tileAnimDivisor(divisor: number): this;
    /**
     * Adds a tile that paints the given tile texture at (x, y).
     *
     * @param tileTexture - The tile texture. You can pass an index into the composite tilemap as well.
     * @param x - The local x-coordinate of the tile's location.
     * @param y - The local y-coordinate of the tile's location.
     * @param options - Additional options to pass to {@link Tilemap.tile}.
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
     * @param [options.animDivisor=1] - For animated tiles, this is the animation duration each frame
     * @param [options.alpha=1] - Tile alpha
     * @return This tilemap, good for chaining.
     */
    tile(tileTexture: Texture | string | number, x: number, y: number, options?: {
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
    /**
     * @internal
     * @ignore
     */
    isModified(anim: boolean): boolean;
    /**
     * @internal
     * @ignore
     */
    clearModify(): void;
    /**
     * @deprecated Since @pixi/tilemap 3.
     * @see CompositeTilemap.tile
     */
    addFrame(texture: Texture | string | number, x: number, y: number, animX?: number, animY?: number, animWidth?: number, animHeight?: number, animDivisor?: number, alpha?: number): this;
    /**
     * @deprecated @pixi/tilemap 3
     * @see CompositeTilemap.tile
     */
    addRect(textureIndex: number, u: number, v: number, x: number, y: number, tileWidth: number, tileHeight: number, animX?: number, animY?: number, rotate?: number, animWidth?: number, animHeight?: number): this;
    /**
     * Alias for {@link CompositeTilemap.tileset tileset}.
     *
     * @deprecated Since @pixi/tilemap 3.
     */
    setBitmaps: (tileTextures: Array<TextureSource>) => this;
    /**
     * @deprecated Since @pixi/tilemap 3.
     * @readonly
     * @see CompositeTilemap.texturesPerTilemap
     */
    get texPerChild(): number;
}
