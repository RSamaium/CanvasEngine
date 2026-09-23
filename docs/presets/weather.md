# Weather

<!-- @include: ./_before.md -->

## Overview

`Weather` is an animated overlay preset for:

- rain
- snow
- fog (RPG-style)
- cloud shadows projected on the ground, with an optional overhead cumulus layer
- light rays (god rays), independent from clouds
- ambient particles: volcano embers, ash, autumn leaves, sakura petals, fireflies, magic spores and sandstorms

Rain mode combines scrolling streak layers with short ground impact splashes.
Rain props are read reactively, including `speed`, `windDirection`, `windStrength`, `density`, `maxDrops`, and `topDown`.

Fog mode is designed for top-down RPG scenes. It combines world-space banks, thin drifting tendrils, and animated clearings instead of applying a uniform screen veil.

It supports static values and reactive signals, can be used inside or outside `Viewport`, and forwards display props like `zIndex` to the underlying `Mesh`.

## What Is Included

`@canvasengine/presets` exports:

- `Weather`
- `RAIN_PRESETS`
- `SNOW_PRESETS`
- `FOG_PRESETS`
- `CLOUD_PRESETS`
- `RAYS_PRESETS`
- `VOLCANO_PRESETS`, `AUTUMN_PRESETS`, `AMBIENT_PRESETS`, `DESERT_PRESETS`
- `WEATHER_PRESETS` (every group) and `getWeatherPreset(name)`

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

The simplest way is the `preset` prop. Explicit props override the preset values:

```html
<Canvas>
  <Weather preset="volcanoEmbers" />
  <Weather preset="autumnGust" windDirection={-1} />
</Canvas>
```

`preset` is read when the component is created. To switch between presets of different effects, wrap `Weather` in an `@if` block.

You can also spread the values yourself:

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
- Rays: `morningSunRays`, `goldenHourShafts`, `forestLightShafts`, `moonbeams`, `holyRays`, `radiantBeams`
- Cloud: `lightClouds`, `overcastClouds`, `stormClouds`, `goldenHourRays`, `sunnySoftRays`, `sunsetTwinkleRays`, `dramaticCrepuscularRays`, `morningHazeRays`, `naturalClouds`
- Volcano: `volcanoEmbers`, `eruptionEmbers`, `ashfall`
- Seasons: `autumnLeaves`, `autumnGust`, `sakuraPetals`, `sakuraStorm`
- Ambient: `summerFireflies`, `swampFireflies`, `forestSpores`, `enchantedSpores`
- Desert: `dustWind`, `sandstorm`

## Ambient Particles

The `embers`, `ash`, `leaves`, `petals`, `fireflies`, `spores` and `sand` effects render lightweight sprite particles over the visible area. Every particle has its own depth (size, speed and parallax), so the field feels layered. Inside a `Viewport`, particles stay anchored to the world when the camera moves.

| Effect | Behavior |
|------|---------|
| `embers` | Glowing sparks rising, flickering and cooling from yellow to red, with a warm haze |
| `ash` | Grey flakes tumbling down, with a smoky haze |
| `leaves` | Three leaf shapes swaying, spinning and flipping in 3D as they fall |
| `petals` | Soft petals drifting and flipping |
| `fireflies` | Wandering glows that blink on and off |
| `spores` | Slow luminous motes floating upward |
| `sand` | Fast streaks following the wind, with a dusty haze |

```html
<Weather
  effect="leaves"
  speed={0.5}
  windDirection={0.6}
  windStrength={0.4}
  density={120}
  maxDrops={90}
  colors={['#6fbf3a', '#9bd14a', '#4e8f2a']}
  particleSize={1.2}
/>
```

- `density` controls how many particles cover a 1280×720 area; `maxDrops` caps the total.
- `windDirection` (`-1` to `1`) and `windStrength` push particles sideways. `sand` follows the sign of `windDirection`.
- `colors` replaces the palette (green leaves, blue embers...).
- `particleSize` multiplies particle sizes.
- `haze` multiplies the background tint of `embers`, `ash` and `sand` (`0` disables it).

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

## Cloud Shadows and Sun Rays

Cloud mode renders broad, moving shadows on the ground instead of a white atmospheric veil. This makes it visually distinct from fog. It also supports optional sun shafts with directional control and twinkle.

Set `cloudOpacity` above `0` to display the overhead cloud itself. The visible layer renders fluffy cumulus seen from above: billowy edges, bright sunlit tops, blue-grey self-shadowed sides and a silver lining. Each cloud projects its own shadow on the ground, offset along `sunAngle`; `cloudAltitude` controls that offset. Keep `cloudOpacity={0}` for shadow-only weather.

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
  shadowIntensity={0.38}
  shadowSoftness={0.65}
  cloudOpacity={0.8}
  cloudAltitude={0.62}
  sunIntensity={1.35}
  sunAngle={0.64}
  raySpread={0.8}
  rayTwinkle={1.0}
  rayTwinkleSpeed={1.6}
