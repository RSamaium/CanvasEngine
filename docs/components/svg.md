# SVG Component

The SVG component allows you to render SVG graphics in your CanvasEngine applications. There are three ways to use SVG graphics:

## Direct SVG Tags

You can use SVG directly in your templates. The compiler will automatically convert SVG tags to the appropriate component:

```html
<svg viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" stroke="black" stroke-width="2"/>
  <path d="M 10 80 Q 52.5 10, 95 80 T 180 80" stroke="red" fill="transparent"/>
</svg>
```

This approach is perfect for simple, static SVG graphics that you want to embed directly in your template.

## Loading SVG from URL

Use the `Svg` component with the `src` prop to load SVG files from external sources:

```html
<Svg src="/assets/logo.svg" x={10} y={20} />
```

This method is ideal for:
- Loading SVG files from your assets folder
- Dynamically loading different SVG files
- Reusing SVG graphics across multiple components

## SVG from String Content

Use the `Svg` component with the `content` prop to render SVG from a string variable:

```html
<script>
const svgContent = `
  <svg viewBox="0 0 200 200" width="200" height="200">
    <rect x="10" y="10" width="180" height="180" fill="lightblue" stroke="navy" stroke-width="3"/>
    <circle cx="100" cy="100" r="50" fill="yellow"/>
    <text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="16" fill="black">
      Hello SVG!
    </text>
  </svg>
`;
</script>

<Svg content={svgContent} />
```

This approach is useful for:
- Generating SVG content dynamically
- Building SVG from data or user input
- Creating complex SVG graphics programmatically

## SVG Component Props

| Prop | Type | Description |
|------|------|-------------|
| `src` | string | URL path to an SVG file to load |
| `content` | string | Direct SVG content as a string |
| `svg` | string | (Legacy) SVG content string for backward compatibility |

## Performance Considerations

- **Direct SVG tags** are the most efficient for static graphics as they're compiled at build time
- **src prop** is best for external files as it leverages PixiJS's asset loading system
- **content prop** is flexible but requires runtime parsing


<!-- @include: ./_display-object.md --> 