# Fog Of War

<!-- @include: ./_before.md -->

## Overview

`FogOfWar` provides an Age-of-Empires style fog system with 3 states:

- `visible`: fully transparent (currently seen)
- `explored`: darkened memory
- `unknown`: opaque black

It works well inside `Viewport`, supports smooth rendering, and can expose visibility queries for gameplay objects.

## Basic Usage

```html
<Canvas>
  <Viewport worldWidth={2048} worldHeight={2048} sortableChildren={true}>
    <FogOfWar
      mapWidth={2048}
      mapHeight={2048}
      tileSize={32}
      smooth={true}
      renderScale={2}
      edgeSoftness={22}
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
| `smooth` | `boolean \| Signal<boolean>` | `true` | Enables smooth fog interpolation |
| `renderScale` | `number \| Signal<number>` | `2` | Internal fog resolution multiplier (higher = smoother, heavier CPU) |
| `edgeSoftness` | `number \| Signal<number>` | `22` | Soft transition width (pixels) around vision circles |
| `visionSources` | `Array<VisionSource> \| Signal<Array<VisionSource>>` | `[]` | Vision emitters |
| `updateHz` | `number \| Signal<number>` | `15` | Fog recomputation frequency |
| `colors` | `object \| Signal<object>` | `{ unknown: [0,0,0,1], explored: [0,0,0,0.55] }` | Fog colors/alpha |
| `initialExplored` | `boolean \| Signal<boolean>` | `false` | Reveal all as explored on start |
| `controller` | `FogOfWarController` | none | Exposes `clarityAt/isVisibleAt/stateAt` for object visibility logic |
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

### `FogOfWarController`

```ts
import { createFogOfWarController } from '@canvasengine/presets'

const fog = createFogOfWarController()

fog.clarityAt(x, y) // 0..1
fog.isVisibleAt(x, y, 0.72) // true only in "very clear" zone
fog.isExploredAt(x, y) // true if already discovered
fog.stateAt(x, y) // "visible" | "explored" | "unknown"
```

## Gameplay Visibility Example

Use this when some objects should stay normal (current behavior), while others are visible only in clear vision.

```html
<Rect x={relicX} y={relicY} width={34} height={34} color="#ffd166" />
<Rect x={enemyX} y={enemyY} width={34} height={34} color="#5ee7ff" visible={enemyVisible} />

<FogOfWar
  mapWidth={worldWidth}
  mapHeight={worldHeight}
  visionSources={visionSources}
  controller={fog}
  smooth={true}
  renderScale={2}
  edgeSoftness={22}
/>

<script>
  import { computed } from 'canvasengine'
  import { createFogOfWarController } from '@canvasengine/presets'

  const fog = createFogOfWarController()
  const enemyVisible = computed(() => fog.isVisibleAt(enemyX() + 17, enemyY() + 17, 0.72))
</script>
```

## Notes

- Use `computed()` for `visionSources` so updates track unit movement naturally.
- For draw order over gameplay, set `Viewport sortableChildren={true}` and a high `zIndex` on `FogOfWar`.
- Current version uses circle vision per source (no LOS occlusion blocking yet).
