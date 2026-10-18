import { ExtensionType, UniformGroup, Matrix, Buffer, BufferUsage, NOOP } from 'pixi.js';
import { settings } from './settings.mjs';
import { TilemapGeometry } from './TilemapGeometry.mjs';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class TilemapAdaptor {
  constructor() {
    __publicField(this, "pipe_uniforms", new UniformGroup({
      u_proj_trans: { value: new Matrix(), type: "mat3x3<f32>" },
      u_anim_frame: { value: new Float32Array(2), type: "vec2<f32>" }
    }));
  }
}
const _worldMatrix = new Matrix();
class TilemapPipe {
  constructor(renderer, adaptor) {
    /** The managing renderer */
    __publicField(this, "renderer");
    /** The tile animation frame */
    __publicField(this, "tileAnim", [0, 0]);
    __publicField(this, "ibLen", 0);
    // index buffer length
    /** The index buffer for the tilemaps to share. */
    __publicField(this, "indexBuffer", null);
    /** The shader used to render tilemaps. */
    __publicField(this, "shader");
    __publicField(this, "adaptor");
    this.renderer = renderer;
    this.adaptor = adaptor;
    this.adaptor.init();
    this.indexBuffer = new Buffer({
      data: new Uint16Array([0, 1, 2, 0, 2, 3]),
      label: "index-tilemap-buffer",
      usage: BufferUsage.INDEX | BufferUsage.COPY_DST
    });
    this.indexBuffer.destroy = NOOP;
    this.checkIndexBuffer(2e3);
  }
  start() {
  }
  /**
  * @internal
  * @ignore
  */
  createVb() {
    const geom = new TilemapGeometry(this.indexBuffer);
    geom.lastTimeAccess = Date.now();
    return geom;
  }
  /** @return The {@link TilemapGeometry} shader that this rendering pipeline is using. */
  getShader() {
    return this.shader;
  }
  destroy() {
    this.shader = null;
  }
  // eslint-disable-next-line no-unused-vars
  checkIndexBuffer(size) {
    const totalIndices = size * 6;
    if (totalIndices <= this.ibLen) {
      return;
    }
    this.ibLen = totalIndices;
    this.indexBuffer.data = createIndicesForQuads(
      size,
      settings.use32bitIndex ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices)
    );
  }
  destroyRenderable(_renderable) {
    _renderable.vb.destroy(true);
    _renderable.vb = null;
  }
  addRenderable(tilemap, instructionSet) {
    const batcher = this.renderer.renderPipes.batch;
    tilemap.updateBuffer(this);
    tilemap.checkValid();
    tilemap.getTileset().update();
    if (tilemap.is_valid) {
      batcher.break(instructionSet);
      instructionSet.add(tilemap._instruction);
    }
  }
  updateRenderable(tilemap, _instructionSet) {
    tilemap.updateBuffer(this);
    tilemap.getTileset().update();
  }
  validateRenderable(renderable) {
    return renderable.checkValid();
  }
  execute({ tilemap }) {
    if (!tilemap.isRenderable)
      return;
    tilemap.state.blendMode = tilemap.groupBlendMode;
    const { pipe_uniforms } = this.adaptor;
    const u_proj_trans = pipe_uniforms.uniforms.u_proj_trans;
    // _activeUniforms is a pool of every group bound this frame, not a stack: its last entry
    // belongs to the latest nested filter pass. Rebuild the current context like GlobalUniformSystem.bind().
    const u_global = this.renderer.globalUniforms.globalUniformData;
    let anim_frame = this.tileAnim;
    const { u_anim_frame } = pipe_uniforms.uniforms;
    const world = u_global.worldTransformMatrix;
    const offset = u_global.offset;
    u_global.projectionMatrix.copyTo(u_proj_trans);
    u_proj_trans.append(_worldMatrix.copyFrom(world).translate(-offset.x, -offset.y)).append(tilemap.worldTransform);
    if (tilemap.compositeParent) {
      anim_frame = tilemap.parent.tileAnim || anim_frame;
    }
    u_anim_frame[0] = anim_frame[0];
    u_anim_frame[1] = anim_frame[1];
    pipe_uniforms.update();
    this.adaptor.execute(this, tilemap);
  }
}
__publicField(TilemapPipe, "extension", {
  type: [
    ExtensionType.WebGLPipes,
    ExtensionType.WebGPUPipes
  ],
  name: "tilemap"
});
function createIndicesForQuads(size, outBuffer) {
  const totalIndices = size * 6;
  if (outBuffer.length !== totalIndices) {
    throw new Error(`Out buffer length is incorrect, got ${outBuffer.length} and expected ${totalIndices}`);
  }
  for (let i = 0, j = 0; i < totalIndices; i += 6, j += 4) {
    outBuffer[i + 0] = j + 0;
    outBuffer[i + 1] = j + 1;
    outBuffer[i + 2] = j + 2;
    outBuffer[i + 3] = j + 0;
    outBuffer[i + 4] = j + 2;
    outBuffer[i + 5] = j + 3;
  }
  return outBuffer;
}

export { TilemapAdaptor, TilemapPipe };
