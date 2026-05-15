# NightAmbient

<!-- @include: ./_before.md -->

## Overview

`NightAmbient` adds a night overlay with dynamic light spots.

- If a `Viewport` is present in context, the filter is attached to it automatically.
- Otherwise, it attaches to the parent container.
- All props are reactive and support signal/function values.
- `haze` is an ambient night veil, not a physical fog effect.
- `NightAmbiant` remains available as a backward-compatible alias.

## Basic Usage

```html
<Canvas backgroundColor="#1a472a">
    <Viewport worldWidth={2048} worldHeight={2048} screen>
        <NightAmbient
            spots={lightSpots}
            darkness={{
                opacity: 0.8,
                color: "#0a1020",
            }}
            haze={{
                color: "#141a2a",
                radius: 0.5,
                softness: 0.35,
                opacity: 0.35,
            }}
        />
    </Viewport>
</Canvas>

<script>
    import { NightAmbient } from '@canvasengine/presets'
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
        <NightAmbient spots={spots} />
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
| darkness | `number \| { opacity, color }` \| `Signal` \| `() => value` | No | `{ opacity: 0.75, color: "#000000" }` | Darkness overlay outside light spots. A number is treated as `opacity` |
| darkColor | `Color` \| `Signal<Color>` \| `() => Color` | No | `#000000` | Legacy alias for `darkness.color` |
| haze | `{ color, radius, softness, opacity }` \| `Signal` \| `() => value` | No | see below | Haze configuration |

### Darkness fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| opacity | `number` \| `Signal<number>` \| `() => number` | `0.75` | Overlay opacity outside light spots (`0` = no darkening, `1` = full color overlay) |
| color | `Color` \| `Signal<Color>` \| `() => Color` | `#000000` | Overlay color outside light spots |

### Haze fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| color | `Color` \| `Signal<Color>` \| `() => Color` | `#141424` | Haze color |
| radius | `number` \| `Signal<number>` \| `() => number` | `0.5` | Distance from light center where haze starts (`0..1`) |
| softness | `number` \| `Signal<number>` \| `() => number` | `0.35` | Width of the haze transition |
| opacity | `number` \| `Signal<number>` \| `() => number` | `0.35` | Maximum haze overlay opacity outside light spots |

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
