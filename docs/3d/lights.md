# Lights

Lights are 3D nodes: place them inside a `View3D` like any other component.

| Component | Light |
|-----------|-------|
| `DirectionalLight` | Parallel rays from far away, like the sun. Its position does not matter, only its direction |
| `PointLight` | Shines in all directions from a point, like a bulb or a torch |
| `SpotLight` | A cone of light from a point, like a flashlight |
| `AmbientLight` | The same light everywhere, from no direction |

## Basic Usage

```html
<View3D environment={{ skyColor: 0xbcd4f0, groundColor: 0x6b6250, intensity: 0.7 }}>
  <DirectionalLight color={0xfff2dc} intensity={3} rotation={[-0.8, 0.5, 0]} castShadow={true} />
  <PointLight color={0xff8a3d} intensity={30} range={8} position={[0, 1.5, 4]} />
  ...
</View3D>

<script>
  import { View3D, DirectionalLight, PointLight } from "@canvasengine/3d";
</script>
```

## Properties

| Property | Lights | Type | Description |
|----------|--------|------|-------------|
| `color` | all | `number` \| `string` | Light color |
| `intensity` | all | `number` | Brightness (see the values below) |
| `castShadow` | directional, point, spot | `boolean` | Casts shadows |
| `range` | point, spot | `number` | Distance the light reaches |
| `radius` | point, spot | `number` | Size of the light source; larger makes softer highlights |
| `coneAngle` | spot | `number` | Angle of the cone, in radians |
| `penumbra` | spot | `number` | Softness of the cone edge, from 0 to 1 |

Plus the [common props](./getting-started#common-props). All can be signals.

## Aiming

Lights shine along their **-Z axis**. Turn them with `rotation`, or point them with `lookAt`:

```html
<!-- Sun from the upper front-left -->
<DirectionalLight intensity={3} rotation={[-0.8, 0.5, 0]} />

<!-- Spotlight on a point of the stage -->
<SpotLight position={[0, 6, 4]} lookAt={[0, 0, 0]} intensity={60} coneAngle={0.5} penumbra={0.4} />
```

A `DirectionalLight` has no target: only its rotation counts. The rotation `[-0.8, 0.5, 0]` tilts it down by about 45° and turns it slightly to the side.

## Intensity Values

Direct lights are divided by π internally, so these are good starting values:

| Light | Starting value |
|-------|---------------|
| `DirectionalLight` (sun) | `3` |
| `View3D` `environment` (hemisphere) | `0.7` |
| `PointLight` / `SpotLight` | `20` to `60`, depending on `range` |
| `AmbientLight` | `1` to `2` (`0.2` is barely visible) |

For soft fill light, prefer the view's [`environment`](./view3d#lighting-the-scene) over `AmbientLight`: the hemisphere lights surfaces facing up and down differently, which looks more natural.

## Shadows

Three things are needed for a shadow:

1. `castShadow={true}` on the light,
2. `castShadow` on the object that blocks the light (on by default for `Mesh3D`),
3. `receiveShadow` on the surface the shadow falls on (on by default for `Mesh3D`).

The shadow resolution is set on the view: `<View3D shadowQuality="high">`.

```html
<View3D shadowQuality="medium">
  <DirectionalLight intensity={3} rotation={[-0.8, 0.5, 0]} castShadow={true} />
  <!-- The floor does not need to cast a shadow -->
  <Mesh3D geometry={{ type: "plane", width: 20, height: 20 }} rotation={[-Math.PI / 2, 0, 0]} castShadow={false} />
  <Mesh3D geometry={{ type: "cube" }} position={[0, 1, 0]} />
</View3D>
```

## Moving Lights

A light's position and color can be signals, for example a torch circling the scene:

```html
<PointLight color={0xff8a3d} intensity={30} range={8} position={torchPos} />

<script>
  import { signal, tick } from "canvasengine";

  const torchPos = signal([0, 1.5, 4]);
  let time = 0;

  tick(({ deltaTime }) => {
    time += deltaTime / 1000;
    torchPos.set([Math.cos(time) * 5, 1.5, Math.sin(time) * 5]);
  });
</script>
```

A view shades up to 32 lights and 16 shadow-casting lights.
