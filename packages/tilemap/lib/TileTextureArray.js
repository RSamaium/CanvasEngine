'use strict';

var pixi_js = require('pixi.js');

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class TileTextureArray {
  constructor(max_textures) {
    __publicField(this, "max_textures");
    __publicField(this, "arr", []);
    __publicField(this, "count", 0);
    __publicField(this, "dirty", false);
    __publicField(this, "dirty_gpu", false);
    __publicField(this, "bind_group", null);
    __publicField(this, "bind_group_resources", {});
    __publicField(this, "tex_sizes", null);
    __publicField(this, "null_color", new Float32Array([0, 0, 0, 0.5]));
    __publicField(this, "tex_buf", null);
    this.max_textures = max_textures;
    this.tex_sizes = new Float32Array(this.max_textures * 4 + 4);
    this.tex_buf = new pixi_js.Buffer({
      usage: pixi_js.BufferUsage.UNIFORM | pixi_js.BufferUsage.COPY_DST
    });
  }
  get length() {
    return this.count;
  }
  push(tex) {
    this.arr[this.count++] = tex;
    this.dirty = true;
  }
  at(ind) {
    return this.arr[ind];
  }
  update() {
    if (!this.dirty) {
      return;
    }
    this.dirty = false;
    this.dirty_gpu = true;
    const { tex_sizes, arr, count, max_textures, null_color } = this;
    for (let i = 0; i < count; i++) {
      const tex = arr[i];
      if (tex) {
        tex_sizes[i * 4] = tex.pixelWidth;
        tex_sizes[i * 4 + 1] = tex.pixelHeight;
        tex_sizes[i * 4 + 2] = 1 / tex.pixelWidth;
        tex_sizes[i * 4 + 3] = 1 / tex.pixelHeight;
      }
    }
    tex_sizes[max_textures * 4] = null_color[0];
    tex_sizes[max_textures * 4 + 1] = null_color[1];
    tex_sizes[max_textures * 4 + 2] = null_color[2];
    tex_sizes[max_textures * 4 + 3] = null_color[3];
  }
  markDirty() {
    this.dirty = true;
  }
  getBindGroup() {
    this.update();
    if (!this.dirty_gpu) {
      return this.bind_group;
    }
    const { bind_group_resources, max_textures, arr, count } = this;
    let bindIndex = 0;
    bind_group_resources[bindIndex++] = new pixi_js.UniformGroup({
      u_texture_size: {
        value: this.tex_sizes,
        type: "vec4<f32>",
        size: max_textures
      },
      u_null_color: {
        value: this.null_color,
        type: "vec4<f32>"
      }
    });
    for (let i = 0; i < max_textures; i++) {
      const texture = (i < count ? arr[i] : null) || pixi_js.Texture.EMPTY.source;
      bind_group_resources[bindIndex++] = texture.source;
      bind_group_resources[bindIndex++] = texture.style;
    }
    if (!this.bind_group) {
      this.bind_group = new pixi_js.BindGroup(bind_group_resources);
    }
    return this.bind_group;
  }
  static generate_gpu_textures(max_textures) {
    const src = [];
    src.push(`struct TextureArrayFields {`);
    src.push(`    u_texture_size: array<vec4f, ${max_textures}>,`);
    src.push(`    u_null_color: vec4f`);
    src.push(`}`);
    src.push(`@group(1) @binding(0) var<uniform> taf: TextureArrayFields;`);
    for (let i = 0; i < max_textures; i++) {
      src.push(`@group(1) @binding(${i * 2 + 1}) var u_texture_${i}: texture_2d<f32>;`);
      src.push(`@group(1) @binding(${i * 2 + 2}) var u_sampler_${i}: sampler;`);
    }
    src.push("fn sampleMultiTexture(texture_id: i32, uv: vec2f, dx: vec2f, dy: vec2f) -> vec4f {");
    src.push(`switch texture_id {`);
    for (let i = 0; i < max_textures; i++) {
      src.push(`  case ${i}: { return textureSampleGrad(u_texture_${i}, u_sampler_${i}, uv, dx, dy); }`);
    }
    src.push(`  default: { return taf.u_null_color; }`);
    src.push("} }");
    return src.join("\n");
  }
  static generate_gl_textures(max_textures) {
    const src = [];
    src.push(`uniform vec4 u_texture_size[${max_textures + 1}];`);
    src.push(`uniform sampler2D u_textures[${max_textures}];`);
    src.push(`uniform vec4 u_null_color;`);
    src.push("vec4 sampleMultiTexture(float texture_id, vec2 uv) {");
    src.push(`if(texture_id < -0.5) return u_texture_size[${max_textures}];`);
    for (let i = 0; i < max_textures; i++) {
      src.push(`if(texture_id < ${i}.5) return texture(u_textures[${i}], uv * u_texture_size[${i}].zw);`);
    }
    src.push(`return u_texture_size[${max_textures}];`);
    src.push("}");
    return src.join("\n");
  }
  static gl_gen_resources(max_textures) {
    const sampleValues = [];
    for (let i = 0; i < max_textures; i++) {
      sampleValues[i] = i;
    }
    const samplerSize = [];
    for (let i = 0; i < max_textures; i++) {
      samplerSize.push(2048);
      samplerSize.push(2048);
      samplerSize.push(1 / 2048);
      samplerSize.push(1 / 2048);
    }
    return {
      u_textures: {
        value: sampleValues,
        type: "i32",
        size: max_textures
      },
      u_texture_size: {
        value: samplerSize,
        type: "vec4<f32>",
        size: max_textures
      }
    };
  }
}

exports.TileTextureArray = TileTextureArray;
