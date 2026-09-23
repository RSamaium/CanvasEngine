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

`FX_PRESETS` contains every built-in preset. They are also grouped:

| Group | Presets |
|------|---------|
| `COMBAT_FX_PRESETS` | `hitSpark`, `slashSpark`, `impactBurst`, `smokePuff`, `dustStep`, `dashDust`, `magicBurst`, `healPulse`, `campfire`, `torchFire`, `pickup`, `levelUp`, `explosionSmall` |
| `ATTACK_FX_PRESETS` (strike toward the right) | `swordSlash`, `heavySlash`, `crossSlash`, `spinSlash`, `pierce`, `clawStrike`, `groundSlam`, `comboHits` |
| `EPIC_FX_PRESETS` (limit breaks, ultimates) | `limitBurst`, `holyPillar`, `crystalBurst`, `chargeOrb`, `summonSigil`, `shockwave` |
| `MAGIC_FX_PRESETS` (one-shot spells) | `fireball`, `frostNova`, `iceSpikes`, `thunderStrike`, `holyLight`, `shadowCurse`, `arcaneCharge`, `arcaneBurst`, `teleport`, `poisonCloud`, `windCyclone`, `earthShatter`, `waterSplash`, `criticalHit`, `manaRestore`, `revive`, `meteorImpact` |
| `AURA_FX_PRESETS` (use `loop`) | `magicCircle`, `powerAura`, `shieldBarrier`, `summonPortal`, `magicTrail`, `fireTrail` |
| `STATUS_FX_PRESETS` (use `loop`) | `statusStun`, `statusPoison`, `statusBurn`, `statusFreeze`, `statusCurse` |

```html
<Fx name="fireball" trigger={cast} x={enemyX} y={enemyY} />
<Fx name="statusPoison" x={0} y={-40} loop />
<Fx name="magicCircle" loop scale={1.5} />
```

Attack presets strike toward the right. Aim them with `rotation` (radians) or mirror them with `scale={[-1, 1]}`:

```html
<Fx name="heavySlash" trigger={attack} x={enemyX} y={enemyY} rotation={Math.PI} />
```

Epic presets cover a large area (flash, speed lines, prismatic rings, light pillars). One `Fx` can play any of them through its trigger:

```js
play.start({ name: 'limitBurst' })
play.start({ name: 'holyPillar', color: '#8fd0ff' })
```

`magicTrail` and `fireTrail` emit in world space: move the `Fx` (for example with a projectile) and the particles stay behind as a trail.

## Customizing a Preset

Every preset can be adapted without copying it:

```html
<!-- Same fireball, but green, denser and bigger -->
<Fx name="fireball" trigger={cast} color="#5dff6a" intensity={1.5} sizeScale={1.3} />

<!-- Ice aura turned into a golden one -->
<Fx name="shieldBarrier" loop hueShift={-150} />
```

| Prop | Description |
|------|-------------|
| `color` | Recolors the effect toward this color. White cores, grey smoke and near-black shadows keep their tone, so one preset gives every element |
| `hueShift` | Rotates every color hue, in degrees |
| `intensity` | Multiplies particle counts (`burst` and `rate`) |
| `speedScale` | Multiplies particle speeds (and gravity) |
| `sizeScale` | Multiplies particle sizes |
| `lifetimeScale` | Multiplies particle lifetimes and the preset duration |

A looping effect restarts automatically when one of these props (or `name` / `preset`) changes.

### Per-trigger options

A single `Fx` can cast different variations. Everything passed to `trigger.start()` overrides the props for that cast:

```js
const cast = trigger()

cast.start({ name: 'thunderStrike' })
cast.start({ name: 'fireball', color: '#4aa8ff', x: 40, y: -10 }) // blue fireball, 40px to the right
```

Supported keys: `name`, `preset`, `x`, `y`, and the customization keys above.

### In code

