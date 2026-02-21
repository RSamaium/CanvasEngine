# Footprints

<!-- @include: ./_before.md -->

## Overview

`Footprints` adds fading footprints behind moving sprites.

- No footprint image is required: the shape is generated procedurally.
- Footprints are emitted from sprites tagged with `footprintCaster`.
- You can tune rendering per surface profile (`sand`, `snow`, custom names).

## Basic Usage

```html
<Canvas>
  <Viewport worldWidth={2048} worldHeight={1280} sortableChildren={true}>
    <Footprints
      profiles={surfaceProfiles}
      defaultSurface="sand"
      updateHz={45}
      maxFootprints={320}
    />

    <Sprite
      x={heroX}
      y={heroY}
      controls={heroControls}
      sheet={heroSheet}
      footprintCaster={heroFootprintCaster}
    />
  </Viewport>
</Canvas>

<script>
  import { signal } from 'canvasengine'
  import { Footprints } from '@canvasengine/presets'

  const heroY = signal(840)
  const snowLine = 560

  const heroFootprintCaster = {
    minStepDistance: 16,
    stepIntervalMs: 70,
    leftOffset: { x: -10, y: 2 },
    rightOffset: { x: 10, y: 2 },
    surface: () => (heroY() <= snowLine ? 'snow' : 'sand'),
  }

  const surfaceProfiles = {
    sand: {
      tint: '#7f5d34',
      lifetimeMs: 1800,
      startAlpha: 0.34,
      blurStart: 0.35,
      blurEnd: 1.6,
      erosionStart: 0.62,
      blendMode: 'multiply',
    },
    snow: {
      tint: '#889db6',
      lifetimeMs: 2600,
      startAlpha: 0.26,
      blurStart: 0.62,
      blurEnd: 2.35,
      erosionStart: 0.43,
      blendMode: 'multiply',
    },
  }
</script>
```

## Preset Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `profiles` | `Record<string, SurfaceProfile> \| Signal<Record> \| () => Record` | Built-in (`default`, `sand`, `snow`) | Surface rendering profiles |
| `defaultSurface` | `string \| Signal<string> \| () => string` | `'default'` | Fallback profile name |
| `maxFootprints` | `number \| Signal<number> \| () => number` | `260` | Maximum active footprints before recycling oldest |
| `updateHz` | `number \| Signal<number> \| () => number` | `30` | Recompute/update frequency |

## `SurfaceProfile`

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `lifetimeMs` | `number` | `1800` | Lifetime before disappearance |
| `startAlpha` | `number` | `0.32` | Initial opacity |
| `endAlpha` | `number` | `0` | Final opacity |
| `tint` | `string \| number` | `0x2d2a26` | Footprint tint color |
| `blendMode` | `string \| number` | `'multiply'` | Blend mode used by footprint sprites |
| `scale` | `number` | `1` | Base scale multiplier |
| `blurStart` | `number` | `0.45` | Initial blur strength |
| `blurEnd` | `number` | `1.9` | Final blur strength |
| `erosionStart` | `number` | `0.54` | Normalized time (`0..1`) where erosion starts |
| `depth` | `number` | `0.58` | Depression intensity (`0..1`) for center darkening |
| `rimStrength` | `number` | `0.14` | Strength of the soft raised edge highlight |

## `footprintCaster` Options

Attach on each sprite that should leave footprints:

```html
<Sprite
  image="hero.png"
  footprintCaster={{
    minStepDistance: 16,
    minSpeed: 44,
    stepIntervalMs: 70,
    leftOffset: { x: -10, y: 2 },
    rightOffset: { x: 10, y: 2 },
    surface: 'sand',
    size: 0.94,
    alpha: 1,
    blur: 0.1,
    angleOffset: 0,
    jitter: 11,
  }}
/>
```

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable emitter on this sprite |
| `footAnchor` | `{ x, y }` | `{ x: 0.5, y: 1 }` | Ground anchor inside sprite bounds |
| `leftOffset` | `{ x, y }` | `{ x: -10, y: 1 }` | Offset for left foot (local walk basis) |
| `rightOffset` | `{ x, y }` | `{ x: 10, y: 1 }` | Offset for right foot (local walk basis) |
| `minStepDistance` | `number` | `18` | Distance needed before emitting a new footprint |
| `minSpeed` | `number` | `36` | Minimum movement speed in px/s required to emit |
| `stepIntervalMs` | `number` | `85` | Minimum delay between two emissions |
| `size` | `number` | `1` | Additional footprint size multiplier |
| `alpha` | `number` | `1` | Opacity multiplier |
| `blur` | `number` | `0` | Extra blur added to profile blur |
| `surface` | `string` | `defaultSurface` | Profile name for this caster |
| `angleOffset` | `number` | `0` | Extra rotation offset in degrees |
| `jitter` | `number` | `8` | Random rotation variation in degrees |

If the footprint appears visually reversed in your art direction, set `angleOffset: 180`.

## Conditional Rules (Terrain / Zones / X-Y)

You can make all important `footprintCaster` fields reactive (functions/signals),
so emission can change by zone, terrain, or position ranges.

```html
<script>
  const zones = [
    { x1: 860, y1: 760, x2: 1260, y2: 980, surface: 'mud', enabled: true, step: 13 },
    { x1: 1460, y1: 840, x2: 1880, y2: 1100, surface: 'rock', enabled: false, step: 20 },
    { x1: 0, y1: 0, x2: 2048, y2: 560, surface: 'snow', enabled: true, step: 14 },
    { x1: 0, y1: 560, x2: 2048, y2: 1280, surface: 'sand', enabled: true, step: 18 },
  ]

  const inZone = (x, y, z) => x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2
  const zoneAt = (x, y) => zones.find((z) => inZone(x, y, z)) ?? zones[zones.length - 1]

  const heroFootprintCaster = {
    enabled: () => zoneAt(heroX(), heroY()).enabled,
    surface: () => zoneAt(heroX(), heroY()).surface,
    minStepDistance: () => zoneAt(heroX(), heroY()).step,
  }
</script>
```

## Tuning Tips

- Start with `blendMode: 'multiply'` for both sand and snow.
- Keep `minStepDistance` between `14` and `22` for readable spacing.
- In snow, use longer `lifetimeMs` and larger `blurEnd`.
- In sand, increase `erosionStart` so traces break up sooner.
