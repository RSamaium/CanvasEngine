'use strict';

var pixi_js = require('pixi.js');
var settings = require('./settings.js');
var TileTextureArray = require('./TileTextureArray.js');

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var POINT_STRUCT = /* @__PURE__ */ ((POINT_STRUCT2) => {
  POINT_STRUCT2[POINT_STRUCT2["U"] = 0] = "U";
  POINT_STRUCT2[POINT_STRUCT2["V"] = 1] = "V";
  POINT_STRUCT2[POINT_STRUCT2["X"] = 2] = "X";
  POINT_STRUCT2[POINT_STRUCT2["Y"] = 3] = "Y";
  POINT_STRUCT2[POINT_STRUCT2["TILE_WIDTH"] = 4] = "TILE_WIDTH";
  POINT_STRUCT2[POINT_STRUCT2["TILE_HEIGHT"] = 5] = "TILE_HEIGHT";
  POINT_STRUCT2[POINT_STRUCT2["ROTATE"] = 6] = "ROTATE";
  POINT_STRUCT2[POINT_STRUCT2["ANIM_X"] = 7] = "ANIM_X";
  POINT_STRUCT2[POINT_STRUCT2["ANIM_Y"] = 8] = "ANIM_Y";
  POINT_STRUCT2[POINT_STRUCT2["TEXTURE_INDEX"] = 9] = "TEXTURE_INDEX";
  POINT_STRUCT2[POINT_STRUCT2["ANIM_COUNT_X"] = 10] = "ANIM_COUNT_X";
  POINT_STRUCT2[POINT_STRUCT2["ANIM_COUNT_Y"] = 11] = "ANIM_COUNT_Y";
  POINT_STRUCT2[POINT_STRUCT2["ANIM_DIVISOR"] = 12] = "ANIM_DIVISOR";
  POINT_STRUCT2[POINT_STRUCT2["ALPHA"] = 13] = "ALPHA";
  return POINT_STRUCT2;
})(POINT_STRUCT || {});
const POINT_STRUCT_SIZE = Object.keys(POINT_STRUCT).length / 2;
class Tilemap extends pixi_js.ViewContainer {
  /**
   * @param tileset - The tileset to use for the tilemap. This can be reset later with {@link Tilemap.setTileset}. The
   *      base-textures in this array must not be duplicated.
   */
  constructor(tileset) {
    super({});
    // TODO: make default color work
    /**
     * Currently doesnt work.
     */
    __publicField(this, "shadowColor", new Float32Array([0, 0, 0, 0.5]));
    __publicField(this, "state", pixi_js.State.for2d());
    __publicField(this, "is_valid", false);
    __publicField(this, "renderPipeId", "tilemap");
    __publicField(this, "canBundle", true);
    __publicField(this, "_instruction", {
      renderPipeId: "tilemap",
      tilemap: this
    });
    /**
     * The tile animation frame.
     *
     * @see CompositeTilemap.tileAnim
     */
    __publicField(this, "tileAnim", null);
    /**
     * This is the last uploaded size of the tilemap geometry.
     * @ignore
     */
    __publicField(this, "rects_count", 0);
    /** @ignore */
    __publicField(this, "compositeParent", false);
    /**
     * The list of base-textures being used in the tilemap.
     *
     * This should not be shuffled after tiles have been added into this tilemap. Usually, only tile textures
     * should be added after tiles have been added into the map.
     */
    __publicField(this, "tileset", new TileTextureArray.TileTextureArray(settings.settings.TEXTURES_PER_TILEMAP));
    /**
     * The local bounds of the tilemap itself. This does not include DisplayObject children.
     */
    __publicField(this, "tilemapBounds", new pixi_js.Bounds());
    /** Flags whether any animated tile was added. */
    __publicField(this, "hasAnimatedTile", false);
    /** The interleaved geometry of the tilemap. */
    __publicField(this, "pointsBuf", []);
    __publicField(this, "batched");
    __publicField(this, "vbId", 0);
    __publicField(this, "vb", null);
    __publicField(this, "vbBuffer", null);
    __publicField(this, "vbArray", null);
    __publicField(this, "vbInts", null);
    this.setTileset(tileset);
  }
  /**
   * @internal
   * @ignore
   */
  checkValid() {
    const v = this.tileset.count > 0 && this.pointsBuf.length > 0;
    const res = this.is_valid !== v;
    this.is_valid = v;
    return res !== v;
  }
  updateBounds() {
    const bounds = this.tilemapBounds;
    this._bounds.minX = bounds.minX;
    this._bounds.maxX = bounds.maxX;
    this._bounds.minY = bounds.minY;
    this._bounds.maxY = bounds.maxY;
  }
  /**
   * @returns The tileset of this tilemap.
   */
  getTileset() {
    return this.tileset;
  }
  /**
   * Define the tileset used by the tilemap.
   *
   * @param textureOrArray - The list of textures to use in the tilemap. If a base-texture (not array) is passed, it will
   *  be wrapped into an array. This should not contain any duplicates.
   */
  setTileset(textureOrArray = []) {
    let ts = this.tileset;
    if (textureOrArray instanceof TileTextureArray.TileTextureArray) {
      this.tileset = textureOrArray;
      this.didViewUpdate = true;
    } else if (textureOrArray instanceof pixi_js.TextureSource) {
      if (ts.count === 1 && ts.arr[0] === textureOrArray) {
        return this;
      }
      ts = this.tileset = new TileTextureArray.TileTextureArray(settings.settings.TEXTURES_PER_TILEMAP);
      ts.push(textureOrArray);
      this.didViewUpdate = true;
    } else {
      if (textureOrArray.length === ts.count) {
        let flag = true;
        for (let i = 0; i < textureOrArray.length; i++) {
          if (textureOrArray[i]?.source !== ts.arr[i]) {
            flag = false;
            break;
          }
        }
        if (flag) {
          return this;
        }
      }
      ts = this.tileset = new TileTextureArray.TileTextureArray(settings.settings.TEXTURES_PER_TILEMAP);
      for (let i = 0; i < textureOrArray.length; i++) {
        ts.push(textureOrArray[i]?.source);
      }
      this.didViewUpdate = true;
    }
    return this;
  }
  /**  Clears all the tiles added into this tilemap. */
  clear() {
    this.pointsBuf.length = 0;
    this.rects_count = 0;
    this.tilemapBounds.clear();
    this.hasAnimatedTile = false;
    return this;
  }
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
  tile(tileTexture, x, y, options = {}) {
    this.didViewUpdate = true;
    let baseTexture;
    let textureIndex = -1;
    let was_num = false;
    if (typeof tileTexture === "number") {
      textureIndex = tileTexture;
      was_num = true;
      baseTexture = this.tileset.arr[textureIndex];
    } else {
      let texture;
      if (typeof tileTexture === "string") {
        texture = pixi_js.Texture.from(tileTexture);
      } else {
        texture = tileTexture;
      }
      const textureList = this.tileset;
      for (let i = 0; i < textureList.count; i++) {
        if (textureList.arr[i] === texture.source) {
          textureIndex = i;
          break;
        }
      }
      if ("frame" in texture) {
        options.u = options.u ?? texture.frame.x;
        options.v = options.v ?? texture.frame.y;
        options.tileWidth = options.tileWidth ?? texture.orig.width;
        options.tileHeight = options.tileHeight ?? texture.orig.height;
      }
      baseTexture = texture.source;
    }
    if (!was_num && !baseTexture) {
      console.error("The tile texture was not found in the tilemap tileset.");
      return this;
    }
    const {
      u = 0,
      v = 0,
      tileWidth = baseTexture.width,
      tileHeight = baseTexture.height,
      animX = 0,
      animY = 0,
      rotate = 0,
      animCountX = 1024,
      animCountY = 1024,
      animDivisor = 1,
      alpha = 1
    } = options;
    const pb = this.pointsBuf;
    this.hasAnimatedTile = this.hasAnimatedTile || animX > 0 || animY > 0;
    pb.push(u);
    pb.push(v);
    pb.push(x);
    pb.push(y);
    pb.push(tileWidth);
    pb.push(tileHeight);
    pb.push(rotate);
    pb.push(animX | 0);
    pb.push(animY | 0);
    pb.push(textureIndex);
    pb.push(animCountX);
    pb.push(animCountY);
    pb.push(animDivisor);
    pb.push(alpha);
    this.tilemapBounds.addFrame(x, y, x + tileWidth, y + tileHeight);
    return this;
  }
  /** Changes the rotation of the last tile. */
  tileRotate(rotate) {
    const pb = this.pointsBuf;
    pb[pb.length - (POINT_STRUCT_SIZE - 9 /* TEXTURE_INDEX */)] = rotate;
  }
  /** Changes the `animX`, `animCountX` of the last tile. */
  tileAnimX(offset, count) {
    const pb = this.pointsBuf;
    pb[pb.length - (POINT_STRUCT_SIZE - 7 /* ANIM_X */)] = offset;
    pb[pb.length - (POINT_STRUCT_SIZE - 10 /* ANIM_COUNT_X */)] = count;
  }
  /** Changes the `animY`, `animCountY` of the last tile. */
  tileAnimY(offset, count) {
    const pb = this.pointsBuf;
    pb[pb.length - (POINT_STRUCT_SIZE - 8 /* ANIM_Y */)] = offset;
    pb[pb.length - (POINT_STRUCT_SIZE - 11 /* ANIM_COUNT_Y */)] = count;
  }
  /** Changes the `animDivisor` value of the last tile. */
  tileAnimDivisor(divisor) {
    const pb = this.pointsBuf;
    pb[pb.length - (POINT_STRUCT_SIZE - 12 /* ANIM_DIVISOR */)] = divisor;
  }
  tileAlpha(alpha) {
    const pb = this.pointsBuf;
    pb[pb.length - (POINT_STRUCT_SIZE - 13 /* ALPHA */)] = alpha;
  }
  destroyVb() {
    if (this.vb) {
      this.vb.destroy();
      this.vb = null;
    }
  }
  updateBuffer(plugin) {
    const points = this.pointsBuf;
    const rects_count = points.length / POINT_STRUCT_SIZE;
    let vb = this.vb;
    if (this.tileset.count === 0 || rects_count === 0 || this.rects_count === rects_count && vb) {
      return;
    }
    this.rects_count = rects_count;
    if (!vb) {
      vb = plugin.createVb();
      this.vb = vb;
      this.vbId = vb.id;
      this.vbBuffer = null;
    }
    const vertices = rects_count * vb.vertPerQuad;
    plugin.checkIndexBuffer(rects_count);
    const vertexBuf = vb.getBuffer("aVertexPosition");
    const vs = vb.stride * vertices;
    if (!this.vbBuffer || this.vbBuffer.byteLength < vs) {
      let bk = vb.stride;
      while (bk < vs) {
        bk *= 2;
      }
      this.vbBuffer = new ArrayBuffer(bk);
      this.vbArray = new Float32Array(this.vbBuffer);
      this.vbInts = new Uint32Array(this.vbBuffer);
    }
    const arr = this.vbArray;
    const ints = this.vbInts;
    let sz = 0;
    let textureId = 0;
    for (let i = 0; i < points.length; i += POINT_STRUCT_SIZE) {
      const eps = 0.5;
      if (this.compositeParent) {
        textureId = points[i + 9 /* TEXTURE_INDEX */];
      }
      const x = points[i + 2 /* X */];
      const y = points[i + 3 /* Y */];
      const w = points[i + 4 /* TILE_WIDTH */];
      const h = points[i + 5 /* TILE_HEIGHT */];
      const u = points[i + 0 /* U */];
      const v = points[i + 1 /* V */];
      let rotate = points[i + 6 /* ROTATE */];
      const animX = points[i + 7 /* ANIM_X */];
      const animY = points[i + 8 /* ANIM_Y */];
      const animWidth = points[i + 10 /* ANIM_COUNT_X */] || 1024;
      const animHeight = points[i + 11 /* ANIM_COUNT_Y */] || 1024;
      const animXEncoded = animX + animWidth * 2048;
      const animYEncoded = animY + animHeight * 2048;
      const animDivisor = points[i + 12 /* ANIM_DIVISOR */];
      const alpha = points[i + 13 /* ALPHA */];
      let u0;
      let v0;
      let u1;
      let v1;
      let u2;
      let v2;
      let u3;
      let v3;
      if (rotate === 0) {
        u0 = u;
        v0 = v;
        u1 = u + w;
        v1 = v;
        u2 = u + w;
        v2 = v + h;
        u3 = u;
        v3 = v + h;
      } else {
        let w2 = w / 2;
        let h2 = h / 2;
        if (rotate % 4 !== 0) {
          w2 = h / 2;
          h2 = w / 2;
        }
        const cX = u + w2;
        const cY = v + h2;
        rotate = pixi_js.groupD8.add(rotate, pixi_js.groupD8.NW);
        u0 = cX + w2 * pixi_js.groupD8.uX(rotate);
        v0 = cY + h2 * pixi_js.groupD8.uY(rotate);
        rotate = pixi_js.groupD8.add(rotate, 2);
        u1 = cX + w2 * pixi_js.groupD8.uX(rotate);
        v1 = cY + h2 * pixi_js.groupD8.uY(rotate);
        rotate = pixi_js.groupD8.add(rotate, 2);
        u2 = cX + w2 * pixi_js.groupD8.uX(rotate);
        v2 = cY + h2 * pixi_js.groupD8.uY(rotate);
        rotate = pixi_js.groupD8.add(rotate, 2);
        u3 = cX + w2 * pixi_js.groupD8.uX(rotate);
        v3 = cY + h2 * pixi_js.groupD8.uY(rotate);
      }
      arr[sz++] = x;
      arr[sz++] = y;
      arr[sz++] = u0;
      arr[sz++] = v0;
      arr[sz++] = u + eps;
      arr[sz++] = v + eps;
      arr[sz++] = u + w - eps;
      arr[sz++] = v + h - eps;
      arr[sz++] = animXEncoded;
      arr[sz++] = animYEncoded;
      ints[sz++] = textureId;
      arr[sz++] = animDivisor;
      arr[sz++] = alpha;
      arr[sz++] = x + w;
      arr[sz++] = y;
      arr[sz++] = u1;
      arr[sz++] = v1;
      arr[sz++] = u + eps;
      arr[sz++] = v + eps;
      arr[sz++] = u + w - eps;
      arr[sz++] = v + h - eps;
      arr[sz++] = animXEncoded;
      arr[sz++] = animYEncoded;
      ints[sz++] = textureId;
      arr[sz++] = animDivisor;
      arr[sz++] = alpha;
      arr[sz++] = x + w;
      arr[sz++] = y + h;
      arr[sz++] = u2;
      arr[sz++] = v2;
      arr[sz++] = u + eps;
      arr[sz++] = v + eps;
      arr[sz++] = u + w - eps;
      arr[sz++] = v + h - eps;
      arr[sz++] = animXEncoded;
      arr[sz++] = animYEncoded;
      ints[sz++] = textureId;
      arr[sz++] = animDivisor;
      arr[sz++] = alpha;
      arr[sz++] = x;
      arr[sz++] = y + h;
      arr[sz++] = u3;
      arr[sz++] = v3;
      arr[sz++] = u + eps;
      arr[sz++] = v + eps;
      arr[sz++] = u + w - eps;
      arr[sz++] = v + h - eps;
      arr[sz++] = animXEncoded;
      arr[sz++] = animYEncoded;
      ints[sz++] = textureId;
      arr[sz++] = animDivisor;
      arr[sz++] = alpha;
    }
    vertexBuf.data = arr;
  }
  /**
   * @internal
   * @ignore
   */
  isModified(anim) {
    if (this.rects_count * POINT_STRUCT_SIZE !== this.pointsBuf.length || anim && this.hasAnimatedTile) {
      return true;
    }
    return false;
  }
  /**
   * This will pull forward the modification marker.
   *
   * @internal
   * @ignore
   */
  clearModify() {
    this.rects_count = this.pointsBuf.length / POINT_STRUCT_SIZE;
  }
  addBounds(bounds) {
    const _bounds = this.tilemapBounds;
    bounds.addFrame(_bounds.minX, _bounds.minY, _bounds.maxX, _bounds.maxY);
  }
  get bounds() {
    return this.tilemapBounds;
  }
  /** @override */
  destroy(options) {
    super.destroy(options);
    this.destroyVb();
  }
  /**
   * Deprecated signature for {@link Tilemap.tile tile}.
   *
   * @deprecated Since @pixi/tilemap 3.
   */
  addFrame(texture, x, y, animX, animY) {
    this.tile(
      texture,
      x,
      y,
      {
        animX,
        animY
      }
    );
    return true;
  }
  /**
   * Deprecated signature for {@link Tilemap.tile tile}.
   *
   * @deprecated Since @pixi/tilemap 3.
   */
  // eslint-disable-next-line max-params
  addRect(textureIndex, u, v, x, y, tileWidth, tileHeight, animX = 0, animY = 0, rotate = 0, animCountX = 1024, animCountY = 1024, animDivisor = 1, alpha = 1) {
    return this.tile(
      textureIndex,
      x,
      y,
      {
        u,
        v,
        tileWidth,
        tileHeight,
        animX,
        animY,
        rotate,
        animCountX,
        animCountY,
        animDivisor,
        alpha
      }
    );
  }
}

exports.POINT_STRUCT_SIZE = POINT_STRUCT_SIZE;
exports.Tilemap = Tilemap;
