# Use Scroll component

Common example:

```html
<Scroll worldWidth="2000" worldHeight="2000" follow={player}>
    <Container ref="player" />
</Scroll>
```

The `Scroll` component creates an internal viewport using [pixi-viewport](https://github.com/davidfig/pixi-viewport). It can follow one of its children with the `follow` prop.

## Properties

You can use all properties from Display Object

### follow

`follow?: DisplayObject`

Element that the viewport will follow.

<!-- @include: ./_display-object.md -->
