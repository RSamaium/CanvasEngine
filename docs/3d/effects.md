# Post-processing Effects

Effects change the whole picture of a `View3D`: glow, ambient occlusion, antialiasing, depth of field. Each one is a component placed inside the view.

## Basic Usage

```html
<View3D toneMapping="aces">
  <Mesh3D
    geometry={{ type: "sphere", radius: 0.4 }}
    material={{ baseColor: 0x66ccff, emissive: { color: 0x66ccff, strength: 3 } }}
  />

  <Ssao intensity={1} />
  <Bloom threshold={1} intensity={1.2} enabled={bloomOn} />
</View3D>

<script>
  import { signal } from "canvasengine";
  import { View3D, Mesh3D, Bloom, Ssao } from "@canvasengine/3d";

  const bloomOn = signal(true);
</script>
```

Every effect takes `enabled`: `false` turns it off without removing it. Options that the effect can change live (most of them) update in place; the others rebuild the effect.

## Effects

| Component | Effect | Options |
|-----------|--------|---------|
| `<Bloom>` | Bright parts glow outward | `threshold` (default 1), `intensity`, `radius`, `levels`, `resolution` |
| `<Ssao>` | Ambient occlusion: darkens creases and contact points | `radius`, `intensity`, `bias`, `power`, `maxDistance`, `samples`, `fadeDistance`, `blurStep`, `resolution` |
| `<Fxaa>` | Smooths jagged edges | `edgeThreshold`, `edgeThresholdMin`, `edgeSharpness` |
| `<TiltShift>` | Miniature look: sharp at one depth, blurred elsewhere | `focalDepth`, `focalNear`, `focalFar`, `maxBlur`, `debug` |
| `<MotionBlur>` | Blur along the camera's motion | `intensity`, `samples`, `maxLength` |
| `<Tint>` | Multiplies the frame by a colour | `tint` |
| `<Outline>` | Ink outline around meshes with `outlined={true}` | `width` (world units), `color` |
| `<Wireframe>` | Draws meshes with `wireframe={true}` as lines (debugging) | `color` |

## Bloom

Bloom only lights up what is brighter than its `threshold`, 1 by default in linear light. Make glowing objects `emissive` with a `strength` above 1, and use `toneMapping="aces"` on the view:

```html
<Mesh3D material={{ baseColor: 0xff66cc, emissive: { color: 0xff66cc, strength: 3 } }} geometry={{ type: "sphere" }} />
<Bloom threshold={1} intensity={1.2} />
```

::: warning
A `threshold` near 0.5 makes every lit surface glow.
:::

## Outlines

`<Outline>` draws the lines; each mesh opts in with `outlined`. For example, outline what the pointer is over:

```html
@for (crate of crates) {
  <Mesh3D
    geometry={{ type: "cube" }}
    position={crate.position}
    outlined={crate.hovered}
    pointerover={() => crate.hovered.set(true)}
    pointerout={() => crate.hovered.set(false)}
  />
}
<Outline width={0.04} color={0xffffff} />
```

`outlined` also works on `Model3D` (all its meshes) and `Group3D`.

## Order

Effects are added to the view in the order they are written; each one also runs at a fixed stage of the frame (before or after tone mapping). Put `<Ssao>` before the others and `<Fxaa>` last. With `antialias: true` on the canvas, you don't need `<Fxaa>`.

## Custom Effects

The `passes` prop of `View3D` takes any `@pixi/3d` pass, such as your own `PostEffect` subclass. It runs before the effect components:

```html
<View3D passes={[myVignette]}>...</View3D>
```
