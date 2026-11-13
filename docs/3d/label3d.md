# Label3D

`Label3D` pins 2D components over a point of the 3D scene: names above characters, damage numbers, quest markers. It is drawn as a 2D overlay, always on top of the 3D, at a constant size on screen.

## Basic Usage

```html
<View3D>
  <Model3D src="./models/robot.glb" position={robotPos} />

  <Label3D at={labelPos} offset={[0, -10]}>
    <Text text="Robot" anchor={{ x: 0.5, y: 1 }} size={16} color="#ffffff" />
  </Label3D>
</View3D>

<script>
  import { signal, computed } from "canvasengine";
  import { View3D, Model3D, Label3D } from "@canvasengine/3d";

  const robotPos = signal([0, 0, 0]);
  // 5 units above the robot's feet
  const labelPos = computed(() => {
    const [x, y, z] = robotPos();
    return [x, y + 5, z];
  });
</script>
```

The label's own (0, 0) sits on the screen point of `at`. Anchor the children to place them around it, for example `anchor={{ x: 0.5, y: 1 }}` to center a text above the point.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `at` | `[x, y, z]` | World point the label is pinned to |
| `offset` | `[x, y]` | Shift on screen in pixels, e.g. `[0, -10]` to go up |
| `hideBehind` | `boolean` | Hides the label while its point is behind the camera. Default `true` |

Other 2D props (`alpha`, `scale`, `visible`...) work as on a `Container`. The label follows the camera every frame.

::: tip
`Label3D` is never hidden by walls. For a sign that belongs to the scene and can be hidden by other objects, use [Surface3D](./surface3d) or [Sprite3D](./sprite3d).
:::