```js
import { FX_PRESETS, customizeFx, registerFxPreset } from '@canvasengine/presets'

const acidBall = customizeFx(FX_PRESETS.fireball, { color: '#8be04a', lifetimeScale: 1.4 })
registerFxPreset('acidBall', acidBall)
```

```html
<Fx name="acidBall" trigger={cast} />
```

`registerFxPreset(name, preset)` makes any preset usable with `name`. A registered name overrides a built-in preset with the same name.

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

## Creating Your Own FX

An FX preset has three levels:

- `Fx` component: where the effect is placed and when it starts.
- `FxPreset`: global timing and the list of emitters.
- `FxEmitterConfig`: how particles are emitted.
- `FxParticleConfig`: what each particle looks like and how it evolves.

Start with a small burst:

```js
const hit = {
  duration: 220,
  emitters: [
    {
      burst: 16,
      angle: [0, 360],
      speed: [100, 260],
      particle: {
        shape: 'spark',
        lifetime: [160, 360],
        color: ['#ffffff', '#ff9f43'],
        alpha: [1, 0],
        scale: [0.18, 0],
        rotationSpeed: [-360, 360],
        blendMode: 'add',
        ease: 'outCubic',
      },
    },
  ],
}
```

Use it with a trigger:

```html
<Fx preset={hit} trigger={hitTrigger} x={enemyX} y={enemyY} />
```

### Magic shapes

Spells usually need particles that gather, spin or form rings. Emitters support circular zones and radial movement:

```js
const darkOrb = {
  duration: 700,
  emitters: [
    {
      // particles spiral toward the center (charge)
      burst: 30,
      radius: [60, 95],
      direction: 'inward',
      speed: [60, 110],
      orbit: 140,
      particle: { shape: 'softCircle', lifetime: [480, 760], color: ['#c58bff', '#5a1e99'], alpha: [0, 0.85, 0], scale: [0.5, 0.15], blendMode: 'add' },
    },
    {
      // then burst outward
      delay: 400,
      burst: 20,
      radius: 4,
      direction: 'outward',
      speed: [160, 300],
      drag: 3,
      particle: { shape: 'spark', align: 'velocity', lifetime: [320, 620], color: ['#e8c4ff', '#7a2cff'], scale: [0.2, 0], blendMode: 'add' },
    },
  ],
}
```

- `radius` / `innerRadius` spawn particles in a disc or a ring.
- `ellipse` squashes that circle (and `orbit`) vertically, e.g. `0.4` for a circle drawn on the ground.
- `direction: 'outward' | 'inward' | 'tangent'` aims particles relative to the center.
- `orbit` (deg/s) makes particles turn around the center.
- `drag` slows particles down: fast bursts that stop sharply feel much more impactful.
- `align: 'velocity'` orients `spark` and `diamond` particles along their movement.
- `alpha`, `scale` and `color` accept more than two stops: `alpha: [0, 1, 0]` fades in then out.
- `burstCount` + `burstInterval` repeat a burst (thunder flashes, pulses).
- `scaleX` / `scaleY` stretch a particle over its lifetime: a `beam` growing into a pillar, a `streak` extending into a speed line.
- `perspective` squashes a particle *after* its rotation, so a spinning `sigil` or `ring` looks laid on the ground (`scaleY` would squash before rotating and make the ellipse wobble).

For a looped effect, use `rate` and `loop`:

```js
const aura = {
  duration: 1000,
  emitters: [
    {
      loop: true,
      rate: 18,
      angle: [-120, -60],
      speed: [10, 46],
      spreadX: 18,
      particle: {
        shape: 'softCircle',
        lifetime: [600, 1200],
        color: ['#8fffe0', '#4aa8ff'],
        alpha: [0.45, 0],
        scale: [0.25, 1.2],
        blendMode: 'add',
      },
    },
  ],
}
```

Use it with `loop` on the component:

```html
<Fx preset={aura} x={playerX} y={playerY} loop />
```

### Tuning Rules

