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
| `billboardMode` | `"none"` \| `"spherical"` \| `"cylindrical"` | Turns the mesh to face the camera |

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
| `type` | `"pbr"` \| `"flat"` \| `"phong"` \| `"toon"` | `"pbr"` (default): physically based. `"flat"`: ignores lights. `"phong"`: classic shiny highlights. `"toon"`: cel shading |
| `baseColor` | `number` \| `string` | Surface color |
| `roughness` | `number` | 0 = mirror-smooth, 1 = matte |
| `metallic` | `number` | 0 = plastic, wood, stone; 1 = metal |
| `alpha` | `number` | Opacity, used with `alphaMode: "blend"` |
| `alphaMode` | `"opaque"` \| `"blend"` \| `"mask"` | Default `"opaque"`, which ignores `alpha` |
| `emissive` | `{ color, strength }` | Glow. A `strength` above 1 feeds [bloom](./view3d#post-processing) |
| `texture` | `string` \| `Texture` | Image URL or texture for the base color |
| `doubleSided` | `boolean` | Draws both faces |
| `normalTexture` | `string` \| `Texture` | Normal map URL: surface detail without extra triangles |
| `metallicRoughnessTexture` / `occlusionTexture` | `string` \| `Texture` | PBR texture maps |
| `flatShading` | `boolean` | Faceted look: each triangle is shaded flat |

Every texture option (any option named `texture` or ending in `Texture`, at any depth) takes an image URL: it is loaded before the material is built.

### Physical Extensions

`"pbr"` materials also take the glTF physical extensions as plain objects: `clearcoat`, `sheen`, `specular`, `iridescence`, `transmission` (glass), `anisotropy` and `ior`. For example a car paint and a glass:

```html
<Mesh3D geometry={{ type: "sphere" }} material={{ baseColor: 0xb3001b, metallic: 0.6, roughness: 0.4, clearcoat: { factor: 1, roughness: 0.05 } }} />
<Mesh3D geometry={{ type: "cube" }} material={{ baseColor: 0xffffff, roughness: 0.05, transmission: { factor: 1 }, ior: 1.5 }} />
```

### Toon and Phong

```html
<!-- Cel shading in 3 bands -->
<Mesh3D geometry={{ type: "torusKnot" }} material={{ type: "toon", baseColor: 0xff7043, bands: 3, rimIntensity: 0.5 }} />

<!-- Shiny plastic -->
<Mesh3D geometry={{ type: "sphere" }} material={{ type: "phong", baseColor: 0x3399ff, shininess: 60, specularColor: 0xffffff }} />
```

`"toon"` options: `bands`, `specularSize`, `rimPower`, `rimIntensity`. `"phong"` options: `shininess`, `specularColor`, `specularStrength`, `specularTexture`, `normalTexture`.

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

