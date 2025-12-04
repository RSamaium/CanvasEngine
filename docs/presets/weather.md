# Weather

<!-- @include: ./_before.md -->

## Overview

The Weather component creates realistic weather effects using WebGL shaders. It supports multiple weather types including rain and snow, with customizable parameters for wind influence, density, and speed control. The effects are inspired by Zelda-style weather systems and provide beautiful, performant weather overlays for your games.

## Features

- **Multiple Weather Effects**: Support for rain and snow with different visual characteristics
- **Procedural Generation**: Weather particles are generated using hash functions for natural randomness
- **Wind Simulation**: Particles are affected by wind direction and strength as they fall
- **Density Control**: Adjust the number of visible particles from light to heavy weather
- **Speed Variation**: Each particle has slightly different movement speed for realistic behavior
- **Signal Support**: All parameters can be controlled dynamically using signals
- **Performance Optimized**: Uses efficient WebGL shaders for smooth 60fps rendering

## Basic Usage

```html
<Canvas>
    <!-- Basic rain with default settings -->
    <Weather />

    <!-- Basic snow with default settings -->
    <Weather effect="snow" />
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
        effect="rain"
        speed={1.5}
        windDirection={0.8}
        windStrength={0.6}
        density={300}
    />

    <!-- Light drizzle -->
    <Weather
        effect="rain"
        speed={0.2}
        density={80}
        windStrength={0.1}
    />

    <!-- Heavy snow with gentle wind -->
    <Weather
        effect="snow"
        speed={0.8}
        windDirection={0.3}
        windStrength={0.4}
        density={200}
    />

    <!-- Light snowfall -->
    <Weather
        effect="snow"
        speed={0.3}
        density={60}
        windStrength={0.2}
    />
</Canvas>
```

### Dynamic Control with Signals

```html
<Canvas>
    <Weather
        effect={currentEffect}
        speed={weatherSpeed}
        windDirection={windDirection}
        windStrength={windStrength}
        density={weatherDensity}
    />
</Canvas>

<script>
    import { Weather } from '@canvasengine/presets'
    import { signal } from 'canvasengine'

    // Create reactive signals
    const currentEffect = signal('rain')
    const weatherSpeed = signal(0.5)
    const windDirection = signal(0.0)
    const windStrength = signal(0.2)
    const weatherDensity = signal(180)

    // Control rain dynamically
    function startStorm() {
        currentEffect.set('rain')
        weatherSpeed.set(1.8)
        windDirection.set(0.7)
        windStrength.set(0.8)
        weatherDensity.set(350)
    }

    function lightRain() {
        currentEffect.set('rain')
        weatherSpeed.set(0.3)
        windDirection.set(0.1)
        windStrength.set(0.1)
        weatherDensity.set(100)
    }

    // Control snow dynamically
    function startBlizzard() {
        currentEffect.set('snow')
        weatherSpeed.set(1.2)
        windDirection.set(0.9)
        windStrength.set(0.7)
        weatherDensity.set(300)
    }

    function lightSnow() {
        currentEffect.set('snow')
        weatherSpeed.set(0.4)
        windDirection.set(0.2)
        windStrength.set(0.3)
        weatherDensity.set(80)
    }
</script>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| effect | `string` | No | 'rain' | Weather effect type ('rain', 'snow') |
| speed | `number` \| `Signal<number>` | No | 0.5 | Falling speed (0.1 = slow, 2.0 = fast) |
| windDirection | `number` \| `Signal<number>` | No | 0.0 | Wind direction (-1.0 = left, 1.0 = right) |
| windStrength | `number` \| `Signal<number>` | No | 0.2 | Wind strength (0.0 = no wind, 1.0 = strong) |
| density | `number` \| `Signal<number>` | No | 180.0 | Particle density (50-400 particles) |
| resolution | `Array<number>` \| `Signal<Array<number>>` | No | [1000, 1000] | Screen resolution for proper scaling |

## Parameter Guidelines

### Speed
- **0.1 - 0.3**: Light precipitation (gentle rain or snow)
- **0.4 - 0.7**: Normal weather
- **0.8 - 1.2**: Heavy weather
- **1.3 - 2.0**: Extreme weather (storm or blizzard)

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
- **50 - 100**: Light weather, sparse particles
- **100 - 200**: Normal weather
- **200 - 300**: Heavy weather
- **300 - 400**: Extreme weather (downpour or heavy snow)

## Performance Notes

- The Weather component uses WebGL shaders for optimal performance
- Density values above 400 may impact performance on lower-end devices
- The effect is designed to run smoothly at 60fps on modern hardware
- Consider reducing density on mobile devices for better performance

## Weather Presets

Here are some pre-configured weather scenarios:

```javascript
// Light Spring Rain
<Weather effect="rain" speed={0.3} windDirection={0.1} windStrength={0.15} density={120} />

// Summer Storm
<Weather effect="rain" speed={1.6} windDirection={0.8} windStrength={0.7} density={320} />

// Gentle Drizzle
<Weather effect="rain" speed={0.2} windDirection={0.0} windStrength={0.05} density={80} />

// Windy Rain
<Weather effect="rain" speed={0.8} windDirection={-0.6} windStrength={0.9} density={200} />

// Heavy Downpour
<Weather effect="rain" speed={1.8} windDirection={0.2} windStrength={0.4} density={380} />

// Light Snowfall
<Weather effect="snow" speed={0.4} windDirection={0.2} windStrength={0.2} density={80} />

// Winter Blizzard
<Weather effect="snow" speed={1.4} windDirection={0.8} windStrength={0.8} density={280} />

// Gentle Snow
<Weather effect="snow" speed={0.3} windDirection={0.0} windStrength={0.1} density={60} />

// Windy Snow
<Weather effect="snow" speed={0.9} windDirection={-0.7} windStrength={0.6} density={180} />

// Heavy Snowstorm
<Weather effect="snow" speed={1.6} windDirection={0.3} windStrength={0.5} density={350} />
```

## Technical Details

The Weather component uses specialized fragment shaders for each effect:

### Rain Shader
1. **Generates procedural raindrops** using hash functions for randomness
2. **Simulates physics** with gravity and wind effects on elongated streaks
3. **Applies visual styling** with Zelda-inspired raindrop appearance
4. **Optimizes rendering** using efficient GPU calculations
5. **Supports real-time updates** through uniform buffer updates

### Snow Shader
1. **Generates procedural snowflakes** with circular shapes and size variation
2. **Simulates gentle physics** with slower movement and subtle wind drift
3. **Applies visual styling** with soft, white snowflake appearance
4. **Optimizes rendering** using efficient GPU calculations
5. **Supports real-time updates** through uniform buffer updates

Both shaders render approximately 150-200 potential particles per frame, with the actual visible count controlled by the density parameter. 