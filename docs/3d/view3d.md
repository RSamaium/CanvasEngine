# View3D

`View3D` renders a 3D scene. It is a 2D component: it takes the usual 2D props (`x`, `y`, `alpha`, `filters`, layout props...) and draws the scene inside its rectangle.

Every other 3D component (`Camera3D`, `Mesh3D`, `Model3D`, lights, `Group3D`) must be inside a `View3D`.

## Basic Usage

```html
<Canvas>
  <View3D positionType="absolute" toneMapping="aces">
    <Camera3D position={[0, 4, 8]} lookAt={[0, 0, 0]} />
    <DirectionalLight intensity={3} rotation={[-0.8, 0.5, 0]} />
    <Mesh3D geometry={{ type: "cube" }} material={{ baseColor: 0xd9534f }} />
  </View3D>
</Canvas>

<script>
  import { View3D, Camera3D, Mesh3D, DirectionalLight } from "@canvasengine/3d";
</script>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | Width in pixels. Leave `width` and `height` out to fill the screen and follow resizes |
| `height` | `number` | Height in pixels |
| `environment` | `{ skyColor, groundColor, intensity }` \| `CubeTexture` | Soft fill light from all directions. A hemisphere object, or a cubemap / HDR texture for image-based lighting |
| `background` | `number` \| `{ skyColor, groundColor }` \| `CubeTexture` | What is drawn behind the scene. Transparent by default, so the canvas background shows through |
| `toneMapping` | `'none'` \| `'aces'` \| `'reinhard'` \| `'uncharted2'` | Maps bright light to screen colors. Default `'none'` |
| `exposure` | `number` | Brightness multiplier applied before tone mapping |
| `fog` | `{ type, color, near, far, density }` | Distance fog. `type` is `'linear'`, `'exponential'` or `'exp2'` |
| `shadowQuality` | `'low'` \| `'medium'` \| `'high'` \| `'ultra'` | Shadow map size. Changing it rebuilds the view |
| `cull` | `'off'` \| `'cpu'` \| `'gpu'` | Skips objects outside the camera view |
| `passes` | `Pass3D[]` | Post-processing effects (see below) |

All of them can be signals.

## Lighting the Scene

A good default is one `DirectionalLight` for the sun, a hemisphere `environment` for soft fill light, and `toneMapping="aces"`:

```html
<View3D
  toneMapping="aces"
  environment={{ skyColor: 0xbcd4f0, groundColor: 0x6b6250, intensity: 0.7 }}
>
  <DirectionalLight color={0xfff2dc} intensity={3} rotation={[-0.8, 0.5, 0]} castShadow={true} />
  ...
</View3D>
```

::: tip
With `toneMapping="none"` (the default), strong lights clip to flat white. Use `"aces"` as soon as you have bright lights, emissive materials or bloom.
:::

## Sky and Fog

```html
<View3D
  background={0x9fb8d6}
  fog={{ type: "linear", color: 0x9fb8d6, near: 25, far: 60 }}
>
  ...
</View3D>
```

Give the fog the same color as the background so distant objects fade into the sky.

## Post-processing

Effects come from `@pixi/3d/extras` and go in the `passes` prop:

```html
<View3D toneMapping="aces" passes={[bloom]}>
  <Mesh3D
    geometry={{ type: "sphere", radius: 0.5 }}
    material={{ baseColor: 0xffd34d, emissive: { color: 0xffaa00, strength: 2 } }}
  />
</View3D>

<script>
  import { BloomEffect } from "@pixi/3d/extras";

  const bloom = new BloomEffect({ threshold: 1, intensity: 1.2 });
</script>
```

Bloom only affects light brighter than its `threshold` (1 by default): make glowing objects `emissive` with a `strength` above 1.

## Size and Layout

Without `width` and `height`, the view fills the screen and follows window resizes.

Inside `<Canvas>`, set `positionType="absolute"` so the view does not push the other children around in the flex layout. See [2D over 3D](./getting-started#_2d-over-3d).

```html
<!-- A 400 x 300 view at (20, 20) -->
<View3D positionType="absolute" left={20} top={20} width={400} height={300}>
  ...
</View3D>
```

## Access the Pixi Instances

The component instance has a `view` property: the [`@pixi/3d` View3D](https://3d.pixijs.download/release/docs/scene.View3D.html). Through it you reach the camera (`view.camera`), the scene root (`view.root`) and all of `@pixi/3d`.

Get it with `mount` in a component whose root is the `View3D`:

```html
<View3D>
  <Camera3D position={[0, 4, 8]} lookAt={[0, 0, 0]} />
  ...
</View3D>

<script>
  import { mount } from "canvasengine";
  import { View3D, Camera3D } from "@canvasengine/3d";

  mount((element) => {
    const view = element.componentInstance.view;
    // Convert a 3D point to screen pixels, e.g. to place a 2D label
    const screen = view.worldToScreen({ x: 0, y: 2, z: 0 });
  });
</script>
```
