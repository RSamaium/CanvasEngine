# Using the Afterimage Directive

The Afterimage directive leaves fading, tinted copies of a sprite behind it while it moves. It gives a "time dilation" look to a dash, a haste buff or a knockback.

## Basic Usage

```html
<script>
  import { signal } from 'canvasengine';

  const dashing = signal(false);
</script>

<Sprite image="hero.png" x y afterimage={{ enabled: dashing }} />
```

Set `dashing` to `true` on a key press (for example in a `keyDown` handler of `controls`) and back to `false` on release. While it is `true`, a copy of the sprite's **current frame** is left every `interval` ms, so animated sprites ghost with their animation frames.

## Options

| Option | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` (or signal) | `true` | Leaves ghosts while `true` |
| `interval` | `number` | `45` | Time between two ghosts, in ms |
| `duration` | `number` | `320` | Time for a ghost to fade out, in ms |
| `alpha` | `number` | `0.5` | Starting opacity of a ghost |
| `tint` | `number` | `0x7fd0ff` | Tint of the ghosts |
| `blendMode` | `string` | `'add'` | Blend mode of the ghosts |
| `minDistance` | `number` | `1` | Distance in px the sprite must have moved since the last ghost. `0` also ghosts a still sprite |

Ghosts are placed right under the sprite in its parent, and removed when the directive is destroyed. It works on objects that have a texture (`Sprite`, animated sprites), not on a `Container` of several parts.
