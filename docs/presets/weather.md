# Weather

<!-- @include: ./_before.md -->

## Overview

`Weather` is an animated overlay preset for:

- rain
- snow
- fog (RPG-style)
- cloud (with optional sun rays)

Rain mode combines scrolling streak layers with short ground impact splashes.
Rain props are read reactively, including `speed`, `windDirection`, `windStrength`, `density`, `maxDrops`, and `topDown`.

It supports static values and reactive signals, can be used inside or outside `Viewport`, and forwards display props like `zIndex` to the underlying `Mesh`.

## What Is Included

`@canvasengine/presets` exports:

- `Weather`
- `RAIN_PRESETS`
- `SNOW_PRESETS`
- `FOG_PRESETS`
- `CLOUD_PRESETS`
- `WEATHER_PRESETS`

## Basic Usage

```html
<Canvas>
  <Weather effect="rain" />
  <Weather effect="snow" />
  <Weather effect="fog" />
  <Weather effect="cloud" />
</Canvas>

<script>
  import { Weather } from '@canvasengine/presets'
</script>
```

## Using Built-in Presets

```html
<Canvas>
  <Weather
    effect={rainPreset.effect}
    speed={rainPreset.speed}
    windDirection={rainPreset.windDirection}
    windStrength={rainPreset.windStrength}
    density={rainPreset.density}
    maxDrops={rainPreset.maxDrops}
    topDown={true}
  />
</Canvas>

<script>
  import { Weather, RAIN_PRESETS } from '@canvasengine/presets'

  const rainPreset = RAIN_PRESETS.steadyRain
</script>
```

### Preset Names

- Rain: `lightRain`, `steadyRain`, `stormRain`
- Snow: `lightSnow`, `winterSnow`, `blizzardSnow`
- Fog: `rpgMorningMist`, `rpgForestFog`, `rpgSwampFog`, `rpgNightFog`, `rpgHeavyFog`
- Cloud: `lightClouds`, `overcastClouds`, `stormClouds`, `goldenHourRays`, `sunnySoftRays`, `sunsetTwinkleRays`, `dramaticCrepuscularRays`, `morningHazeRays`

## Viewport and Layering

### Viewport behavior

When `Weather` is placed inside `Viewport`:

- fog/cloud follow world/camera movement
- weather resolution tracks visible viewport bounds

### Draw order (on top of sprites)

Use `sortableChildren` on `Viewport` and a high `zIndex` on `Weather`.

```html
<Canvas>
  <Viewport worldWidth={2048} worldHeight={2048} sortableChildren={true}>
    <Sprite image="back.png" zIndex={1} />
    <Weather effect="fog" zIndex={1000} />
  </Viewport>
</Canvas>
```

## Cloud Sun Rays

Cloud mode supports sun shafts with directional control and twinkle.

Important behavior:

- rays do not scroll on X over time
- animation is handled by twinkle (`rayTwinkle`, `rayTwinkleSpeed`)

```html
<Weather
  effect="cloud"
  speed={0.12}
  density={0.75}
  height={0.84}
  scale={1.55}
  sunIntensity={1.35}
  sunAngle={0.64}
  raySpread={0.8}
  rayTwinkle={1.0}
  rayTwinkleSpeed={1.6}
/>
```

## Dynamic Control with Signals

```html
<Canvas>
  <Weather
    effect={effectType}
    speed={speed}
    density={density}
    sunIntensity={sunIntensity}
    rayTwinkle={rayTwinkle}
  />
</Canvas>

<script>
  import { Weather } from '@canvasengine/presets'
  import { signal } from 'canvasengine'

  const effectType = signal('cloud')
  const speed = signal(0.12)
  const density = signal(0.75)
  const sunIntensity = signal(1.2)
  const rayTwinkle = signal(0.8)
</script>
```

## Props

| Prop | Type | Default | Used by | Description |
|------|------|---------|---------|-------------|
| `effect` | `string \| Signal<string>` | `'rain'` | all | `'rain'`, `'snow'`, `'fog'`, `'cloud'` |
| `speed` | `number \| Signal<number>` | `0.5` | all | Movement/fall speed |
| `windDirection` | `number \| Signal<number>` | `0.0` | rain/snow | Horizontal wind direction |
| `windStrength` | `number \| Signal<number>` | `0.2` | rain/snow | Wind influence |
| `density` | `number \| Signal<number>` | `120.0` | all | Particle density or fog/cloud intensity |
| `maxDrops` | `number \| Signal<number>` | `80.0` | rain/snow | Rain impact cap / snowflake cap |
| `topDown` | `boolean \| Signal<boolean>` | `true` | rain | Spreads impacts across the visible map. Use `false` to keep impacts near the bottom ground line |
| `height` | `number \| Signal<number>` | `1.0` | fog/cloud | Vertical concentration |
| `scale` | `number \| Signal<number>` | `2.0` | fog/cloud | Noise scale |
| `sunIntensity` | `number \| Signal<number>` | `0.85` | cloud | Sun ray intensity |
| `sunAngle` | `number \| Signal<number>` | `0.85` | cloud | Sun direction angle (radians) |
| `raySpread` | `number \| Signal<number>` | `1.0` | cloud | Ray spread width |
| `rayTwinkle` | `number \| Signal<number>` | `0.45` | cloud | Twinkle amount |
| `rayTwinkleSpeed` | `number \| Signal<number>` | `1.0` | cloud | Twinkle speed |
| `resolution` | `[number, number] \| Signal<[number, number]>` | auto | all | Override internal resolution |

### Forwarded display props

`Weather` forwards extra props to `Mesh` (for example: `zIndex`, `alpha`, `blendMode`, `visible`, `x`, `y`, etc.).

## Recommended Ranges

- Rain/Snow `density`: `80` to `320`
- Fog `density`: `0.7` to `1.7`
- Fog `height`: `0.45` to `0.9`
- Cloud `density`: `0.5` to `1.3`
- Cloud `sunIntensity`: `0.1` to `1.5`
- Cloud `raySpread`: `0.68` to `1.35`
- Cloud `rayTwinkle`: `0.0` to `1.0` (or more for stylized effects)

## Troubleshooting

### I don't see the weather

- increase `density`
- ensure `effect` matches props (e.g. cloud rays need `effect="cloud"`)
- if inside `Viewport`, set `sortableChildren={true}` and `Weather zIndex` high enough

### Fog/cloud should move with camera

- place `Weather` inside `Viewport`
- do not override `resolution` with unrelated values unless needed

### Rays should not drift sideways

- current cloud implementation keeps ray pattern stable in X and animates via twinkle controls
