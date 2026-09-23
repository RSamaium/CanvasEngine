# SpriteShadows

<!-- @include: ./_before.md -->

## Overview

`SpriteShadows` adds RPG-style ground shadows for sprites.

- The **real silhouette** of each sprite is projected on the ground, away from each light: a torch on the left draws the character's shape stretched to the right.
- The projection follows the light height (`z`): close low lights give long shadows, a high sun gives short ones.
- The shadow is crisp at the feet and gets softer and lighter toward its tip (penumbra), with a soft contact shadow under the feet.
- In `multi` mode (default) each nearby light casts its own shadow, and shadows fade in and out as characters walk between lights.
- All shadows are drawn in one ground layer and merged before its `opacity` is applied: like in classic 2D RPGs, overlapping shadows keep one soft, even tone instead of stacking into dark streaks.
- Shadow length is capped at 1.5× the caster `height` by default, so low lights never draw endless strokes.
- Silhouettes are prepared once per texture frame (animated sprites included), not every frame, and no filter runs per shadow.

Pair it with `sunShadowAt(hour)` from [DayNightCycle](./day-night.md) for shadows that follow the time of day.

To cast a shadow, a sprite must be tagged with `shadowCaster`.

## Basic Usage

```html
<Canvas>
  <Viewport worldWidth={2048} worldHeight={2048} sortableChildren={true}>
    <Sprite image="back.png" />

    <SpriteShadows
      lights={lights}
      ambientLight={{ x: -0.2, y: -1, z: 420, intensity: 0.18 }}
      minInfluence={0.16}
      falloffPower={1.2}
      mode="strongest"
      updateHz={60}
      scanHz={8}
      cullToViewport={true}
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
| `ambientLight` | `AmbientLightInput \| Signal<AmbientLightInput> \| () => AmbientLightInput` | `null` | Directional baseline light used when no point light reaches a caster |
| `minInfluence` | `number \| Signal<number> \| () => number` | `0` | Minimum ambient influence. Use with `ambientLight` to keep distant sprites grounded |
| `falloffPower` | `number \| Signal<number> \| () => number` | `2` | Point-light falloff curve. Lower values keep shadows visible farther from the source |
| `mode` | `'multi' \| 'strongest' \| 'blend2'` | `'multi'` | `multi`: one shadow per light; `strongest`: dominant light only; `blend2`: one shadow averaging the two strongest lights |
| `maxShadows` | `number` | `3` | Maximum shadows per caster in `multi` mode |
| `updateHz` | `number \| Signal<number> \| () => number` | `60` | Shadow recompute frequency |
| `scanHz` | `number \| Signal<number> \| () => number` | `8` | Scene scan frequency used to discover added, removed, or retagged shadow casters |
| `cullToViewport` | `boolean \| Signal<boolean> \| () => boolean` | `false` | Hide and skip shadow updates for casters outside the visible target bounds |
| `shadowColor` | `string \| number` | `0x0a0c16` | Shadow tint |
| `opacity` | `number \| Signal<number>` | `0.5` | Opacity of the merged shadow layer (`0.3` to `0.5` looks like most 2D RPGs) |
| `layerZIndex` | `number` | just below the lowest caster | zIndex of the shadow layer |

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

### `AmbientLightInput`

`ambientLight` is a directional source, useful for moonlight or a weak global fill. Its `x` and `y` fields describe where the light comes from. For example, `{ x: 0, y: -1 }` means the light comes from above the scene, so the shadow projects downward.

```html
<SpriteShadows
  lights={torches}
  ambientLight={{ x: -0.18, y: -1, z: 420, intensity: 0.18, shadowWeight: 0.75 }}
  minInfluence={0.16}
  falloffPower={1.2}
  mode="blend2"
/>
```

| Field | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `x` | `number \| Signal<number> \| () => number` | Yes | - | Horizontal incoming light direction |
| `y` | `number \| Signal<number> \| () => number` | Yes | - | Vertical incoming light direction |
| `z` | `number \| Signal<number> \| () => number` | No | `420` | Ambient source height (higher = shorter shadow) |
| `intensity` | `number \| Signal<number> \| () => number` | No | `0.28` | Baseline influence multiplier |
| `shadowWeight` | `number \| Signal<number> \| () => number` | No | `1` | Ambient priority when blended with point lights |
| `length` | `number \| Signal<number> \| () => number` | No | derived from caster height and `z` | Fixed ambient shadow length |
| `enabled` | `boolean \| Signal<boolean> \| () => boolean` | No | `true` | Enable/disable ambient shadowing |

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
| `alpha` | `number` | `1` | Shadow strength of this caster inside the layer |
| `blur` | `number` | `3.5` | Blur strength |
| `gradientPower` | `number` | `2` | Tail falloff. Higher values make the projected part shorter and fainter |
| `hardness` | `number` | `0.42` | Shadow sharpness (`0..1`) |
| `minLength` | `number` | `10` | Minimum projected length |
| `maxLength` | `number` | `1.5 × height` | Maximum projected length |
| `contactAlpha` | `number` | `0.7` | Strength of the contact shadow at the feet (inside the layer) |
| `contactScale` | `number` | `0.34` | Contact shadow ellipse size factor |
| `anchorX` | `number` | caster anchor or `0.5` | Horizontal anchor override for silhouette |
| `perspective` | `number` | `0.7` | Ground foreshortening (`1` = seen from straight above, `0.6` = RPG 3/4 view) |
| `silhouette` | `boolean` | `true` | Project the sprite shape. `false` uses a soft blob instead |

## RPG Tuning Tips

- For torches/candles: lower `z` and medium `blur`.
- For moon/sun style: higher `z`, larger `radius`, lower `intensity`.
- For night scenes: use `ambientLight` plus `minInfluence` so sprites keep a readable contact shadow outside spot radius.
- Lower `falloffPower` (`1.2..1.5`) when local lights should fade more gradually.
- `multi` looks the most natural around several lamps; use `strongest` for a single clean shadow per sprite.
- Sprites should be drawn **without** a baked ground shadow, and anchored at their feet (`anchor={[0.5, 1]}`).
- For a daylight scene, use `ambientLight={sunShadowAt(hour)}`: shadows sweep west to east and stay short at noon.
- Increase `updateHz` for very responsive character movement; keep `scanHz` lower because caster discovery is more expensive.
- Enable `cullToViewport` on large maps with many off-screen casters.
