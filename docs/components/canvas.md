# Canvas Component

`Canvas` is the root component of a CanvasEngine scene. Use it once at the top of your application component to create the PixiJS application and host every canvas-rendered child component.

## Minimal example

```html
<Canvas backgroundColor="#101820">
  <Text text="Hello World" x={40} y={40} color="#ffffff" />
</Canvas>
```

The start component passed to `bootstrapCanvas` must begin with `Canvas`.

## Layout example

`Canvas` can also receive layout props, which makes it useful for HUDs, menus, and centered game screens.

```html
<Canvas
  backgroundColor="#101820"
  flexDirection="column"
  justifyContent="center"
  alignItems="center"
  width="100%"
  height="100%"
>
  <Text text="Press Start" size={42} color="#ffffff" />
</Canvas>
```

## Options

You can use CanvasEngine display and layout props, plus renderer options supported by PixiJS.

`Canvas` is itself the root flex container. Properties such as `flexDirection`,
`gap`, `padding`, `justifyContent`, and `alignItems` apply directly to its
children. Its Yoga width and height always follow the PixiJS renderer screen and
are updated on renderer resize.

CanvasEngine recalculates intrinsic layout sizes immediately by default. For a
very large scene, you can opt into throttling when bootstrapping:

```ts
bootstrapCanvas(root, App, {
  layout: { throttle: 50 },
})
```

::: tip
Use `Canvas` for the scene root. Use `Container` to group or lay out content inside the scene.
:::
