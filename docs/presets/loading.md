# Loading

<!-- @include: ./_before.md -->

## Overview

The Loading component creates an animated circular loading spinner with customizable appearance and rotation speed. The spinner consists of multiple segments arranged in a circle that rotate continuously, creating a smooth loading indicator perfect for indicating asynchronous operations or loading states in your game.

## Features

- **Smooth Animation**: Continuous rotation using the tick system for frame-perfect animation
- **Customizable Appearance**: Adjust size, color, number of segments, and rotation speed
- **Alpha Variation**: Active segments are fully opaque while inactive segments have reduced opacity for a polished look
- **Signal Support**: All parameters can be controlled dynamically using signals
- **Lightweight**: Simple Graphics-based rendering for optimal performance

## Basic Usage

```html
<Canvas>
    <!-- Basic loading spinner with default settings -->
    <Loading />
</Canvas>

<script>
    import { Loading } from '@canvasengine/presets'
</script>
```

## Advanced Usage

### Static Configuration

```html
<Canvas>
    <!-- Custom size and color -->
    <Loading 
        size={50}
        color="#e74c3c"
    />
    
    <!-- Fast spinning loader with more segments -->
    <Loading 
        speed={360}
        segments={12}
        segmentWidth={4}
    />
    
    <!-- Large loader with background circle -->
    <Loading 
        size={80}
        color="#2ecc71"
        backgroundColor="#ecf0f1"
        segmentWidth={5}
        inactiveAlpha={0.2}
    />
</Canvas>
```

### Dynamic Control with Signals

```html
<Canvas>
    <Loading 
        size={loaderSize}
        speed={loaderSpeed}
        color={loaderColor}
    />
</Canvas>

<script>
    import { Loading } from '@canvasengine/presets'
    import { signal } from 'canvasengine'
    
    // Create reactive signals
    const loaderSize = signal(30)
    const loaderSpeed = signal(180)
    const loaderColor = signal('#3498db')
    
    // Control loader dynamically
    function showLargeLoader() {
        loaderSize.set(60)
        loaderSpeed.set(240)
    }
    
    function hideLoader() {
        loaderSize.set(0)
    }
</script>
```

### Positioning the Loader

```html
<Canvas>
    <!-- Centered loader and label -->
    <Container
        width="100%"
        height="100%"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={16}
    >
        <Loading size={40} />
        <Text text="Loading..." />
    </Container>
    
    <!-- Multiple loaders at different positions -->
    <Loading x={100} y={100} size={25} color="#e74c3c" />
    <Loading x={700} y={100} size={25} color="#2ecc71" />
    <Loading x={400} y={500} size={25} color="#f39c12" />
</Canvas>
```

As with `Container`, explicit `x` and `y` coordinates position the loader's bounding box. Prefer flex alignment when the spinner must stay centered across canvas resizes.

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| size | `number` \| `Signal<number>` | No | 30 | Size of the loading spinner (radius in pixels) |
| color | `string` \| `Signal<string>` | No | '#3498db' | Color of the spinner segments |
| backgroundColor | `string` \| `Signal<string>` | No | - | Background color of the spinner (optional) |
| speed | `number` \| `Signal<number>` | No | 180 | Rotation speed in degrees per second |
| segments | `number` \| `Signal<number>` | No | 8 | Number of segments in the spinner |
| segmentWidth | `number` \| `Signal<number>` | No | 3 | Width of each segment in pixels |
| inactiveAlpha | `number` \| `Signal<number>` | No | 0.3 | Alpha value for inactive segments (0-1) |

And use all the properties of the `Container` component (x, y, anchor, scale, etc.).

## Parameter Guidelines

### Size
- **10 - 20**: Small, subtle loader
- **25 - 40**: Standard size for most use cases
- **50 - 80**: Large, prominent loader
- **100+**: Extra large for splash screens or main loading states

### Speed
- **90 - 120**: Slow, gentle rotation
- **150 - 200**: Normal speed (recommended)
- **240 - 360**: Fast rotation
- **360+**: Very fast, energetic rotation

### Segments
- **4 - 6**: Minimal, simple look
- **8 - 10**: Standard (recommended)
- **12 - 16**: More detailed, smoother appearance
- **20+**: Very detailed, may impact performance

### Segment Width
- **1 - 2**: Thin, delicate segments
- **3 - 4**: Standard width (recommended)
- **5 - 8**: Thick, bold segments
- **10+**: Very thick, may overlap

### Inactive Alpha
- **0.1 - 0.2**: Strong contrast, very visible active segments
- **0.3 - 0.4**: Balanced contrast (recommended)
- **0.5 - 0.7**: Subtle contrast, softer appearance
- **0.8 - 0.9**: Minimal contrast, almost uniform

## Loading Presets

Here are some pre-configured loading spinner styles:

```javascript
// Minimal Loader
<Loading size={20} segments={6} segmentWidth={2} inactiveAlpha={0.2} />

// Standard Loader
<Loading size={30} color="#3498db" speed={180} segments={8} />

// Fast Loader
<Loading size={40} color="#e74c3c" speed={360} segments={12} />

// Large Prominent Loader
<Loading 
    size={60} 
    color="#2ecc71" 
    backgroundColor="#ecf0f1" 
    segmentWidth={5} 
    inactiveAlpha={0.25}
/>

// Subtle Loader
<Loading 
    size={25} 
    color="#95a5a6" 
    speed={120} 
    inactiveAlpha={0.5} 
/>
```

## Use Cases

### Loading Screen

```html
<Canvas>
    <Container x={400} y={300} anchor={{ x: 0.5, y: 0.5 }}>
        <Text text="Loading..." y={-50} anchor={{ x: 0.5, y: 0.5 }} />
        <Loading size={40} />
    </Container>
</Canvas>
```

### Button Loading State

```html
<Canvas>
    <Container x={400} y={300}>
        <Button>
            {isLoading ? (
                <Loading size={15} color="#fff" />
            ) : (
                <Text text="Submit" />
            )}
        </Button>
    </Container>
</Canvas>
```

### Multiple Loading Indicators

```html
<Canvas>
    <!-- Show different loaders for different async operations -->
    <Loading 
        x={200} 
        y={150} 
        size={25} 
        color={dataLoading ? '#3498db' : '#95a5a6'} 
    />
    <Loading 
        x={600} 
        y={150} 
        size={25} 
        color={assetsLoading ? '#2ecc71' : '#95a5a6'} 
    />
</Canvas>
```

## Performance Notes

- The Loading component uses Graphics-based rendering for optimal performance
- Animation runs smoothly at 60fps using the tick system
- Multiple loaders can be rendered simultaneously without performance issues
- Consider reducing segment count (4-6) for mobile devices if needed

## Technical Details

The Loading component:

1. **Uses Graphics element** to draw multiple radial segments
2. **Animates rotation** using the tick system with deltaTime for frame-perfect timing
3. **Calculates opacity** based on segment position for smooth visual transition
4. **Supports reactive updates** through signal-based props
5. **Forces redraw** on each frame to ensure smooth animation

The spinner draws segments as arcs arranged in a circle, with each segment's opacity varying based on its position relative to the rotation angle, creating a smooth visual effect.