- Use `burst` for instantaneous effects: hit, pickup, explosion, landing.
- Use `rate` for continuous effects: fire, aura, smoke, fireflies.
- `angle` is in degrees. `0` goes right, `90` goes down, `-90` goes up.
- Use the component `rotation` to orient directional presets such as slash or dash effects.
- Keep short combat particles around `120-450ms`.
- Keep smoke, healing, and magic particles around `500-1200ms`.
- Prefer `blendMode: 'add'` for light, magic, fire, sparks, and stars.
- Prefer normal blend mode for smoke, dust, leaves, and debris.
- If many effects can overlap, lower `rate`, `burst`, or set `maxParticles`.

### Design Pattern

Most polished effects combine two emitters:

- one fast emitter for the readable impact shape;
- one slower emitter for glow, smoke, dust, or secondary particles.

Example:

```js
const impactWithSmoke = {
  duration: 280,
  emitters: [
    {
      burst: 20,
      angle: [0, 360],
      speed: [140, 320],
      particle: {
        shape: 'spark',
        lifetime: [140, 340],
        color: ['#ffffff', '#ffb347'],
        alpha: [1, 0],
        scale: [0.2, 0],
        blendMode: 'add',
      },
    },
    {
      burst: 8,
      angle: [0, 360],
      speed: [20, 70],
      particle: {
        shape: 'softCircle',
        lifetime: [360, 760],
        color: '#777777',
        alpha: [0.25, 0],
        scale: [0.35, 1.4],
      },
    },
  ],
}
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

### Prompt for a Single Particle Image

Use this kind of prompt when you want one reusable particle texture:

```txt
Create a single game VFX particle sprite: [spark / smoke puff / flame ember / magic star].
Centered object, isolated, transparent background, square image, clean alpha edges.
White or grayscale material so it can be tinted in-engine.
Soft falloff, no hard black outline, no text, no UI, no scene, no ground shadow.
The particle must fit entirely inside the canvas with safe padding on every side.
Export as transparent PNG, 1024x1024.
```

Good variants:

```txt
Single soft smoke particle, centered, transparent background, grayscale, soft circular falloff, no scene, no text, no border, transparent PNG, 1024x1024.
```

```txt
Single bright slash spark particle, horizontal streak, centered, transparent background, white core with soft glow, no scene, no text, safe padding, transparent PNG, 1024x1024.
```

After generation, resize to `64x64` or `128x128` for runtime use.

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

### Prompt for a Spritesheet

CanvasEngine expects Pixi-compatible spritesheet data when using `spritesheet`.
Image generation tools usually create only the PNG. Use a packer such as Aseprite,
TexturePacker, or Free Texture Packer to export the Pixi JSON file.

Prompt for animated frames:

```txt
Create a 4x4 spritesheet for a looping game VFX animation: [small flame / magic sparkle / smoke dissolve].
Transparent background. Equal-size cells. Each frame centered with consistent registration.
No text, no numbers, no grid lines, no scene, no camera perspective, no cropped particles.
Keep the effect inside each cell with safe padding.
White or grayscale if it should be tinted in-engine.
Output as one transparent PNG spritesheet.
```

Prompt for random variants:

```txt
Create a spritesheet with 12 different small particle variants: [gold spark / dust mote / blue magic star].
Transparent background, equal-size cells, one centered particle per cell, consistent scale, safe padding.
No text, no labels, no grid lines, no background, no shadows outside the particles.
Output as one transparent PNG spritesheet.
```

Recommended export:

- use square cells: `64x64` for sparks/stars, `128x128` for smoke/fire;
- keep frame names stable, for example `spark_01.png`, `spark_02.png`;
- export a Pixi JSON spritesheet and reference those names in `frames`;
- use `frameMode: 'random'` for variants;
- use `frameMode: 'animated'` and `frameRate` for frame-by-frame particles.

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
| `color` | `string \| number` | - | Recolors the preset (see [Customizing a Preset](#customizing-a-preset)) |
| `hueShift` | `number` | - | Rotates color hues, in degrees |
| `intensity` | `number` | `1` | Particle count multiplier |
| `speedScale` | `number` | `1` | Particle speed multiplier |
| `sizeScale` | `number` | `1` | Particle size multiplier |
| `lifetimeScale` | `number` | `1` | Particle lifetime multiplier |
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
| `burstCount` | `number` | Number of bursts (default `1`, infinite when looping with `burstInterval`) |
| `burstInterval` | `number` | Delay between bursts, in ms |
| `rate` | `number` | Particles emitted per second |
| `maxParticles` | `number` | Emitter particle cap |
| `x`, `y` | `number` | Local emitter offset |
| `spreadX`, `spreadY` | `number` | Random spawn spread |
| `radius` | `number \| [number, number]` | Spawns particles in a circle around the emitter |
| `innerRadius` | `number` | Turns the circle into a ring |
| `ellipse` | `number` | Vertical squash of `radius` and `orbit` (`1` = circle) |
| `direction` | `'angle' \| 'outward' \| 'inward' \| 'tangent'` | Velocity direction (default `'angle'`) |
| `angle` | `number \| [number, number]` | Direction in degrees |
| `speed` | `number \| [number, number]` | Initial speed in px/s |
| `accelerationX`, `accelerationY` | `number` | Acceleration in px/s |
| `gravity` | `number` | Vertical acceleration in px/s |
| `drag` | `number` | Velocity damping per second |
| `orbit` | `number \| [number, number]` | Rotation around the emitter center, in deg/s |
| `space` | `'local' \| 'world'` | `world` leaves particles behind when the `Fx` moves |
| `particle` | `FxParticleConfig` | Particle appearance and lifetime |

## `FxParticleConfig`

| Field | Type | Description |
|------|------|-------------|
| `shape` | `'circle' \| 'softCircle' \| 'spark' \| 'square' \| 'star' \| 'ring' \| 'diamond' \| 'flare' \| 'flame' \| 'bubble' \| 'slash' \| 'streak' \| 'beam' \| 'sigil' \| 'prism'` | Procedural shape. `slash` is a blade crescent facing right, `streak` a speed line, `beam` a light column (use `anchor: { x: 0.5, y: 1 }`), `sigil` a magic circle, `prism` a chromatic ring (keep `color` white) |
| `image` | `string` | Single image URL |
| `texture` | `Texture` | Existing Pixi texture |
| `spritesheet` | `string` | Pixi spritesheet JSON URL |
| `frame` | `string` | Single spritesheet frame |
| `frames` | `string[]` | Multiple spritesheet frames |
| `frameMode` | `'first' \| 'random' \| 'animated'` | Frame selection mode |
| `frameRate` | `number` | Animated frame rate |
| `lifetime` | `number \| [number, number]` | Lifetime in ms |
| `color`, `tint` | `string \| number \| string[]` | Particle tint, or color stops over the lifetime |
| `alpha` | `number \| number[]` | Alpha over lifetime (`[start, end]` or more keyframes) |
| `scale` | `number \| number[]` | Scale over lifetime (`[start, end]` or more keyframes) |
| `scaleX`, `scaleY` | `number \| number[]` | Horizontal / vertical stretch over lifetime, multiplied with `scale` |
| `perspective` | `number` | Vertical squash applied after rotation (ground-plane effects) |
| `rotation` | `number \| [number, number]` | Initial rotation in degrees |
| `rotationSpeed` | `number \| [number, number]` | Rotation speed in degrees/s |
| `align` | `'velocity'` | Orients the particle along its movement |
| `blendMode` | `string` | Pixi blend mode |
| `anchor` | `{ x, y }` | Sprite anchor |
| `ease` | `'linear' \| 'outQuad' \| 'outCubic' \| 'inQuad'` | Lifetime interpolation |
