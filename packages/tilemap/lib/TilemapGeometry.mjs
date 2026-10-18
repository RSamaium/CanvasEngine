import { Geometry, Buffer, BufferUsage } from 'pixi.js';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _TilemapGeometry = class _TilemapGeometry extends Geometry {
  constructor(indexBuffer) {
    const buf = new Buffer({
      data: new Float32Array(2),
      label: "tilemap-buffer",
      usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
      shrinkToFit: false
    });
    const stride = _TilemapGeometry.stride;
    super({
      indexBuffer,
      attributes: {
        aVertexPosition: {
          buffer: buf,
          format: "float32x2",
          stride,
          offset: 0
          // location: 6,
        },
        aTextureCoord: {
          buffer: buf,
          format: "float32x2",
          stride,
          offset: 2 * 4
          // location: 4,
        },
        aFrame: {
          buffer: buf,
          format: "float32x4",
          stride,
          offset: 4 * 4
          // location: 3,
        },
        aAnim: {
          buffer: buf,
          format: "float32x2",
          stride,
          offset: 8 * 4
          // location: 1,
        },
        aTextureId: {
          buffer: buf,
          format: "sint32",
          stride,
          offset: 10 * 4
          // location: 5
        },
        aAnimDivisor: {
          buffer: buf,
          format: "float32",
          stride,
          offset: 11 * 4
          // location: 2
        },
        aAlpha: {
          buffer: buf,
          format: "float32",
          stride,
          offset: 12 * 4
          // location: 0
        }
      }
    });
    __publicField(this, "lastTimeAccess", 0);
    __publicField(this, "vertSize", _TilemapGeometry.vertSize);
    __publicField(this, "vertPerQuad", _TilemapGeometry.vertPerQuad);
    __publicField(this, "stride", _TilemapGeometry.stride);
    __publicField(this, "buf");
    this.buf = buf;
  }
};
__publicField(_TilemapGeometry, "vertSize", 13);
__publicField(_TilemapGeometry, "vertPerQuad", 4);
__publicField(_TilemapGeometry, "stride", _TilemapGeometry.vertSize * 4);
let TilemapGeometry = _TilemapGeometry;

export { TilemapGeometry };
