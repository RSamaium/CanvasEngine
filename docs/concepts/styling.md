# Styling

CanvasEngine allows you to add CSS styles to your components using the `<style>` tag. Styles are automatically injected into the document head and can be scoped to specific components.

## Basic Usage

You can add a `<style>` tag to any `.ce` file:

```html
<Canvas>
  <DOMContainer>
    <button>Click me</button>
  </DOMContainer>
</Canvas>

<style>
  button {
    background-color: red;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
  }
</style>

<script>
</script>
```

The CSS is automatically injected into the document's `<head>` when the component is loaded. This allows you to style DOM elements (like `<button>`, `<input>`, etc.) used within `DOMContainer` components.

## Scoped Styles

To scope styles to a specific component instance, use the `scoped` attribute on the `<style>` tag:

```html
<Canvas>
  <DOMContainer>
    <button>Click me</button>
  </DOMContainer>
</Canvas>

<style scoped>
  button {
    background-color: blue;
    color: white;
  }
</style>

<script>
</script>
```

When you use `scoped`, CanvasEngine automatically:

1. **Generates a unique hash** (8 letters) based on the file path
2. **Prefixes all CSS selectors** with this unique class
3. **Applies the class** to all `DOMContainer` elements in the component

This ensures that the styles only apply to DOM elements within this specific component instance, preventing style leakage to other components.

### Multiple DOMContainer Elements

All `DOMContainer` elements in a scoped component receive the same scope class:

```html
<Canvas>
  <DOMContainer>
    <div>First container</div>
  </DOMContainer>
  <DOMContainer>
    <div>Second container</div>
  </DOMContainer>
</Canvas>

<style scoped>
  div {
    padding: 10px;
    border: 1px solid black;
  }
</style>

<script>
</script>
```

Both `DOMContainer` elements will have the same scope class, so the styles apply consistently across all of them.

## Preserving @rules

When using scoped styles, CSS `@rules` like `@media` queries are preserved and not scoped:

```html
<Canvas>
  <DOMContainer>
    <button>Responsive Button</button>
  </DOMContainer>
</Canvas>

<style scoped>
  @media (max-width: 600px) {
    button {
      font-size: 14px;
    }
  }
  
  button {
    color: blue;
  }
</style>

<script>
</script>
```

The `@media` query remains unchanged, while the regular `button` selector is scoped. This allows you to use media queries and other CSS features normally within scoped styles.

## Combining Scoped and Global Styles

You can have both scoped and unscoped styles in the same file:

```html
<Canvas>
  <DOMContainer>
    <button class="primary">Primary Button</button>
  </DOMContainer>
</Canvas>

<style>
  /* Global styles - apply to all components */
  .primary {
    font-weight: bold;
  }
</style>

<style scoped>
  /* Scoped styles - only apply to this component */
  button {
    background-color: blue;
    color: white;
  }
</style>

<script>
</script>
```

## Best Practices

1. **Use scoped styles for component-specific styling**: This prevents style conflicts and makes your styles more maintainable.

2. **Use global styles sparingly**: Global styles apply to all components, so use them only for truly global styles (like reset styles or theme variables).

3. **Style DOM elements only**: CSS styles work with DOM elements (rendered via `DOMContainer` or `DOMElement`). They don't affect CanvasEngine components like `Sprite`, `Text`, or `Container`.

4. **Keep styles simple**: Complex CSS may require additional testing. The scoping mechanism works best with standard CSS selectors.