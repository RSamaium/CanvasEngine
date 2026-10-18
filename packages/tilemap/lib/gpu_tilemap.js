'use strict';

var pixi_js = require('pixi.js');
var settings = require('./settings.js');
var TilemapPipe = require('./TilemapPipe.js');
var TileTextureArray = require('./TileTextureArray.js');

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const gpu_tilemap_vertex = `
struct GlobalUniforms {
  uProjectionMatrix:mat3x3f,
  uWorldTransformMatrix:mat3x3f,
  uWorldColorAlpha: vec4f,
  uResolution: vec2f,
}

struct TilemapUniforms {
  u_proj_trans:mat3x3f,
  u_anim_frame:vec2f
}

@group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
@group(2) @binding(0) var<uniform> loc: TilemapUniforms;

struct VSOutput {
  @builtin(position) vPosition: vec4f,
  @location(0) @interpolate(flat) vTextureId : i32,
  @location(1) vTextureCoord : vec2f,
  @location(2) @interpolate(flat) vFrame : vec4f,
  @location(3) vAlpha : f32
};

@vertex
fn mainVert(
   @location(6) aVertexPosition: vec2f,
   @location(4) aTextureCoord: vec2f,
   @location(3) aFrame: vec4f,
   @location(1) aAnim: vec2f,
   @location(2) aAnimDivisor: f32,
   @location(5) aTextureId: i32,
   @location(0) aAlpha: f32,
 ) -> VSOutput {

  var vPosition = vec4((loc.u_proj_trans * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
  var animCount = floor((aAnim + 0.5) / 2048.0);
  var animFrameOffset = aAnim - animCount * 2048.0;
  var currentFrame = floor(loc.u_anim_frame / aAnimDivisor);
  var loop_num = floor((currentFrame + 0.5) / animCount);
  var animOffset = animFrameOffset * floor(currentFrame - loop_num * animCount);
  var vTextureCoord = aTextureCoord + animOffset;
  var vFrame = aFrame + vec4(animOffset, animOffset);

  return VSOutput(vPosition, aTextureId, vTextureCoord, vFrame, aAlpha);
};
`;
const gpu_tilemap_fragment = `
//include_textures

@fragment
fn mainFrag(
  @location(0) @interpolate(flat) vTextureId : i32,
  @location(1) vTextureCoord : vec2f,
  @location(2) @interpolate(flat) vFrame : vec4f,
  @location(3) vAlpha : f32,
  ) -> @location(0) vec4f {
  var textureCoord = clamp(vTextureCoord, vFrame.xy, vFrame.zw);
  var uv = textureCoord * taf.u_texture_size[vTextureId].zw;
  var dx = dpdx(uv);
  var dy = dpdy(uv);
  var color = sampleMultiTexture(vTextureId, uv, dx, dy);
  return color * vAlpha;
};
`;
class GpuTilemapAdaptor extends TilemapPipe.TilemapAdaptor {
  constructor() {
    super(...arguments);
    __publicField(this, "_shader", null);
    __publicField(this, "max_textures", settings.settings.TEXTURES_PER_TILEMAP);
    __publicField(this, "bind_group", null);
  }
  destroy() {
    this._shader.destroy(true);
    this._shader = null;
  }
  execute(pipe, tilemap) {
    const renderer = pipe.renderer;
    const shader = this._shader;
    shader.groups[0] = renderer.globalUniforms.bindGroup;
    shader.groups[1] = tilemap.getTileset().getBindGroup();
    shader.groups[2] = this.bind_group;
    renderer.encoder.draw({
      geometry: tilemap.vb,
      shader,
      state: tilemap.state,
      size: tilemap.rects_count * 6
    });
  }
  init() {
    this._shader = new pixi_js.Shader({
      gpuProgram: pixi_js.GpuProgram.from({
        vertex: { source: gpu_tilemap_vertex, entryPoint: "mainVert" },
        fragment: {
          source: gpu_tilemap_fragment.replace("//include_textures", TileTextureArray.TileTextureArray.generate_gpu_textures(this.max_textures))
        }
      })
    });
    this.bind_group = new pixi_js.BindGroup({
      ut: this.pipe_uniforms
    });
  }
}
__publicField(GpuTilemapAdaptor, "extension", {
  type: [
    pixi_js.ExtensionType.WebGPUPipesAdaptor
  ],
  name: "tilemap"
});

exports.GpuTilemapAdaptor = GpuTilemapAdaptor;
