# Particles3D

`Particles3D` emits particles from its position: fire, smoke, sparks, snow, magic. All the movement runs on the GPU.

## Basic Usage

```html
<View3D toneMapping="aces">
  <!-- Campfire flames -->
  <Particles3D
    position={[0, 0.15, 0]}
    capacity={140}
    emitRate={120}
    life={[0.5, 1]}
    speed={[1.4, 2.2]}
    size={[0.5, 0.8]}
    sizeEnd={[0.05, 0.2]}
    alpha={0.75}
    alphaEnd={0}
    color={0xffd98a}
    colorEnd={0xd12b06}
    drag={1.6}
    shape={{ type: "cone", angle: 12, radius: 0.25 }}
    blendMode="add"
    billboard="cylindrical"
  />
</View3D>

<script>
  import { View3D, Particles3D } from "@canvasengine/3d";
</script>
```

## Properties

Values marked *spread* take a number or a `[min, max]` range: each particle picks a value in the range.

| Property | Type | Description |
|----------|------|-------------|
| `texture` | `string` \| `Texture` | Image of one particle. Default: a soft white dot |
| `capacity` | `number` | Most particles alive at once: about `emitRate` × the longest `life` |
| `emitRate` | `number` | Particles per second |
| `bursts` | `{ time, count, repeatEvery? }[]` | Bursts of particles, times in seconds |
| `shape` | object | Where particles start and which way they head (see below). Default: a point, heading up |
| `life` | *spread* | Lifetime in seconds |
| `speed` | *spread* | Start speed |
| `size` / `sizeEnd` | *spread* | Size at birth and at death |
| `alpha` / `alphaEnd` | *spread* | Opacity at birth and at death; `alphaEnd={0}` fades out |
| `color` / `colorEnd` | `number` | Colour at birth and at death |
| `startRotation` / `spin` | *spread* | Start angle and spin speed, in radians |
| `gravity` | `number` \| `[x, y, z]` | Acceleration: a number pulls down along Y |
| `drag` | `number` | Slows particles down over time |
| `blendMode` | `"add"` \| `"normal"` \| `"multiply"` \| `"screen"` | `"add"` for fire and sparks, `"normal"` for smoke |
| `billboard` | `"spherical"` \| `"cylindrical"` \| `"horizontal"` | `"cylindrical"` keeps flames upright, `"horizontal"` lies flat (ripples) |
| `space` | `"world"` \| `"local"` | `"world"` (default): particles stay where they were born when the emitter moves |
| `playing` | `boolean` | Emits while `true` (default). Set `false` to stop, and the living particles finish |
| `onReady` | `(system) => void` | Receives the `ParticleSystem3D` once built |

Plus the [common props](./getting-started#common-props).

`emitRate`, `gravity` and `drag` update live. Changing another option rebuilds the system, which restarts it.

## Shapes

| `shape` | Particles start | And head |
|---------|-----------------|----------|
| `{ type: "point" }` | At the emitter | Up |
| `{ type: "cone", angle, radius }` | On a disc of `radius` | Up, within `angle` degrees |
| `{ type: "box", width, height, depth }` | Anywhere in the box | Up |
| `{ type: "sphere", radius, shell }` | Inside the sphere (on its surface with `shell: true`) | Outward |

## Bursts on Demand

`onReady` gives the particle system, whose `spawn(count, overrides)` emits particles right now, for example at the point the user clicked:

```html
<Particles3D emitRate={0} capacity={200} speed={[2, 4]} life={0.8} shape={{ type: "sphere", radius: 0.1 }} onReady={(s) => (sparks = s)} />
<Mesh3D geometry={{ type: "cube" }} click={(e) => sparks?.spawn(30, { position: e.hit3D.point })} />

<script>
  let sparks = null;
</script>
```

## Examples

```html
<!-- Snow over a 40 x 40 area -->
<Particles3D
  position={[0, 15, 0]}
  capacity={3000}
  emitRate={300}
  life={10}
  speed={0}
  gravity={0.4}
  size={[0.05, 0.1]}
  shape={{ type: "box", width: 40, height: 1, depth: 40 }}
/>

<!-- Smoke -->
<Particles3D
  emitRate={8}
  life={[3, 4]}
  speed={[0.3, 0.6]}
  size={[0.6, 1]}
  sizeEnd={[2, 3]}
  alpha={0.4}
  alphaEnd={0}
  color={0x888888}
  blendMode="normal"
/>
```
