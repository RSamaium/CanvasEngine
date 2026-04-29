# Fx

<!-- @include: ./_before.md -->

## Overview

`Fx` is a small particle effect preset system built into `@canvasengine/presets`.

- No external FX dependency is required.
- Effects can use procedural shapes, images, Pixi textures, or spritesheet frames.
- Effects can be triggered once, started on mount, or looped.
- Built-in presets are available through `FX_PRESETS`.

## Basic Usage

```html
<Canvas>
  <Fx name="hitSpark" trigger={hit} x={240} y={180} />
  <Fx name="campfire" x={420} y={300} loop />
</Canvas>

<script>
  import { Fx } from '@canvasengine/presets'
  import { trigger } from 'canvasengine'

  const hit = trigger()

  setInterval(() => {
    hit.start()
  }, 900)
</script>
```

## Built-in Presets

```js
import { FX_PRESETS } from '@canvasengine/presets'
```

Available preset names:

- `hitSpark`
- `smokePuff`
- `dustStep`
- `magicBurst`
- `campfire`
- `pickup`
- `explosionSmall`

## Custom Preset

```html
<Fx preset={coinSpark} trigger={pickup} x={playerX} y={playerY} />

<script>
  const coinSpark = {
    duration: 300,
    emitters: [
      {
        burst: 18,
        angle: [0, 360],
        speed: [80, 220],
        particle: {
          shape: 'star',
          lifetime: [260, 620],
          color: ['#ffffff', '#ffd84a'],
          alpha: [1, 0],
          scale: [0.2, 0.7],
          blendMode: 'add',
        },
      },
    ],
  }
</script>
```

## Image Particles

A single transparent image is enough for most effects.

Recommended image format:

- `png` or `webp`
- transparent background
- centered artwork
- `32x32`, `64x64`, or `128x128`
- white or grayscale if you want to apply `tint` / `color`

```js
const smoke = {
  emitters: [
    {
      burst: 16,
      angle: [-120, -60],
      speed: [12, 48],
      particle: {
        image: '/fx/smoke.png',
        lifetime: [600, 1200],
        scale: [0.4, 1.8],
        alpha: [0.35, 0],
      },
    },
  ],
}
```

## Spritesheet Frames

Spritesheets are useful when you have many FX images, random variants, or animated particles.

```js
const fire = {
  emitters: [
    {
      loop: true,
      rate: 24,
      particle: {
        spritesheet: '/fx/fx-spritesheet.json',
        frames: ['fire_01.png', 'fire_02.png', 'fire_03.png', 'fire_04.png'],
        frameMode: 'animated',
        frameRate: 12,
        lifetime: [360, 720],
        alpha: [0.9, 0],
        scale: [0.4, 1.1],
        blendMode: 'add',
      },
    },
  ],
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string \| Signal<string>` | `'hitSpark'` | Built-in preset name |
| `preset` | `FxPreset \| Signal<FxPreset>` | - | Custom preset object |
| `trigger` | `Trigger` | - | Starts a new effect when triggered |
| `autostart` | `boolean` | `false` | Starts once when mounted |
| `loop` | `boolean` | `false` | Keeps emitters active |
| `enabled` | `boolean \| Signal<boolean>` | `true` | Enables or disables spawning |
| `x`, `y` | `number \| Signal<number>` | `0` | Effect container position |
| `rotation` | `number \| Signal<number>` | `0` | Effect container rotation |
| `scale` | `number \| Signal<number>` | `1` | Effect container scale |
| `alpha` | `number \| Signal<number>` | `1` | Effect container alpha |
| `timeScale` | `number \| Signal<number>` | `1` | Multiplies update speed |
| `maxParticles` | `number` | `600` | Particle cap |
| `preload` | `boolean` | `true` | Loads image/spritesheet assets before spawning |
| `missingTexture` | `'shape' \| 'skip' \| 'error'` | `'shape'` | Behavior when an image texture is unavailable |
| `onStart` | `(instance) => void` | - | Called when an effect starts |
| `onComplete` | `(instance) => void` | - | Called when all particles are done |
| `onParticleSpawn` | `(particle) => void` | - | Called for each spawned particle |

Extra display props such as `zIndex` are forwarded to the underlying `Container`.

## `FxPreset`

| Field | Type | Description |
|------|------|-------------|
| `delay` | `number` | Delay before the preset starts, in ms |
| `duration` | `number` | Preset emission duration, in ms |
| `emitters` | `FxEmitterConfig[]` | Emitters used by the preset |

## `FxEmitterConfig`

| Field | Type | Description |
|------|------|-------------|
| `delay` | `number` | Delay before this emitter starts |
| `duration` | `number` | Emitter duration |
| `loop` | `boolean` | Keeps this emitter active |
| `burst` | `number` | Number of particles emitted immediately |
| `rate` | `number` | Particles emitted per second |
| `maxParticles` | `number` | Emitter particle cap |
| `x`, `y` | `number` | Local emitter offset |
| `spreadX`, `spreadY` | `number` | Random spawn spread |
| `angle` | `number \| [number, number]` | Direction in degrees |
| `speed` | `number \| [number, number]` | Initial speed in px/s |
| `accelerationX`, `accelerationY` | `number` | Acceleration in px/s |
| `gravity` | `number` | Vertical acceleration in px/s |
| `particle` | `FxParticleConfig` | Particle appearance and lifetime |

## `FxParticleConfig`

| Field | Type | Description |
|------|------|-------------|
| `shape` | `'circle' \| 'softCircle' \| 'spark' \| 'square' \| 'star'` | Procedural fallback shape |
| `image` | `string` | Single image URL |
| `texture` | `Texture` | Existing Pixi texture |
| `spritesheet` | `string` | Pixi spritesheet JSON URL |
| `frame` | `string` | Single spritesheet frame |
| `frames` | `string[]` | Multiple spritesheet frames |
| `frameMode` | `'first' \| 'random' \| 'animated'` | Frame selection mode |
| `frameRate` | `number` | Animated frame rate |
| `lifetime` | `number \| [number, number]` | Lifetime in ms |
| `color`, `tint` | `string \| number \| [start, end]` | Particle tint |
| `alpha` | `number \| [number, number]` | Alpha over lifetime |
| `scale` | `number \| [number, number]` | Scale over lifetime |
| `rotation` | `number \| [number, number]` | Initial rotation in degrees |
| `rotationSpeed` | `number \| [number, number]` | Rotation speed in degrees/s |
| `blendMode` | `string` | Pixi blend mode |
| `anchor` | `{ x, y }` | Sprite anchor |
| `ease` | `'linear' \| 'outQuad' \| 'outCubic' \| 'inQuad'` | Lifetime interpolation |

