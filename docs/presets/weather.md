# Weather

<!-- @include: ./_before.md -->

## Overview

The Weather component creates realistic rain effects using WebGL shaders. It simulates raindrops falling with wind influence, customizable density, and speed control. The effect is inspired by Zelda-style weather systems and provides a beautiful, performant rain overlay for your games.

## Features

- **Procedural Rain Generation**: Each raindrop is generated using hash functions for natural randomness
- **Wind Simulation**: Raindrops are affected by wind direction and strength as they fall
- **Density Control**: Adjust the number of visible raindrops from light drizzle to heavy downpour
- **Speed Variation**: Each drop has slightly different falling speed for realistic movement
- **Signal Support**: All parameters can be controlled dynamically using signals
- **Performance Optimized**: Uses efficient WebGL shaders for smooth 60fps rendering

## Basic Usage

```html
<Canvas>
    <!-- Basic rain with default settings -->
    <Weather />
</Canvas>

<script>
    import { Weather } from '@canvasengine/presets'
</script>
```

## Advanced Usage

### Static Configuration

```html
<Canvas>
    <!-- Heavy rain with strong wind -->
    <Weather 
        speed={1.5}
        windDirection={0.8}
        windStrength={0.6}
        density={300}
    />
    
    <!-- Light drizzle -->
    <Weather 
        speed={0.2}
        density={80}
        windStrength={0.1}
    />
</Canvas>
```

### Dynamic Control with Signals

```html
<Canvas>
    <Weather 
        speed={rainSpeed}
        windDirection={windDirection}
        windStrength={windStrength}
        density={rainDensity}
    />
</Canvas>

<script>
    import { Weather } from '@canvasengine/presets'
    import { signal } from 'canvasengine'
    
    // Create reactive signals
    const rainSpeed = signal(0.5)
    const windDirection = signal(0.0)
    const windStrength = signal(0.2)
    const rainDensity = signal(180)
    
    // Control rain dynamically
    function startStorm() {
        rainSpeed.set(1.8)
        windDirection.set(0.7)
        windStrength.set(0.8)
        rainDensity.set(350)
    }
    
    function lightRain() {
        rainSpeed.set(0.3)
        windDirection.set(0.1)
        windStrength.set(0.1)
        rainDensity.set(100)
    }
</script>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| speed | number \| Signal<number> | No | 0.5 | Rain falling speed (0.1 = slow, 2.0 = fast) |
| windDirection | number \| Signal<number> | No | 0.0 | Wind direction (-1.0 = left, 1.0 = right) |
| windStrength | number \| Signal<number> | No | 0.2 | Wind strength (0.0 = no wind, 1.0 = strong) |
| density | number \| Signal<number> | No | 180.0 | Rain density (50-400 raindrops) |
| resolution | Array<number> \| Signal<Array<number>> | No | [1000, 1000] | Screen resolution for proper scaling |

## Parameter Guidelines

### Speed
- **0.1 - 0.3**: Light drizzle, gentle rain
- **0.4 - 0.7**: Normal rain
- **0.8 - 1.2**: Heavy rain
- **1.3 - 2.0**: Storm, torrential rain

### Wind Direction
- **-1.0**: Strong wind from right to left
- **-0.5**: Moderate wind from right to left
- **0.0**: No horizontal wind
- **0.5**: Moderate wind from left to right
- **1.0**: Strong wind from left to right

### Wind Strength
- **0.0**: No wind effect
- **0.1 - 0.3**: Light breeze
- **0.4 - 0.6**: Moderate wind
- **0.7 - 1.0**: Strong wind/storm

### Density
- **50 - 100**: Light rain, sparse drops
- **100 - 200**: Normal rain
- **200 - 300**: Heavy rain
- **300 - 400**: Torrential downpour

## Performance Notes

- The Weather component uses WebGL shaders for optimal performance
- Density values above 400 may impact performance on lower-end devices
- The effect is designed to run smoothly at 60fps on modern hardware
- Consider reducing density on mobile devices for better performance

## Weather Presets

Here are some pre-configured weather scenarios:

```javascript
// Light Spring Rain
<Weather speed={0.3} windDirection={0.1} windStrength={0.15} density={120} />

// Summer Storm
<Weather speed={1.6} windDirection={0.8} windStrength={0.7} density={320} />

// Gentle Drizzle
<Weather speed={0.2} windDirection={0.0} windStrength={0.05} density={80} />

// Windy Rain
<Weather speed={0.8} windDirection={-0.6} windStrength={0.9} density={200} />

// Heavy Downpour
<Weather speed={1.8} windDirection={0.2} windStrength={0.4} density={380} />
```

## Technical Details

The Weather component uses a fragment shader that:

1. **Generates procedural raindrops** using hash functions for randomness
2. **Simulates physics** with gravity and wind effects
3. **Applies visual styling** with Zelda-inspired appearance
4. **Optimizes rendering** using efficient GPU calculations
5. **Supports real-time updates** through uniform buffer updates

The shader renders approximately 200 potential raindrops per frame, with the actual visible count controlled by the density parameter. 