# Use Viewport component

Common example:

```html
<Viewport worldWidth="2000" worldHeight="2000" clamp={ {direction: 'all'} } />
```

## Properties

You can use all properties from Display Object

## Viewport Follow Directive

The `viewportFollow` directive allows an element to be followed by the viewport. When applied, the viewport will automatically center on the element as it moves.

This directive must be used within a `Viewport` component context.

### Usage

```html
<Viewport worldWidth="2000" worldHeight="2000" clamp={ {direction: 'all'} />
    <Rect viewportFollow x="0" y="0" width="100" height="100" color="red" />
</Viewport>
```

In this example, the red rectangle will be followed by the viewport, keeping it centered in the view as it moves around within the 2000x2000 world space.

### Requirements

- Must be used on an element that is a child of a `Viewport` component
- The parent `Viewport` component must have defined dimensions (`worldWidth` and `worldHeight`)

<!-- @include: ./_display-object.md -->
