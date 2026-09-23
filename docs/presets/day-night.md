# DayNightCycle

<!-- @include: ./_before.md -->

## Overview

`DayNightCycle` lights a scene according to an in-game hour. It is not a darkness overlay:

- the whole scene is **color graded** by time of day: blue, washed-out moonlight at night, pink dawn, neutral day, golden hour, purple dusk;
- lights **reveal the real colors** under them with their own tint (a warm lamp paints the cobblestones orange), instead of just punching holes in a dark veil;
- each light has a **halo** glowing in the air;
- street lamps **fade in one by one** at dusk, flames can flicker, and windows follow their **own schedule** (on after sunset, off at bedtime);
- a vignette deepens the night.

It comes with a reactive game clock (`createGameClock` / `useGameClock`) to drive it and build a time UI.

Like `NightAmbient`, the filter attaches to the `Viewport` when present, otherwise to the parent container. Light positions are in world coordinates and follow the camera and zoom.

## Basic Usage

```html
<Canvas>
  <Viewport worldWidth={1920} worldHeight={1440} drag={true} wheel={true}>
    <Sprite image="town.png" />
    <DayNightCycle time={clock.time} lights={lights} />
  </Viewport>

  <Text text={clock.label} x={16} y={16} color="#ffffff" />
</Canvas>

<script>
  import { DayNightCycle, useGameClock } from '@canvasengine/presets'

  // 10 game minutes per real second, starting at 17:30
  const clock = useGameClock({ time: 17.5, speed: 10 })

  const lights = [
    // Street lamp: switches on automatically when it gets dark
    { x: 875, y: 61, radius: 230, color: '#ffc070', halo: 0.95, haloSize: 0.12, flicker: 0.1 },
    // Window: lit from 19:00 to 23:30
    { x: 169, y: 306, radius: 62, color: '#ffcf7a', halo: 0.45, haloSize: 0.32, schedule: [19, 23.5] },
    // Magic fountain with a cold light
    { x: 960, y: 700, radius: 150, color: '#7fd4ff', intensity: 0.55, threshold: 0.55 },
  ]
</script>
```

## Game Clock

```js
import { createGameClock, useGameClock } from '@canvasengine/presets'

// Inside a component: advanced automatically every frame
const clock = useGameClock({ time: 8, day: 1, speed: 1, paused: false })

// Anywhere else: call clock.advance(deltaMs) yourself
const manual = createGameClock({ time: 8 })
```

| Member | Type | Description |
|------|------|-------------|
| `time` | `Signal<number>` | Hour of the day, `0` to `24` (`18.5` = 18:30) |
| `day` | `Signal<number>` | Day counter, incremented at midnight |
| `speed` | `Signal<number>` | Game minutes per real second (`1` = a day lasts 24 real minutes, `60` = one hour per second) |
| `paused` | `Signal<boolean>` | Stops the clock |
| `label` | `Computed<string>` | `"HH:MM"` |
| `phase` | `Computed<'night' \| 'dawn' \| 'day' \| 'dusk'>` | Current phase |
| `progress` | `Computed<number>` | `0` at midnight to `1` at the next midnight, handy for a day bar |
| `advance(ms)` | function | Moves time forward |
| `setTime(hour)`, `setSpeed(value)` | function | Jump in time, change speed |
| `pause()`, `resume()`, `togglePause()` | function | Pause control |

`formatClock(hour)` and `phaseAt(hour)` are also exported.

## Lights

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `x`, `y` | `number \| Signal<number>` | - | World position of the light source |
| `radius` | `number` | `160` | Reach of the light pool on the ground |
| `color` | `string \| number` | `'#ffb45a'` | Light color |
| `intensity` | `number` | `1` | Brightness |
| `halo` | `number` | `0.6` | Strength of the glow in the air (`0` = none) |
| `haloSize` | `number` | `0.22` | Glow size relative to `radius` |
| `flicker` | `number` | `0` | Flame flicker, `0` to `1` |
| `threshold` | `number` | random | Darkness level (`0` to `1`) at which the light switches on. Random thresholds make lamps light up one by one |
| `schedule` | `[on, off]` | - | Explicit hours, can cross midnight (`[19, 1]`). Overrides `threshold` |
| `enabled` | `boolean \| Signal<boolean>` | `true` | Manual switch |

Up to 64 lights are rendered.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `time` | `number \| Signal<number>` | - | Hour of the day |
| `lights` | `DayNightLight[] \| Signal<DayNightLight[]>` | `[]` | Light sources |
| `cycle` | `DayLightingKey[]` | `DEFAULT_DAY_CYCLE` | Grading keyframes |
| `lightIntensity` | `number \| Signal<number>` | `1` | Multiplies every light |
| `vignette` | `number \| Signal<number>` | `1` | Multiplies the vignette |

## Sun Shadows

`sunShadowAt(hour)` returns an `ambientLight` for [SpriteShadows](./sprite-shadows.md): shadows stretch west in the morning, stay short at noon and stretch east in the evening. At night a faint moonlight keeps sprites grounded, and lit street lamps can cast their own shadows.

```html
<Viewport>
  <Sprite image="town.png" />
  <SpriteShadows ambientLight={sun} lights={lampShadows} maxShadows={2} />
  <Sprite image="hero.png" anchor={[0.5, 1]} shadowCaster={{ height: 90 }} />
  <DayNightCycle time={clock.time} lights={lights} />
</Viewport>

<script>
  const sun = computed(() => sunShadowAt(clock.time()))
  const darkness = computed(() => sampleDayLighting(clock.time()).lights)
  const lampShadows = computed(() => lamps.map((lamp, index) => ({
    x: lamp.x,
    y: lamp.y + 105, // lantern stands ~105px above its base
    z: 105,
    radius: 420,
    intensity: lightLevel(lamp, index, clock.time(), darkness(), 0),
  })))
</script>
```

| Option | Default | Description |
|------|---------|-------------|
| `sunrise`, `sunset` | `6`, `18.5` | Hours of sunrise and sunset |
| `maxElevation` | `62` | Sun elevation at noon, in degrees (lower = longer noon shadows) |
| `intensity` | `1` | Shadow strength in daylight |
| `moonlight` | `0.22` | Night shadow strength (`0` = none) |
| `noonShadow` | `'south'` | `'south'` keeps shadows in front of characters (readable top-down); `'north'` is the physical northern-hemisphere sun |

## Custom Cycle

The grading is defined by keyframes interpolated over 24 hours. Use `sampleDayLighting(hour)` to read the current values, for example to fade night-only elements:

```js
import { DEFAULT_DAY_CYCLE, sampleDayLighting } from '@canvasengine/presets'

const spookyCycle = DEFAULT_DAY_CYCLE.map((key) =>
  key.lights === 1 ? { ...key, ambient: [0.18, 0.28, 0.22], saturation: 0.2 } : key
)

// 0 during the day, 1 at night
const nightFactor = computed(() => sampleDayLighting(clock.time()).lights)
```

```html
<DayNightCycle time={clock.time} lights={lights} cycle={spookyCycle} />
<Weather effect="fireflies" alpha={nightFactor} />
```

| Key field | Description |
|------|-------------|
| `hour` | Hour of the keyframe |
| `ambient` | `[r, g, b]` light multiplier applied to the scene |
| `saturation` | `1` = unchanged, `0` = grayscale |
| `vignette` | Edge darkening, `0` to `1` |
| `lights` | Darkness level used by artificial lights, `0` to `1` |
