# Fog Of War

<!-- @include: ./_before.md -->

## Overview

`FogOfWar` provides an Age-of-Empires style fog system with 3 states:

- `visible`: fully transparent (currently seen)
- `explored`: darkened memory
- `unknown`: opaque black

It is grid-based and works well inside `Viewport`.

## Basic Usage

```html
<Canvas>
  <Viewport worldWidth={2048} worldHeight={2048} sortableChildren={true}>
    <FogOfWar
      mapWidth={2048}
      mapHeight={2048}
      tileSize={32}
      visionSources={visionSources}
      updateHz={15}
      zIndex={1000}
    />
  </Viewport>
</Canvas>

<script>
  import { computed, signal } from 'canvasengine'
  import { FogOfWar } from '@canvasengine/presets'

  const playerX = signal(300)
  const playerY = signal(260)

  const visionSources = computed(() => [
    { x: playerX(), y: playerY(), radius: 220, enabled: true },
  ])
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mapWidth` | `number \| Signal<number>` | required | World/map width in pixels |
| `mapHeight` | `number \| Signal<number>` | required | World/map height in pixels |
| `tileSize` | `number \| Signal<number>` | `32` | Fog grid cell size in pixels |
| `visionSources` | `Array<VisionSource> \| Signal<Array<VisionSource>>` | `[]` | Vision emitters |
| `updateHz` | `number \| Signal<number>` | `15` | Fog recomputation frequency |
| `colors` | `object \| Signal<object>` | `{ unknown: [0,0,0,1], explored: [0,0,0,0.55] }` | Fog colors/alpha |
| `initialExplored` | `boolean \| Signal<boolean>` | `false` | Reveal all as explored on start |
| `zIndex` | `number \| Signal<number>` | inherited | Render order (forwarded to Sprite) |

### `VisionSource`

```ts
type VisionSource = {
  x: number | (() => number)
  y: number | (() => number)
  radius: number | (() => number)
  enabled?: boolean | (() => boolean)
}
```

## Notes

- Use `computed()` for `visionSources` so updates track unit movement naturally.
- For draw order over gameplay, set `Viewport sortableChildren={true}` and a high `zIndex` on `FogOfWar`.
- Current version uses circle vision per source (no LOS occlusion blocking yet).
