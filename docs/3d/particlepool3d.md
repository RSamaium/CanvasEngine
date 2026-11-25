# ParticlePool3D

`ParticlePool3D` draws a fixed pool of camera-facing quads in one call, and **your code places them**: stars, flocks, magic motes, rain splashes, bullets. For particles with built-in motion (fire, smoke), use [Particles3D](./particles3d) instead.

## Basic Usage

Give the particles as an array:

```html
<View3D>
  <ParticlePool3D capacity={100} particles={coins} blendMode="add" />
</View3D>

<script>
  import { signal } from "canvasengine";
  import { View3D, ParticlePool3D } from "@canvasengine/3d";

  const coins = signal([
    { position: [0, 1, 0], size: 0.3, color: 0xffd34d },
    { position: [2, 1, 0], size: 0.3, color: 0xffd34d },
  ]);
</script>
```

Or write them every frame in `onUpdate`, which is much faster for thousands of moving particles:

```html
<ParticlePool3D position={[0, 2, 0]} capacity={2000} blendMode="add" onUpdate={swirl} />

<script>
  const COUNT = 2000;
  let time = 0;

  function swirl(pool, ticker) {
    time += ticker.deltaMS / 1000;
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + time;
      // index, x, y, z, size, rotation, color, alpha
      pool.setParticleAt(i, Math.cos(angle) * 2, Math.sin(i) * 0.5, Math.sin(angle) * 2, 0.06, 0, 0x66ccff, 0.8);
    }
  }
</script>
```

The upload to the GPU follows `onUpdate` automatically.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `capacity` | `number` | Most particles drawn at once. Default `1000`. Changing it rebuilds the pool |
| `particles` | `PoolParticle[]` | The particles (see below). Each change rewrites them all |
| `onUpdate` | `(pool, ticker) => void` | Called every frame to write particles yourself |
| `texture` | `string` \| `Texture` \| `Texture[]` | Image of a particle, or several to pick from with `frame`. Default: a soft white dot |
| `blendMode` | `"normal"` \| `"add"` \| `"multiply"` \| `"screen"` | `"add"` for glowing particles |
| `billboard` | `"spherical"` \| `"cylindrical"` \| `"horizontal"` | How the quads face the camera |
| `space` | `"local"` \| `"world"` | `"local"` (default): positions are relative to the component |
| `alphaMode` | `"blend"` \| `"mask"` \| `"opaque"` | Transparency mode |

Plus the [common props](./getting-started#common-props).

Each particle of `particles`:

| Field | Type | Description |
|-------|------|-------------|
| `position` | `[x, y, z]` | Position |
| `size` | `number` | Size in world units. Default `0.1` |
| `rotation` | `number` | Angle in the quad's plane, in radians |
| `color` | `number` | Tint |
| `alpha` | `number` | Opacity |
| `frame` | `number` | Index in the `texture` list |

Slots past the last particle are hidden. In `onUpdate`, hide a slot yourself with a size of `0`.
