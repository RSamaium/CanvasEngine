# Monitor3D

`Monitor3D` is a screen in the scene showing the scene from a second camera: a security monitor, a rear-view mirror, a minimap. The second camera is part of the component.

## Basic Usage

```html
<View3D>
  <Monitor3D
    position={[-5, 3, -3]}
    rotation={[0, 0.6, 0]}
    width={4}
    resolution={[512, 288]}
    camera={{ position: [6, 9, 10], lookAt: [0, 1.5, 0], fov: 40 }}
  />
</View3D>

<script>
  import { View3D, Monitor3D } from "@canvasengine/3d";
</script>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `camera` | object | The second camera: `position`, `lookAt`, `rotation`, `fov`, `near`, `far`, `mode`, `orthographicSize` |
| `resolution` | `[width, height]` | Size of the picture in pixels. Default `[512, 288]`. Its shape sets how wide the camera sees |
| `width` | `number` | Width of the screen in world units; its height follows the picture's shape. Default `4` |
| `background` | `boolean` | Draws the view's background where no mesh is. Default `true` |
| `active` | `boolean` | `false` pauses the camera; the screen keeps its last picture |
| `showScreen` | `boolean` | `false` hides the screen mesh, to use only the picture (see minimap) |
| `onTexture` | `(texture) => void` | Receives the picture's texture |

Plus the [common props](./getting-started#common-props). The screen faces +Z.

The camera options are reactive: drive `camera.position` with a signal for a camera that follows something.

## Minimap

Hide the screen and show the picture in a 2D `Sprite` over the view. A top-down orthographic camera makes a map:

```html
<View3D>
  <Monitor3D
    showScreen={false}
    resolution={[256, 256]}
    camera={{ mode: "orthographic", orthographicSize: 15, position: [0, 40, 0], rotation: [-Math.PI / 2, 0, 0] }}
    onTexture={(texture) => minimap.set(texture)}
  />
</View3D>
<Container>
  <Sprite texture={minimap} x={600} y={10} />
</Container>

<script>
  import { signal } from "canvasengine";
  const minimap = signal(null);
</script>
```

A 2D sprite shows the picture the right way up.

## Performance

Each `Monitor3D` draws the scene's meshes a second time every frame, even when its screen is off screen. Set `active={false}` while it isn't needed, for example while a minimap is closed. Change `active` now and then, not every frame: each change rebuilds how the view draws a frame.

::: warning
The picture shows the view's tone mapping but not its post-processing effects such as bloom.
:::
