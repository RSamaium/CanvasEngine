# GroundEffects

<!-- @include: ./_before.md -->

## Overview

`GroundEffects` makes sprites sit **in** their terrain instead of on top of it:

- **Water**: the lower body sinks under a wavy waterline, wobbles and takes the water color. Ripple rings spread around the body (in front of and behind it) and splashes appear when walking. Deeper water hides more of the body, and shadows fade out.
- **Tall grass**: legs disappear behind uneven blades and a grass tuft sways in front, rustling when the character moves. The tuft takes the color of the map under the sprite.
- **Sand, dirt, snow**: dust or powder puffs at each step, feet slightly sink in snow and mud.

Transitions are smooth: walking from the shore into the sea progressively submerges the character.

## Basic Usage

```html
<Viewport worldWidth={1920} worldHeight={1280} sortableChildren={true}>
  <Sprite image="beach.png" />
  <SpriteShadows ambientLight={sun} />
  <GroundEffects />

  <Sprite
    image="hero.png"
    x={x}
    y={y}
    anchor={[0.5, 1]}
    zIndex={y}
    shadowCaster={{ height: 90 }}
    groundCaster={ground}
  />
</Viewport>

<script>
  import { computed, signal } from 'canvasengine'
  import { GroundEffects, SpriteShadows, createSurfaceSampler, sunShadowAt } from '@canvasengine/presets'

  const x = signal(800)
  const y = signal(600)

  // Read the terrain straight from the map image
  const terrain = signal(null)
  createSurfaceSampler('./beach.png').then((sampler) => terrain.set(sampler))
  const under = computed(() => terrain()?.sample(x(), y()) ?? { surface: 'ground', depth: 0 })

  const ground = {
    surface: () => (under().surface === 'grass' ? 'tallGrass' : under().surface),
    depth: () => under().depth,
    groundColor: () => under().color,
  }
</script>
```

Sprites must be anchored at their feet (`anchor={[0.5, 1]}`).

## Surface Sampler

`createSurfaceSampler(image, options)` reads a map image once and answers what is under a point:

```js
const terrain = await createSurfaceSampler('./beach.png')
terrain.sample(x, y) // { surface: 'water', depth: 0.42, color: 0x06b9c6 }
```

The default classifier recognizes blue/teal water (lighter = shallower), dominant green grass and bright beige sand. Pass `classify(r, g, b)` for your own palette, `scale` if the map sprite is scaled, and `radius` to average noisy pixel art. With tile maps, you can skip the sampler and return the surface from your tile properties instead.

## `groundCaster` Options

| Field | Type | Description |
|------|------|-------------|
| `surface` | `string \| () => string` | Surface under the sprite (`water`, `shallow`, `tallGrass`, `grass`, `sand`, `dirt`, `snow`, `mud`, `ground` or custom) |
| `depth` | `number \| () => number` | Water depth `0..1` (shore to open water) |
| `groundColor` | `color \| () => color` | Map color under the sprite: tints grass tufts and dust |
| `footAnchor` | `{ x, y }` | Feet position inside the sprite bounds. Default `{ x: 0.5, y: 1 }` |
| `enabled` | `boolean \| () => boolean` | Turn the effect off |

## Surface Profiles

Built-in profiles are exported as `GROUND_SURFACES`. Override or add surfaces with the `surfaces` prop:

```html
<GroundEffects surfaces={{ lava: { mode: 'sink', submerge: 0.1, puffs: true, puffColor: '#ff7a2a', shadow: 0.3 } }} />
```

| Field | Description |
|------|-------------|
| `mode` | `'water'`, `'grass'`, `'sink'` or `'none'` |
| `submerge` | Fraction of the sprite height hidden |
| `deepSubmerge` | Water only: fraction hidden at depth `1` |
| `tint`, `tintStrength` | Water color mixed into the submerged part |
| `ripples` | Ripple rings around the body |
| `puffs`, `puffColor` | Splashes / dust at each step |
| `tuft`, `tuftColor` | Grass blades in front of the legs |
| `shadow` | Multiplies `SpriteShadows` on this surface |

## Props

| Prop | Default | Description |
|------|---------|-------------|
| `surfaces` | `{}` | Custom or overridden surface profiles |
| `scanHz` | `4` | How often the scene is scanned for new `groundCaster` sprites |
