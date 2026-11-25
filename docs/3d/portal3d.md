# Portal3D

`Portal3D` is a doorway that shows another place of the same scene, as if the two were joined: a magic gate, a window onto a distant room, a mirror world.

The component is the **entry**, the doorway you look into. `exit` places a matching doorway in the other place.

## Basic Usage

```html
<View3D>
  <!-- Here -->
  <Portal3D position={[-4, 1.6, -3]} rotation={[0, 0.4, 0]} size={[2, 3.2]} exit={{ position: [60, 1.6, 4], rotation: [0, Math.PI + 0.4, 0] }} />

  <!-- The other place, 60 units away -->
  <Group3D position={[60, 0, 0]}>
    <Mesh3D geometry={{ type: "plane", width: 16, height: 16 }} material={{ baseColor: 0xb85c38 }} rotation={[-Math.PI / 2, 0, 0]} />
    ...
  </Group3D>
</View3D>

<script>
  import { View3D, Portal3D, Group3D, Mesh3D } from "@canvasengine/3d";
</script>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `size` | `[width, height]` | Size of the doorway in world units. Default `[2, 3]` |
| `exit` | `{ position, rotation }` | Where the exit doorway stands |
| `exitColor` | `number` | Colour of the exit doorway, seen from the far side. Default `0x05070c` |
| `active` | `boolean` | `false` pauses the portal; it keeps its last picture |

Plus the [common props](./getting-started#common-props) for the entry.

## Facing

Each doorway faces along its own **+Z**: the entry toward the viewer, the exit **into** the place it shows. An exit that faces away from the room shows the empty space behind it.

In the example above, the entry is turned by `0.4` and the exit by `Math.PI + 0.4`: half a turn more, so it faces back into the room.

## Rules

- **The far side has no sky.** Enclose the far place (walls, a room), or it shows black where nothing is.
- **Use a perspective camera** on the view, and leave the view's `exposure` at 1.
- **Scale with `size`, not `scale`**: entry and exit share one shape, and scaling only one would make the far side bigger or smaller.
- The portal draws the scene a second time each frame while the entry is on screen. Set `active={false}` when the player can't see it.

The frame around the doorway is up to you: put a `Mesh3D` just behind the entry, as in the playground example `3d-advanced`.
