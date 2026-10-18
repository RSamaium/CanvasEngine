'use strict';

var pixi_js = require('pixi.js');
var gl_tilemap = require('./gl_tilemap.js');
var gpu_tilemap = require('./gpu_tilemap.js');
var TilemapPipe = require('./TilemapPipe.js');
var CompositeTilemap = require('./CompositeTilemap.js');
var settings = require('./settings.js');
var Tilemap = require('./Tilemap.js');
var TilemapGeometry = require('./TilemapGeometry.js');

pixi_js.extensions.add(TilemapPipe.TilemapPipe);
pixi_js.extensions.add(gl_tilemap.GlTilemapAdaptor);
pixi_js.extensions.add(gpu_tilemap.GpuTilemapAdaptor);

exports.TilemapAdaptor = TilemapPipe.TilemapAdaptor;
exports.TilemapPipe = TilemapPipe.TilemapPipe;
exports.CompositeTilemap = CompositeTilemap.CompositeTilemap;
exports.Constant = settings.Constant;
exports.settings = settings.settings;
exports.POINT_STRUCT_SIZE = Tilemap.POINT_STRUCT_SIZE;
exports.Tilemap = Tilemap.Tilemap;
exports.TilemapGeometry = TilemapGeometry.TilemapGeometry;
