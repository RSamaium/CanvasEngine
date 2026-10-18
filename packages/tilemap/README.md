# @canvasengine/tilemap - Canvas Engine Tilemap Kit

[![Automation CI](https://github.com/pixijs-userland/tilemap/actions/workflows/main.yml/badge.svg)](https://github.com/pixijs-userland/tilemap/actions/workflows/main.yml)
<p align="center">
<img src="https://i.imgur.com/hfoiBRk.png" width="1280px" />
<p/>

> Just forked from pixijs/tilemap (fix for latest pixijs)

This package provides a low-level rectangular tilemap implementation, optimized for high performance rendering and a
out-of-the-box canvas fallback.

## Version Compatiblity

| PixiJS | PixiJS Tilemap Kit |
|--------|--------------------|
| v4.x   | v1.x               |
| v5.x   | v2.x               |
| v6.x   | v3.x               |
| v7.x   | v4.x               |
| v8.x   | v5.x               |

## Installation :package:

```bash
npm install --save @canvasengine/tilemap
```

You can also use the browser bundle:

```
<script src="https://cdn.jsdelivr.net/npm/@pixi/tilemap@latest/dist/pixi-tilemap.js"></script>
```

## Usage

In short, the tilemap you create will render each tile texture at the provided position and dimensions. Generally, a
spritesheet is used to load the tileset assets:

```ts
import { Assets } from 'pixi.js';
import { CompositeTilemap } from '@canvasengine/tilemap';

Assets.add('atlas', 'atlas.json');
Assets.load(['atlas']).then(() =>
{
    const tilemap = new CompositeTilemap();

    // Render your first tile at (0, 0)!
    tilemap.tile('grass.png', 0, 0);
});
```

`CompositeTilemap` is actually a lazy composite of layered `Tilemap` instances. A `Tilemap` has a fixed number of tile
textures (the tileset) it can render in one go. Usually, `CompositeTilemap` abstracts away this limitation in a robust
enough manner.

### Demos

* [Basic Demo (WebGL)](https://userland.pixijs.io/tilemap/examples/basic.html)
* [Basic Demo (WebGPU)](https://userland.pixijs.io/tilemap/examples/basic.html?preference=webgpu)

### Settings

```ts
import { settings } from '@pixi/tilemap';
```

| Setting | Description |
|---------|-------------|
| `TEXTURES_PER_TILEMAP` | Temporarily switched off |
| `TEXTILE_UNITS` | Temporarily switched off |
| `use32bitIndex` | There's also a limitation on 16k tiles per one tilemap. If you want to lift it, please use PixiJS v5.1.0 and following setting `settings.use32bitIndex = true;` |

## RPGMaker

Canvas fallback is 5x slower than vanilla rpgmaker. WebGL version is faster and doesnt use extra textures.

### RPGMaker Demo

* [WebGL Demo](https://userland.pixijs.io/tilemap/examples/)
  * [60% Scale](https://userland.pixijs.io/tilemap/examples/?scale=0.6)
  * [140% Scale](https://userland.pixijs.io/tilemap/examples/?scale=1.4)
* [WebGL Retina Demo](https://userland.pixijs.io/tilemap/examples/?resolution=2)
  * [60% Scale](https://userland.pixijs.io/tilemap/examples/?resolution=2&scale=0.6)
  * [140% Scale](https://userland.pixijs.io/tilemap/examples/?resolution=2&scale=1.4)
* [WebGPU Demo](https://userland.pixijs.io/tilemap/examples/?preference=webgpu)

## More Tutorials

* [Alan01252 Tutorial](https://github.com/Alan01252/pixi-tilemap-tutorial)
