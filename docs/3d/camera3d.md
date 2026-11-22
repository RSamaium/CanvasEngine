# Camera3D

`Camera3D` sets up the camera of the parent `View3D`. Each view owns exactly one camera: `Camera3D` does not create a new one, it configures it.

## Basic Usage

```html
<View3D>
  <Camera3D position={[0, 5, 12]} lookAt={[0, 1, 0]} fov={50} />
  ...
</View3D>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `position` | `[x, y, z]` | Where the camera stands |
| `lookAt` | `[x, y, z]` | The point it looks at. Applied again whenever `position` changes |
| `fov` | `number` | Vertical field of view in **degrees**. Default `60` |
| `near` | `number` | Closest visible distance. Default `0.1` |
| `far` | `number` | Farthest visible distance. Default `1000` |
| `mode` | `'perspective'` \| `'orthographic'` | Projection. Default `'perspective'` |
| `orthographicSize` | `number` | In orthographic mode: half the view's width in world units. Default `5` |
| `orbit` | `boolean` \| `object` | Mouse and touch orbit controls (see below) |
| `fps` | `boolean` \| `object` | First-person controls (see below). Takes over from `orbit` |
| `frame` | `boolean` \| `string` \| `object` | Places the camera so a node fits in view (see below) |

## Orbit Controls

`orbit={true}` lets the user turn around the scene by dragging, zoom with the wheel and pan with the right button. Pass an object to set the [OrbitCamera options](https://3d.pixijs.download/release/docs/extras_camera.OrbitCamera.html):

```html
<Camera3D
  position={[0, 6, 12]}
  lookAt={[0, 1, 0]}
  orbit={{
    enableDamping: true,
    minDistance: 4,
    maxDistance: 30,
    maxPolarAngle: 1.45,
  }}
/>
```

| Option | Description |
|--------|-------------|
| `target` | Point to orbit around. Defaults to `lookAt` |
| `enableDamping` | Smooth, inertial movement |
| `minDistance` / `maxDistance` | Zoom limits |
| `maxPolarAngle` | Limits how far the camera can go down, in radians. Below `Math.PI / 2` keeps it above the ground |
| `enableZoom` / `enableRotate` / `enablePan` | Turn each gesture on or off |
| `autoRotate` / `autoRotateSpeed` | Turns around the target on its own |

`orbit={false}` removes the controls.

::: warning
While orbit controls are on, they own the camera: a change to `position` is overwritten by the controls. To move the camera from code (a cutscene, a follow camera), set `orbit={false}` first.
:::

## First-person Controls

`fps={true}` gives first-person controls: click the view to capture the mouse (pointer lock) and look around, move with WASD or the arrow keys, go up and down with Space and Shift (unless `height` is set), `Escape` to release the mouse.

```html
<Camera3D position={[0, 1.7, 8]} fps={{ height: 1.7, moveSpeed: 4, lookSpeed: 0.002 }} />
```

| Option | Description |
|--------|-------------|
| `height` | Keeps the camera at this height. Without it, walking follows the view direction, so looking down moves down |
| `moveSpeed` | Units per second |
| `lookSpeed` | Mouse sensitivity |
| `maxPitch` | Limits looking up and down, in radians |
| `yaw` / `pitch` | Start direction, in radians |
| `keyboard` | `false` turns keyboard movement off, to move the camera yourself |
| `pointerLock` | `false` turns the mouse capture off: look by dragging |

Switch between orbit and first person with two signals:

```html
<Camera3D position={[0, 5, 11]} lookAt={[0, 1, 0]} orbit={orbitOptions} fps={fpsOptions} />

<script>
  import { signal, computed } from "canvasengine";

  const firstPerson = signal(false);
  const orbitOptions = computed(() => (firstPerson() ? false : { enableDamping: true }));
  const fpsOptions = computed(() => (firstPerson() ? { height: 1.7 } : false));
</script>
```

## Framing a Model

`frame` places the camera so a whole node fits in view, whatever its size. It frames again each time a `Model3D` finishes loading, so it works with models that load later:

```html
<Camera3D fov={45} frame="robot" orbit={true} />
<Model3D src="./models/robot.glb" label="robot" />
```

A string frames the node with that `label`; `true` frames the whole scene (including the ground, so prefer a label). Options:

```html
<Camera3D frame={{ target: "robot", pitch: 20, yaw: -30, padding: 1.4 }} orbit={true} />
```

| Option | Description |
|--------|-------------|
| `target` | `label` of the node to frame. Default: the whole scene |
| `pitch` | Angle above the horizon, in degrees. Default `30` |
| `yaw` | Angle around the vertical axis, in degrees; `0` looks from +Z. Default `0` |
| `padding` | Room around the target: `1` fits it exactly. Default `1.1` |

`near` and `far` follow the distance, and an orbit camera turns around the framed centre, with zoom limits from the model's size (your own `minDistance` / `maxDistance` win).

## Follow Camera

Without orbit controls, drive `position` and `lookAt` with signals:

```html
<Camera3D position={cameraPos} lookAt={playerPos} />

<script>
  import { signal, computed } from "canvasengine";

  const playerPos = signal([0, 0, 0]);
  // Stay 6 units behind and 4 above the player
  const cameraPos = computed(() => {
    const [x, y, z] = playerPos();
    return [x, y + 4, z + 6];
  });
</script>
```

## Top-down / Isometric View

```html
<Camera3D
  mode="orthographic"
  orthographicSize={12}
  position={[10, 10, 10]}
  lookAt={[0, 0, 0]}
/>
```
