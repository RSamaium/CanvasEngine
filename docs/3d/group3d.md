# Group3D

`Group3D` holds other 3D nodes. Moving, rotating or scaling the group applies to all its children, whose own positions are relative to the group.

## Basic Usage

```html
<Group3D position={[0, 2, 0]} rotation={[0, angle, 0]}>
  <Mesh3D geometry={{ type: "torusKnot", radius: 0.8, tube: 0.25 }} material={{ baseColor: 0x4a90d9 }} />
  <!-- 2.4 units from the group's center: it orbits as the group turns -->
  <Mesh3D geometry={{ type: "sphere", radius: 0.35 }} material={{ baseColor: 0xffd34d }} position={[2.4, 0, 0]} />
</Group3D>

<script>
  import { signal, tick } from "canvasengine";
  import { Group3D, Mesh3D } from "@canvasengine/3d";

  const angle = signal(0);
  tick(({ deltaTime }) => angle.update((a) => a + deltaTime * 0.001));
</script>
```

## Properties

`Group3D` takes the [common props](./getting-started#common-props): `position`, `rotation`, `scale`, `lookAt`, `visible`, `label` and the pointer events.

## Uses

- **Move an object made of several parts**: a vehicle with wheels, a character with a held item.
- **Show or hide a set of objects**: `visible={showDecor}` on the group.
- **Pivot around a point**: put the pivot at the group's position and offset the children.
- **Catch events for several meshes**: a `click` on the group fires when any of its meshes is clicked.

Groups can be nested, and children can also be `Model3D` and lights:

```html
<Group3D position={heroPos} rotation={[0, heading, 0]}>
  <Model3D src="./models/hero.glb" animation={clip} />
  <!-- A torch light that follows the hero -->
  <PointLight color={0xff8a3d} intensity={25} range={6} position={[0.5, 2, 0.5]} />
</Group3D>
```

::: tip
`lookAt` aims at a point in **world** coordinates, even inside a group. To aim a child relative to its group, use `rotation`.
:::
