# SpriteShadows

<!-- @include: ./_before.md -->

## Overview

`SpriteShadows` adds RPG-style projected shadows for sprites.

- Shadow direction is automatically **opposite** to the light source.
- Each caster renders a soft silhouette with blur and alpha gradient.
- Supports one dominant source (`strongest`) or blended two-source direction (`blend2`).

To cast a shadow, a sprite must be tagged with `shadowCaster`.

## Basic Usage

```html
<Canvas>
  <Viewport worldWidth={2048} worldHeight={2048} sortableChildren={true}>
    <Sprite image="back.png" />

    <SpriteShadows
      lights={lights}
      mode="strongest"
      updateHz={60}
      shadowColor="#05070d"
    />

    <Sprite
      image="hero.png"
      x={heroX}
      y={heroY}
      anchor={{ x: 0.5, y: 0.86 }}
      shadowCaster={{
        height: 96,
        alpha: 0.6,
        blur: 4,
        gradientPower: 2.2,
        hardness: 0.45,
      }}
    />
  </Viewport>
</Canvas>

<script>
  import { computed, signal } from 'canvasengine'
  import { SpriteShadows } from '@canvasengine/presets'

  const heroX = signal(620)
  const heroY = signal(540)

  const lights = computed(() => [
    { x: heroX(), y: heroY() - 120, z: 230, radius: 360, intensity: 1.2 },
    { x: 760, y: 430, z: 170, radius: 300, intensity: 1.0 },
  ])
</script>
```

## With SpriteSheet Animations

`SpriteShadows` also works with animated `Sprite sheet={...}`.

```html
<Sprite
  x={heroX}
  y={heroY}
  sheet={{ definition: heroSheetDefinition, playing: 'walk' }}
  shadowCaster={{ height: 92, blur: 4, gradientPower: 2.1 }}
/>
```

## Preset Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lights` | `Array<LightInput> \| Signal<Array> \| () => Array` | `[]` | Main reactive light list |
| `sources` | Same as `lights` | `[]` | Alias of `lights` |
| `mode` | `'strongest' \| 'blend2'` | `'strongest'` | Light selection strategy per caster |
| `updateHz` | `number \| Signal<number> \| () => number` | `30` | Shadow recompute frequency |
| `shadowColor` | `string \| number` | `0x000000` | Base tint color of silhouettes |

### `LightInput`

| Field | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `x` | `number \| Signal<number> \| () => number` | Yes | - | Light X position |
| `y` | `number \| Signal<number> \| () => number` | Yes | - | Light Y position |
| `z` | `number \| Signal<number> \| () => number` | No | `220` | Light height (higher = shorter shadow) |
| `radius` | `number \| Signal<number> \| () => number` | No | `360` | Influence radius |
| `intensity` | `number \| Signal<number> \| () => number` | No | `1` | Influence multiplier (`0..2`) |
| `shadowWeight` | `number \| Signal<number> \| () => number` | No | `1` | Priority weight for shadow selection (useful for torches) |
| `enabled` | `boolean \| Signal<boolean> \| () => boolean` | No | `true` | Enable/disable source |

## `shadowCaster` Options

Attach on each sprite that must cast a shadow:

```html
<Sprite
  image="npc.png"
  shadowCaster={{
    height: 88,
    footOffset: { x: 0, y: 4 },
    alpha: 0.55,
    blur: 3.6,
    gradientPower: 2.1,
    hardness: 0.5,
    minLength: 10,
    maxLength: 260,
    contactAlpha: 0.28,
    contactScale: 0.3,
  }}
/>
```

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable this caster |
| `height` | `number` | `72` | Approximate sprite height used for projection |
| `footOffset` | `{ x, y }` | `{ x: 0, y: 0 }` | Offset of ground contact point |
| `footAnchor` | `{ x, y }` | `{ x: 0.5, y: 1 }` | Ground point inside sprite bounds |
| `alpha` | `number` | `0.56` | Global silhouette opacity |
| `blur` | `number` | `3.5` | Blur strength |
| `gradientPower` | `number` | `2` | Alpha falloff along shadow length |
| `hardness` | `number` | `0.42` | Shadow sharpness (`0..1`) |
| `minLength` | `number` | `10` | Minimum projected length |
| `maxLength` | `number` | `280` | Maximum projected length |
| `contactAlpha` | `number` | `0.28` | Opacity of contact shadow at feet |
| `contactScale` | `number` | `0.28` | Contact shadow ellipse size factor |
| `anchorX` | `number` | caster anchor or `0.5` | Horizontal anchor override for silhouette |

## RPG Tuning Tips

- For torches/candles: lower `z` and medium `blur`.
- For moon/sun style: higher `z`, larger `radius`, lower `intensity`.
- Keep `mode="strongest"` for readability and lower CPU.
- Use `blend2` only when multiple nearby lights must affect direction.
