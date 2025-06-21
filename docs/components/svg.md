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

## Reactive SVG Content

You can make SVG content reactive by using signals:

```html
<script>
import { signal } from 'canvasengine'

const radius = signal(30)
const color = signal('red')

const updateRadius = () => {
  radius.update(r => r + 10)
}

const changeColor = () => {
  color.set(color() === 'red' ? 'blue' : 'red')
}
</script>

<svg viewBox="0 0 200 200" width="200" height="200" @click={updateRadius}>
  <circle cx="100" cy="100" r={radius()} fill={color()} />
</svg>

<button @click={changeColor}>Change Color</button>
```

## SVG with Animations

You can animate SVG properties using CanvasEngine's animation system:

```html
<script>
import { signal, animate } from 'canvasengine'

const rotation = signal(0)

const startAnimation = () => {
  animate({
    from: 0,
    to: 360,
    duration: 2000,
    onUpdate: (value) => rotation.set(value),
    loop: true
  })
}
</script>

<svg viewBox="0 0 100 100" width="100" height="100">
  <g transform={`rotate(${rotation()} 50 50)`}>
    <rect x="25" y="25" width="50" height="50" fill="purple"/>
  </g>
</svg>

<button @click={startAnimation}>Start Rotation</button>
```

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

## Advanced Usage

### Loading SVG with Custom Graphics Context

When using the `src` prop, the SVG is loaded with PixiJS's graphics context parsing, allowing for optimal performance:

```html
<Svg src="/complex-illustration.svg" scale={[2, 2]} />
```

### Combining SVG with Other Components

SVG components can be combined with other CanvasEngine components:

```html
<Container>
  <Svg src="/background.svg" />
  <Text text="Overlay Text" x={50} y={50} />
  <Sprite image="/character.png" x={100} y={100} />
</Container>
```

<!-- @include: ./_display-object.md --> 