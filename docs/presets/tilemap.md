# TileMap

<!-- @include: ./_before.md -->

## Overview

The TileMap component integrates with **Tiled Map Editor** to render tilemaps in your Canvas Engine application. It supports TMX files, tilesets, object layers, and advanced features like z-layer reorganization.

## Usage

```html
<Canvas>
    <TiledMap 
        map={map} 
        createLayersPerTilesZ={true} 
        basePath="/map" 
        objectLayer={(layer) => <Rect width={32} height={32} color="red" />} 
    />
</Canvas>

<script>
    import { TiledMap } from '@canvasengine/presets'
    import { signal } from 'canvasengine'
    
    let map = signal(null)
    
    fetch('/map/simplemap.tmx')
        .then((res) => res.text())
        .then((text) => {
            map.set(text)
        })
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `map` | `Signal<string \| null>` | - | Signal containing the TMX file content as a string |
| `basePath` | `string` | - | Base path for loading tileset images and other assets |
| `createLayersPerTilesZ` | `boolean` | `false` | Reorganizes layers based on the `z` property of tiles in the tileset |
| `objectLayer` | `(layer: TiledLayer) => JSX.Element` | - | Callback function to render custom components for object layers |

And uses all the properties of the `Container` component.

## Loading TMX Files

The `map` property expects a signal containing the TMX file content as a string. You need to fetch the TMX file and set it to the signal:

```javascript
let map = signal(null)

fetch('/map/simplemap.tmx')
    .then((res) => res.text())
    .then((text) => {
        map.set(text)
    })
```

The component will automatically load associated tilesets based on the `basePath` property.

## Base Path Configuration

The `basePath` property defines where your map assets are located. All tileset images referenced in the TMX file will be loaded relative to this path:

```html
<TiledMap map={map} basePath="/assets/maps" />
```

If your TMX file references `tileset.png`, it will be loaded from `/assets/maps/tileset.png`.

## Z-Layer Reorganization

When `createLayersPerTilesZ` is enabled, the component reorganizes tile layers based on the `z` property defined in your tileset tiles:

```html
<TiledMap map={map} createLayersPerTilesZ={true} />
```

### How Z-Layer Works

- **z=0**: Ground/terrain tiles (default layer)
- **z=1**: Objects above the ground
- **z=2**: Objects above z=1 layer
- And so on...

Tiles without a `z` property are treated as `z=0`. The component creates separate layers for each z-value, ensuring proper rendering order.

### Setting Z Properties in Tiled

In Tiled Map Editor:
1. Select your tileset
2. Choose a tile
3. Add a custom property named `z` with an integer value
4. Tiles with higher z values will render above tiles with lower z values

## Object Layers

Use the `objectLayer` callback to render custom components for object layers defined in your TMX file:

```html
<TiledMap 
    map={map} 
    objectLayer={(layer) => {
        // Render different components based on layer properties
        if (layer.name === 'enemies') {
            return <Enemy x={layer.x} y={layer.y} />
        }
        return <Rect width={32} height={32} color="red" />
    }} 
/>
```

The callback receives a `TiledLayer` object containing all the layer information from your TMX file.

## Supported Tiled Features

- ✅ Tile layers
- ✅ Object layers  
- ✅ Image layers
- ✅ Group layers
- ✅ Tileset animations
- ✅ Tile properties (including custom z-ordering)
- ✅ Multiple tilesets
- ✅ Tile flipping and rotation
- ✅ Layer properties and visibility

## Performance Tips

1. **Optimize tileset images**: Use power-of-2 dimensions for better GPU performance
2. **Limit z-layers**: Too many z-layers can impact performance
3. **Use object layers sparingly**: Complex object layers with many custom components can be expensive
4. **Consider map size**: Very large maps may benefit from chunking or culling techniques
