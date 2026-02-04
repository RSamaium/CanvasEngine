# NightAmbiant

<!-- @include: ./_before.md -->

## Overview

`NightAmbiant` adds a night overlay with dynamic light spots.

- If a `Viewport` is present in context, the filter is attached to it automatically.
- Otherwise, it attaches to the parent container.
- `lightSpots` is reactive and supports signal/function values for the list and each spot field.

## Basic Usage

```html
<Canvas backgroundColor="#1a472a">
    <Viewport worldWidth={2048} worldHeight={2048} screen>
        <NightAmbiant lightSpots={lightSpots} />
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
| lightSpots | `Array<SpotInput>` \| `Signal<Array<SpotInput>>` \| `() => Array<SpotInput>` | No | `[]` | Main reactive list of light spots |
| spots | Same as `lightSpots` | No | - | Alias for compatibility |

`SpotInput` fields:

- `x`, `y` (required): `number` \| `Signal<number>` \| `() => number`
- `radius`, `intensity`, `flicker`, `flickerSpeed`, `pulse`, `pulseSpeed`, `phase` (optional): each field can be static or reactive
