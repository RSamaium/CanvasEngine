# Instances

`Instances` draws many copies of one mesh in a single draw call: forests, grass, rocks, crowds of props, bullets. Thousands of copies stay fast, where thousands of `Mesh3D` components would not.

## Basic Usage

```html
<View3D>
  <Instances
    geometry={{ type: "cone", radius: 0.9, height: 3, radialSegments: 7 }}
    material={{ baseColor: 0xffffff, roughness: 0.9 }}
    items={trees}
  />
</View3D>

<script>
  import { View3D, Instances } from "@canvasengine/3d";

  const trees = Array.from({ length: 2000 }, () => {
    const size = 0.7 + Math.random() * 0.8;
    return {
      position: [(Math.random() - 0.5) * 200, 1.5 * size, (Math.random() - 0.5) * 200],
      scale: size,
      color: Math.random() > 0.5 ? 0x2f6b3a : 0x3d7d45,
    };
  });
</script>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `geometry` | `{ type, ... }` \| `Geometry3D` | Shape shared by every copy, as in [Mesh3D](./mesh3d#geometries) |
| `material` | object | Material shared by every copy, as in [Mesh3D](./mesh3d#materials) (plain object only) |
| `items` | `InstanceItem[]` | One entry per copy (see below) |
| `capacity` | `number` | Slots to reserve. Grows to fit `items`; reserve more to add copies without a rebuild |
| `castShadow` | `boolean` | Copies cast shadows. Default `true` |
| `billboardMode` | `"none"` \| `"spherical"` \| `"cylindrical"` | Copies turn to face the camera, e.g. grass cards |
| `cull` | `"off"` \| `"cpu"` \| `"gpu"` | `"gpu"` culls each copy on the GPU, for very large counts |

Plus the [common props](./getting-started#common-props), which move the whole set.

Each item:

| Field | Type | Description |
|-------|------|-------------|
| `position` | `[x, y, z]` | Position, relative to the component |
| `rotation` | `[x, y, z]` | Euler rotation in radians |
| `scale` | `number` \| `[x, y, z]` | Scale |
| `color` | `number` | Multiplies the material colour for this copy. Use a white `baseColor` to get the item colour as is |
| `visible` | `boolean` | Hides this copy |

## Updating

`items` can be a signal. Each change rewrites every slot, so set the whole array at once rather than many times per frame:

```html
<Instances geometry={{ type: "sphere", radius: 0.2 }} material={{ baseColor: 0xffd34d }} items={coins} capacity={100} />

<script>
  import { signal } from "canvasengine";

  const coins = signal([{ position: [0, 1, 0] }]);
  function addCoin(position) {
    coins.update((list) => [...list, { position }]);
  }
</script>
```

Adding items beyond `capacity` rebuilds the batch; reserve room with `capacity` when the count grows during the game.

::: tip
Copies are not scene nodes: they don't take events, `outlined` or `wireframe`. For objects the user clicks, use `Mesh3D`.
:::