/>
```

## Light Rays

`effect="rays"` renders animated light shafts on their own, without clouds. It is drawn with an additive blend mode by default.

```html
<Weather preset="forestLightShafts" zIndex={1000} />

<Weather
  effect="rays"
  sunIntensity={1.4}
  sunAngle={0.7}
  rayFan={0.8}
  rayColor="#ffd98b"
  rayDust={0.8}
/>
```

| Prop | Default | Description |
|------|---------|-------------|
| `sunIntensity` | `0.85` | Brightness of the beams |
| `sunAngle` | `0.85` | Direction the light travels, in radians |
| `raySpread` | `1` | Beam width (lower = thinner, more numerous beams) |
| `rayFan` | `0` | `0` = parallel sun shafts, `1` = beams fanning out from a corner |
| `rayLength` | `1` | How far beams travel before fading (`2` = full screen) |
| `rayTwinkle`, `rayTwinkleSpeed` | `0.45`, `1` | Beams breathing independently |
| `rayDust` | `0.6` | Dust motes glittering inside the beams |
| `rayColor` | `'#fff1c7'` | Light color |
| `speed` | `0.5` | Drift speed of the beams |

Presets: `morningSunRays`, `goldenHourShafts`, `forestLightShafts`, `moonbeams`, `holyRays`, `radiantBeams`.

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
| `preset` | `string \| object` | - | all | Built-in preset name (or values object) applied under the other props |
| `effect` | `string \| Signal<string>` | `'rain'` | all | `'rain'`, `'snow'`, `'fog'`, `'cloud'`, `'rays'`, `'embers'`, `'ash'`, `'leaves'`, `'petals'`, `'fireflies'`, `'spores'`, `'sand'` |
| `speed` | `number \| Signal<number>` | `0.5` | all | Movement/fall speed |
| `windDirection` | `number \| Signal<number>` | `0.0` | rain/snow/particles | Horizontal wind direction |
| `windStrength` | `number \| Signal<number>` | `0.2` | rain/snow/particles | Wind influence |
| `density` | `number \| Signal<number>` | `120.0` | all | Particle density or fog/cloud intensity |
| `maxDrops` | `number \| Signal<number>` | `80.0` | rain/snow/particles | Rain impact cap / snowflake cap / particle cap |
| `colors` | `string[] \| Signal<string[]>` | effect palette | particles | Custom particle palette |
| `particleSize` | `number \| Signal<number>` | `1` | particles | Particle size multiplier |
| `haze` | `number \| Signal<number>` | `1` | embers/ash/sand | Background haze multiplier |
| `topDown` | `boolean \| Signal<boolean>` | `true` | rain | Spreads impacts across the visible map. Use `false` to keep impacts near the bottom ground line |
| `height` | `number \| Signal<number>` | `1.0` | fog/cloud | Bank fullness (`0` = sparse, `1` = full) |
| `scale` | `number \| Signal<number>` | `2.0` | fog/cloud | Noise scale |
| `fogOpacity` | `number \| Signal<number>` | `0.38` | fog | Maximum opacity of dense fog banks (`0` to `0.72`) |
| `fogSoftness` | `number \| Signal<number>` | `0.7` | fog | Fog-bank edge softness (`0` to `1`) |
| `shadowIntensity` | `number \| Signal<number>` | `0.38` | cloud | Ground-shadow opacity (`0` to `0.65`) |
| `shadowSoftness` | `number \| Signal<number>` | `0.65` | cloud | Shadow edge softness (`0` to `1`) |
| `cloudOpacity` | `number \| Signal<number>` | `0` | cloud | Visible overhead-cloud opacity (`0` keeps shadow-only rendering; maximum `0.95`) |
| `cloudAltitude` | `number \| Signal<number>` | `0.55` | cloud | Separation between the visible cloud and its projected shadow (`0` to `1`) |
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
- Particle effects `density`: `60` to `320` (`maxDrops` `60` to `400`)
- Fog `density`: `0.6` to `1.5`
- Fog `height`: `0.4` to `0.7`
- Fog `fogOpacity`: `0.3` to `0.65`
- Fog `fogSoftness`: `0.6` to `0.85`
- Cloud `density`: `0.5` to `1.3`
- Cloud `shadowIntensity`: `0.3` to `0.6`
- Cloud `shadowSoftness`: `0.5` to `0.85`
- Cloud `cloudOpacity`: `0.65` to `0.9` when visible
- Cloud `cloudAltitude`: `0.35` to `0.75`
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
