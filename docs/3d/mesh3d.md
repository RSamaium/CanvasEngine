# Mesh3D

`Mesh3D` draws a shape: a **geometry** (the shape) with a **material** (how its surface looks). Both are plain objects, so you do not need to import any 3D class.

## Basic Usage

```html
<Mesh3D
  geometry={{ type: "sphere", radius: 1.2 }}
  material={{ baseColor: 0x4a90d9, roughness: 0.3, metallic: 0.2 }}
  position={[3, 1.2, 0]}
  castShadow={true}
/>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `geometry` | `{ type, ...options }` \| `Geometry3D` | The shape (see below) |
| `material` | `{ baseColor, ... }` \| material instance | The surface (see below) |
| `castShadow` | `boolean` | Casts shadows from lights with `castShadow`. Default `true` |
| `receiveShadow` | `boolean` | Shows shadows cast on it. Default `true` |

Plus the [common props](./getting-started#common-props): `position`, `rotation`, `scale`, `visible`, events...

## Geometries

| `type` | Options | Notes |
|--------|---------|-------|
| `"cube"` | `width`, `height`, `depth` | |
| `"sphere"` | `radius` | |
| `"plane"` | `width`, `height` | Vertical (XY). Rotate by `[-Math.PI / 2, 0, 0]` for a floor |
| `"cylinder"` | `radiusTop`, `radiusBottom`, `height` | No `radius` option: set both radii |
| `"cone"` | `radius`, `height` | |
| `"capsule"` | `radius`, `height` | `height` includes the rounded ends |
| `"torus"` | `radius`, `tube` | Lies flat (XZ) |
| `"torusKnot"` | `radius`, `tube` | |
| `"icosahedron"` | `radius`, `detail` | |

Each type also accepts segment counts for smoother curves. For other shapes, pass a [`Geometry3D`](https://3d.pixijs.download/release/docs/geometry.Geometry3D.html) instance built with `@pixi/3d`.

Changing `geometry` rebuilds the shape.

## Materials

The default material is physically based (`Material3D`): it reacts to lights.

| Option | Type | Description |
|--------|------|-------------|
| `type` | `"pbr"` \| `"flat"` | `"pbr"` (default) is lit; `"flat"` ignores lights and shows `baseColor` as is |
| `baseColor` | `number` \| `string` | Surface color |
| `roughness` | `number` | 0 = mirror-smooth, 1 = matte |
| `metallic` | `number` | 0 = plastic, wood, stone; 1 = metal |
| `alpha` | `number` | Opacity, used with `alphaMode: "blend"` |
| `alphaMode` | `"opaque"` \| `"blend"` \| `"mask"` | Default `"opaque"`, which ignores `alpha` |
| `emissive` | `{ color, strength }` | Glow. A `strength` above 1 feeds [bloom](./view3d#post-processing) |
| `texture` | `string` \| `Texture` | Image URL or texture for the base color |
| `doubleSided` | `boolean` | Draws both faces |

```html
<!-- Translucent glass -->
<Mesh3D
  geometry={{ type: "cube" }}
  material={{ baseColor: 0x88ccff, alpha: 0.4, alphaMode: "blend", roughness: 0.1 }}
/>

<!-- Glowing orb -->
<Mesh3D
  geometry={{ type: "sphere", radius: 0.4 }}
  material={{ baseColor: 0xffd34d, emissive: { color: 0xffaa00, strength: 1.5 } }}
/>

<!-- Textured crate -->
<Mesh3D geometry={{ type: "cube" }} material={{ texture: "./textures/crate.png" }} />
```

::: warning
With the default `alphaMode: "opaque"`, `alpha` and the transparent parts of a texture are ignored: transparent pixels draw black. Set `alphaMode: "blend"` (soft transparency) or `"mask"` (cut-out).
:::

### Reactive Materials

Any material option can be a signal:

```html
<Mesh3D
  geometry={{ type: "cube" }}
  material={{ baseColor: color, roughness: 0.6 }}
  click={() => color.set(0x5cb85c)}
/>

<script>
  import { signal } from "canvasengine";
  const color = signal(0xd9534f);
</script>
```

`baseColor`, `roughness`, `metallic`, `alpha` and `alphaMode` update in place. Changing `type`, `emissive` or `texture` builds a new material.

### Custom Materials

`material` also accepts any `@pixi/3d` material instance, for example a `ToonMaterial` from `@pixi/3d/extras` or a `Material3D` with custom shader bits:

```html
<Mesh3D geometry={{ type: "torusKnot" }} material={toon} />

<script>
  import { ToonMaterial } from "@pixi/3d/extras";
  const toon = new ToonMaterial({ baseColor: 0xff7043 });
</script>
```

You own a material you create this way: the component does not destroy it.

