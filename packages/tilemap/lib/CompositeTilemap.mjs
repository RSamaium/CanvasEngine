import { Container, Texture } from 'pixi.js';
import { settings } from './settings.mjs';
import { Tilemap } from './Tilemap.mjs';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class CompositeTilemap extends Container {
  // private shadowColor = new Float32Array([0.0, 0.0, 0.0, 0.5]);
  /**
   * @param tileset - A list of tile base-textures that will be used to eagerly initialized the layered
   *  tilemaps. This is only an performance optimization, and using {@link CompositeTilemap.tile tile}
   *  will work equivalently.
   */
  constructor(tileset) {
    super();
    /** The hard limit on the number of tile textures used in each tilemap. */
    __publicField(this, "texturesPerTilemap");
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
    __publicField(this, "tileAnim", null);
    /** The last modified tilemap. */
    __publicField(this, "lastModifiedTilemap", null);
    __publicField(this, "modificationMarker", 0);
    /**
     * Alias for {@link CompositeTilemap.tileset tileset}.
     *
     * @deprecated Since @pixi/tilemap 3.
     */
    __publicField(this, "setBitmaps", this.tileset);
    this.texturesPerTilemap = settings.TEXTURES_PER_TILEMAP;
    this.tileset(tileset);
  }
  /**
   * This will preinitialize the tilesets of the layered tilemaps.
   *
   * If used after a tilemap has been created (or a tile added), this will overwrite the tile textures of the
   * existing tilemaps. Passing the tileset to the constructor instead is the best practice.
   *
   * @param tileTextures - The list of tile textures that make up the tileset.
   */
  tileset(tileTextures) {
    if (!tileTextures) {
      tileTextures = [];
    }
    const texPerChild = this.texturesPerTilemap;
    const len1 = this.children.length;
    const len2 = Math.ceil(tileTextures.length / texPerChild);
    for (let i = 0; i < Math.min(len1, len2); i++) {
      this.children[i].setTileset(
        tileTextures.slice(i * texPerChild, (i + 1) * texPerChild)
      );
    }
    for (let i = len1; i < len2; i++) {
      const tilemap = new Tilemap(tileTextures.slice(i * texPerChild, (i + 1) * texPerChild));
      tilemap.compositeParent = true;
      this.addChild(tilemap);
    }
    return this;
  }
  /** Clears the tilemap composite. */
  clear() {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].clear();
    }
    this.modificationMarker = 0;
    return this;
  }
  /** Changes the rotation of the last added tile. */
  tileRotate(rotate) {
    if (this.lastModifiedTilemap) {
      this.lastModifiedTilemap.tileRotate(rotate);
    }
    return this;
  }
  /** Changes `animX`, `animCountX` of the last added tile. */
  tileAnimX(offset, count) {
    if (this.lastModifiedTilemap) {
      this.lastModifiedTilemap.tileAnimX(offset, count);
    }
    return this;
  }
  /** Changes `animY`, `animCountY` of the last added tile. */
  tileAnimY(offset, count) {
    if (this.lastModifiedTilemap) {
      this.lastModifiedTilemap.tileAnimY(offset, count);
    }
    return this;
  }
  /** Changes `tileAnimDivisor` value of the last added tile. */
  tileAnimDivisor(divisor) {
    if (this.lastModifiedTilemap) {
      this.lastModifiedTilemap.tileAnimDivisor(divisor);
    }
    return this;
  }
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
  tile(tileTexture, x, y, options = {}) {
    let tilemap = null;
    const children = this.children;
    this.lastModifiedTilemap = null;
    if (typeof tileTexture === "number") {
      const childIndex = tileTexture / this.texturesPerTilemap >> 0;
      let tileIndex = 0;
      tilemap = children[childIndex];
      if (!tilemap) {
        tilemap = children[0];
        if (!tilemap)
          return this;
        tileIndex = 0;
      } else {
        tileIndex = tileTexture % this.texturesPerTilemap;
      }
      tilemap.tile(
        tileIndex,
        x,
        y,
        options
      );
    } else {
      if (typeof tileTexture === "string") {
        tileTexture = Texture.from(tileTexture);
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const tex = child.getTileset().arr;
        for (let j = 0; j < tex.length; j++) {
          if (tex[j] === tileTexture.source) {
            tilemap = child;
            break;
          }
        }
        if (tilemap) {
          break;
        }
      }
      if (!tilemap) {
        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          if (child.getTileset().count < this.texturesPerTilemap) {
            tilemap = child;
            child.getTileset().push(tileTexture.source);
            break;
          }
        }
        if (!tilemap) {
          tilemap = new Tilemap(tileTexture.source);
          tilemap.compositeParent = true;
          this.addChild(tilemap);
        }
      }
      tilemap.tile(
        tileTexture,
        x,
        y,
        options
      );
    }
    this.lastModifiedTilemap = tilemap;
    return this;
  }
  /**
   * @internal
   * @ignore
   */
  isModified(anim) {
    const layers = this.children;
    if (this.modificationMarker !== layers.length) {
      return true;
    }
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].isModified(anim)) {
        return true;
      }
    }
    return false;
  }
  /**
   * @internal
   * @ignore
   */
  clearModify() {
    const layers = this.children;
    this.modificationMarker = layers.length;
    for (let i = 0; i < layers.length; i++) {
      layers[i].clearModify();
    }
  }
  /**
   * @deprecated Since @pixi/tilemap 3.
   * @see CompositeTilemap.tile
   */
  addFrame(texture, x, y, animX, animY, animWidth, animHeight, animDivisor, alpha) {
    return this.tile(
      texture,
      x,
      y,
      {
        animX,
        animY,
        animCountX: animWidth,
        animCountY: animHeight,
        animDivisor,
        alpha
      }
    );
  }
  /**
   * @deprecated @pixi/tilemap 3
   * @see CompositeTilemap.tile
   */
  // eslint-disable-next-line max-params
  addRect(textureIndex, u, v, x, y, tileWidth, tileHeight, animX, animY, rotate, animWidth, animHeight) {
    const childIndex = textureIndex / this.texturesPerTilemap >> 0;
    const textureId = textureIndex % this.texturesPerTilemap;
    if (this.children[childIndex] && this.children[childIndex].getTileset().count > 0) {
      this.lastModifiedTilemap = this.children[childIndex];
      this.lastModifiedTilemap.addRect(
        textureId,
        u,
        v,
        x,
        y,
        tileWidth,
        tileHeight,
        animX,
        animY,
        rotate,
        animWidth,
        animHeight
      );
    } else {
      this.lastModifiedTilemap = null;
    }
    return this;
  }
  /**
   * @deprecated Since @pixi/tilemap 3.
   * @readonly
   * @see CompositeTilemap.texturesPerTilemap
   */
  get texPerChild() {
    return this.texturesPerTilemap;
  }
}

export { CompositeTilemap };
