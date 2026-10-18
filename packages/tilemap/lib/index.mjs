import { extensions } from 'pixi.js';
import { GlTilemapAdaptor } from './gl_tilemap.mjs';
import { GpuTilemapAdaptor } from './gpu_tilemap.mjs';
import { TilemapPipe } from './TilemapPipe.mjs';
export { TilemapAdaptor } from './TilemapPipe.mjs';
export { CompositeTilemap } from './CompositeTilemap.mjs';
export { Constant, settings } from './settings.mjs';
export { POINT_STRUCT_SIZE, Tilemap } from './Tilemap.mjs';
export { TilemapGeometry } from './TilemapGeometry.mjs';

extensions.add(TilemapPipe);
extensions.add(GlTilemapAdaptor);
extensions.add(GpuTilemapAdaptor);

export { TilemapPipe };
