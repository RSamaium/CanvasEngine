# NightAmbiant

<!-- @include: ./_before.md -->

## Overview

`NightAmbiant` adds a night overlay with dynamic light spots.

- If a `Viewport` is present in context, the filter is attached to it automatically.
- Otherwise, it attaches to the parent container.
- All props are reactive and support signal/function values.

## Basic Usage

```html
<Canvas backgroundColor="#1a472a">
    <Viewport worldWidth={2048} worldHeight={2048} screen>
        <NightAmbiant
            lightSpots={lightSpots}
            darkness={0.8}
            darkColor="#0a1020"
            fogColor="#141a2a"
        />
    </Viewport>
</Canvas>

<script>
    import { NightAmbiant } from '@canvasengine/presets'
    import { signal } from 'canvasengine'

    const playerX = signal(400)
    const playerY = signal(300)

    const lightSpots = () => [
        {
            x: playerX,
            y: playerY,
            radius: 170,
            intensity: 1.0,
            flicker: true,
            flickerSpeed: 15,
        },
        { x: 280, y: 260, radius: 180, intensity: 0.95, flicker: true, flickerSpeed: 13 },
    ]
</script>
```

## Without Viewport

```html
<Canvas>
    <Container>
        <NightAmbiant lightSpots={spots} />
        <Sprite image="back.png" />
    </Container>
</Canvas>
```

## Reactive CRUD Example

```html
<script>
    import { signal } from 'canvasengine'

    const spots = signal([
        { x: 280, y: 260, radius: 180, intensity: 0.95, flicker: true, flickerSpeed: 13 },
    ])

    function addSpot() {
        spots.update((list) => [
            ...list,
            { x: 720, y: 540, radius: 130, intensity: 0.8, pulse: true, pulseSpeed: 1.5 },
        ])
    }

    function removeFirstSpot() {
        spots.update((list) => list.slice(1))
    }
</script>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| lightSpots | `Array<SpotInput>` \| `Signal` \| `() => Array` | No | `[]` | Main reactive list of light spots |
| spots | Same as `lightSpots` | No | - | Alias for compatibility |
| darkness | `number` \| `Signal<number>` \| `() => number` | No | `0.75` | Darkness intensity outside light spots (`0` = no darkening, `1` = full black) |
| darkColor | `Color` \| `Signal<Color>` \| `() => Color` | No | `#000000` | Tint color applied in dark zones (colored night effect) |
| fogColor | `Color` \| `Signal<Color>` \| `() => Color` | No | `#141424` | Fog color that fades in around light spots |
| fogRadius | `number` \| `Signal<number>` \| `() => number` | No | `0.5` | Distance from light center where fog starts (`0..1`) |
| fogSoftness | `number` \| `Signal<number>` \| `() => number` | No | `0.35` | Width of the fog transition (higher = softer edge) |

### SpotInput fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| x | `number` \| `Signal<number>` \| `() => number` | Yes | - | X position in world coordinates |
| y | `number` \| `Signal<number>` \| `() => number` | Yes | - | Y position in world coordinates |
| radius | `number` | No | `180` | Light radius in pixels |
| intensity | `number` | No | `1.0` | Light intensity (`0..2`) |
| flicker | `boolean` | No | `false` | Enable flickering effect (like a candle) |
| flickerSpeed | `number` | No | `12` | Speed of the flicker animation |
| pulse | `boolean` | No | `false` | Enable pulsing effect (slow breathing) |
| pulseSpeed | `number` | No | `2` | Speed of the pulse animation |
| phase | `number` | No | auto | Phase offset for animations (to desync multiple lights) |

### Color format

`Color` supports multiple formats:

- Hex string: `"#0a1020"`, `"#abc"`
- Number: `0x0a1020`
- RGB tuple (0-255): `[10, 16, 32]`
- Normalized RGB (0-1): `[0.04, 0.06, 0.12]`
