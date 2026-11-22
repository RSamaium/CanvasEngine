# 3D: Getting Started

`@canvasengine/3d` adds 3D scenes to CanvasEngine. It is built on [PixiJS 3D](https://3d.pixijs.download) (`@pixi/3d`) and uses the same template syntax, signals and events as 2D components.

A `<View3D>` is an ordinary 2D component: it renders a 3D scene inside its rectangle. You can put 2D components (HUD, buttons, text) above or below it in the same `<Canvas>`.

## Install

```bash
npm install @canvasengine/3d @pixi/3d
```

`@pixi/3d` requires `pixi.js` 8.23 or later.

### WebGPU

The 3D renders with WebGL by default. To use WebGPU where the browser supports it, pass `preference: "webgpu"` to `bootstrapCanvas`, which forwards it to the PixiJS application:

```js
import { bootstrapCanvas } from "canvasengine";

bootstrapCanvas(document.getElementById("root"), App, { preference: "webgpu" });
```

Nothing else changes in your components.

## First Scene

```html
<Canvas backgroundColor="#87b7e6">
  <View3D
    positionType="absolute"
    toneMapping="aces"
    shadowQuality="medium"
    environment={{ skyColor: 0xbcd4f0, groundColor: 0x6b6250, intensity: 0.7 }}
  >
    <Camera3D position={[0, 5, 10]} lookAt={[0, 1, 0]} orbit={true} />

    <DirectionalLight intensity={3} rotation={[-0.8, 0.5, 0]} castShadow={true} />

    <!-- Floor -->
    <Mesh3D
      geometry={{ type: "plane", width: 20, height: 20 }}
      material={{ baseColor: 0x7f8f6a, roughness: 0.95 }}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={true}
    />

    <!-- A spinning cube -->
    <Mesh3D
      geometry={{ type: "cube", width: 2, height: 2, depth: 2 }}
      material={{ baseColor: 0xd9534f, roughness: 0.6 }}
      position={[0, 1, 0]}
      rotation={[0, angle, 0]}
      castShadow={true}
      click={() => console.log("cube clicked")}
    />
  </View3D>
</Canvas>

<script>
  import { signal, tick } from "canvasengine";
  import { View3D, Camera3D, Mesh3D, DirectionalLight } from "@canvasengine/3d";

  const angle = signal(0);

  tick(({ deltaTime }) => {
    angle.update((a) => a + deltaTime * 0.001);
  });
</script>
```

Import the 3D components from `@canvasengine/3d`: the tag names in the template are the imported names.

## Components

| Component | Role |
|-----------|------|
| [View3D](./view3d) | Renders the 3D scene; holds every other 3D component |
| [Camera3D](./camera3d) | Sets up the view's camera, with optional mouse orbit |
| [Mesh3D](./mesh3d) | A primitive shape (cube, sphere, plane...) or a custom geometry, with a material |
| [Model3D](./model3d) | A glTF / GLB model, with its animation clips |
| [Lights](./lights) | `DirectionalLight`, `PointLight`, `SpotLight`, `AmbientLight`, with shadows |
| [Group3D](./group3d) | Groups 3D nodes to move them together |
| [Sprite3D](./sprite3d) | A flat image facing the camera: 2D characters, trees, glows |
| [Particles3D](./particles3d) | Fire, smoke, sparks, snow |
| [Effects](./effects) | `Bloom`, `Ssao`, `Fxaa`, `TiltShift`, `MotionBlur`, `Tint`, `Outline`, `Wireframe` |
| [Surface3D](./surface3d) | 2D components shown on a plane in the scene |
| [Label3D](./label3d) | 2D components pinned over a 3D point |
| [Monitor3D](./monitor3d) | A screen showing the scene from a second camera; minimaps |
| [Instances](./instances) | Thousands of copies of one mesh in one draw call |

## Common Props

Every 3D node (`Mesh3D`, `Model3D`, `Sprite3D`, lights, `Group3D`, `Particles3D`, `Surface3D`, `Monitor3D`, `Instances`) accepts these props:

| Property | Type | Description |
|----------|------|-------------|
| `position` | `[x, y, z]` \| `{ x, y, z }` | Position in world units |
| `x`, `y`, `z` | `number` | One axis of the position |
| `rotation` | `[x, y, z]` \| `{ x, y, z }` | Euler rotation, in **radians** |
| `scale` | `number` \| `[x, y, z]` | Uniform or per-axis scale |
| `lookAt` | `[x, y, z]` | Turns the node toward a world point |
| `visible` | `boolean` | Shows or hides the node and its children |
| `label` | `string` | Name of the node |
| `eventMode` | `string` | Pointer events mode; set automatically (see below) |
| `cursor` | `string` | CSS cursor over the node, such as `"pointer"` |
| `hitVolume` | `"box"` \| `"geometry"` \| shape | What the pointer hits: the bounding box (default for meshes) or every triangle |
| `drag3d` | `boolean` \| object | Drag the node with the pointer (see [Dragging](#dragging)) |
| `outlined` | `boolean` | Ink outline around the node's meshes; needs an [`<Outline>`](./effects#outlines) in the view |
| `wireframe` | `boolean` | Draws the node's meshes as lines; needs a [`<Wireframe>`](./effects) in the view |
| `bone` | `string` | Inside a `Model3D`: follows that bone (see [Model3D](./model3d#attaching-to-a-bone)) |

Any of them can be a signal. A signal can also go inside the array: `rotation={[0, angle, 0]}` updates when `angle` changes.

```html
<Mesh3D position={playerPos} rotation={[0, heading, 0]} scale={1.5} />
```

## Coordinates and Directions

- **Y is up.** Units are arbitrary; treat 1 unit as 1 meter.
- **Rotations are in radians**: `Math.PI / 2` is a quarter turn.
- **Meshes and glTF models face +Z.** To make a model face its direction of travel, use `heading = Math.atan2(dx, dz)` as the Y rotation.
- **Cameras and lights look down their -Z axis.** Aim them with `rotation` or `lookAt`.
- **Planes are vertical**: a `plane` geometry lies in the XY plane. Rotate it by `-Math.PI / 2` around X to make a floor.

## Pointer Events

3D nodes take the same event props as 2D components: `click`, `pointertap`, `pointerdown`, `pointerup`, `pointerupoutside`, `pointermove`, `globalpointermove`, `pointerover`, `pointerout`, `pointerenter`, `pointerleave`, `pointercancel`, `rightclick`, `rightdown`, `rightup` and `wheel`.

The event has a `hit3D` field with the hit `point` (world position), `normal`, `distance` and `uv`.

Picking is turned on automatically when you pass an event handler: you do not need to set `eventMode`.

```html
<Mesh3D
  geometry={{ type: "sphere", radius: 1 }}
  material={{ baseColor: color }}
  pointerover={() => color.set(0xffd34d)}
  pointerout={() => color.set(0x4a90d9)}
  click={() => select(item)}
/>
```

## Dragging

`drag3d` lets the user drag a node with the pointer. The node slides on a plane through its position, the ground plane by default. While dragging, an orbit camera does not turn.

```html
<Mesh3D geometry={{ type: "cube" }} position={[0, 0.5, 0]} drag3d={true} />

<Mesh3D
  geometry={{ type: "cube" }}
  drag3d={{
    plane: "xz",   // "xz" (ground, default), "xy" or "yz"
    snap: 0.5,     // round the position to a grid
    start: () => console.log("start"),
    move: (position) => console.log(position.x, position.z),
    end: () => console.log("end"),
  }}
/>
```

The prop is named `drag3d` because `drag` is the 2D [drag directive](/directives/drag).

## Picking from Code

`View3D`'s instance (see [Access the Pixi instances](./view3d#access-the-pixi-instances)) gives the `@pixi/3d` view, with:

- `view.raycast({ x, y })`: the first node under a screen point, with the hit `point`, or `null`;
- `view.screenToWorld({ x, y }, plane)`: the point of a `Plane` under a screen point;
- `view.worldToScreen({ x, y, z })`: the screen position of a 3D point.

## 2D Over 3D

2D components placed after the `<View3D>` are drawn on top of it. This is how you build a HUD.

`<Canvas>` lays out its direct children with flexbox, so give the view `positionType="absolute"` and put the HUD in a `<Container>`, where `x` and `y` are plain positions:

```html
<Canvas>
  <View3D positionType="absolute" left={0} top={0}>
    ...
  </View3D>

  <Container>
    <Text text={score} x={16} y={14} color="#ffffff" size={18} />
  </Container>
</Canvas>
```

::: warning
Without `positionType="absolute"` and the `<Container>`, the view and the HUD follow each other in the flex layout, and `x` / `y` are added to the position the layout gives them: the HUD appears shifted.
:::

## Next Steps

- See the playground examples `3d-scene` (primitives, lights, clicks) and `3d-model` (animated glTF character) in the `sample` folder.
- For features not wrapped as components (post-processing, particles, instancing, custom shaders), use [`@pixi/3d`](https://3d.pixijs.download) directly through the instances: [View3D](./view3d#access-the-pixi-instances) gives access to them.
