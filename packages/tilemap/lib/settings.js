'use strict';

const settings = {
  /** The default number of textures per tilemap in a tilemap composite. */
  TEXTURES_PER_TILEMAP: 16,
  /** The scaling mode of the combined texture tiling. */
  TEXTILE_SCALE_MODE: "linear",
  /** This will enable 32-bit index buffers. It's useful when you have more than 16K tiles. */
  use32bitIndex: false
};
const Constant = settings;

exports.Constant = Constant;
exports.settings = settings;
