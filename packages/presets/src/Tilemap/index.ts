import { TiledLayer, TiledLayerType, TiledMap, TiledParserFile, TiledTileset } from "@rpgjs/tiled"
import { loop, h, Container, TilingSprite, useProps, effect, signal } from "canvasengine"
import { CompositeTileLayer } from "./TileLayer"
import { TileSet } from "./TileSet"

/**
 * Reorganizes tile layers based on the z property of tiles
 * 
 * This function analyzes each tile in the layer data and groups them by their z property.
 * If a tile has a z property different from 0, it creates new layers for each z value.
 * 
 * @param {TiledLayer[]} originalLayers - The original layers from the tilemap
 * @param {TileSet[]} tilesets - Array of loaded tilesets
 * @param {TiledMap} mapData - The complete map data
 * @returns {TiledLayer[]} - Reorganized layers with tiles grouped by z property
 * 
 * @example
 * ```typescript
 * const reorganizedLayers = reorganizeLayersByTileZ(mapData.layers, tilesets, mapData);
 * ```
 */
function reorganizeLayersByTileZ(originalLayers: TiledLayer[], tilesets: TileSet[], mapData: TiledMap): TiledLayer[] {
    const reorganizedLayers: TiledLayer[] = [];
    
    for (const layer of originalLayers) {
        if (layer.type !== TiledLayerType.Tile) {
            // Keep non-tile layers as they are
            reorganizedLayers.push(layer);
            continue;
        }

        // Group tiles by their z property
        const layersByZ = new Map<number, number[]>();
        
        // Initialize empty arrays for all z values we'll find
        // Don't pre-populate with original data anymore
        
        // Ensure layer data is number array
        let layerData: number[];
        if (Array.isArray(layer.data)) {
            layerData = layer.data.map(gid => {
                if (typeof gid === 'number') {
                    return gid;
                } else {
                    return parseInt(String(gid), 10);
                }
            });
        } else {
            // If data is a string, it might be compressed - for now, skip this layer
            reorganizedLayers.push(layer);
            continue;
        }
        
        let tilesProcessed = 0;
        let tilesWithZ = 0;
        
        // Analyze each tile in the layer
        for (let i = 0; i < layerData.length; i++) {
            const gid = layerData[i];
            
            if (gid === 0) continue; // Empty tile
            
            tilesProcessed++;
            
            // Find the corresponding tileset
            let tileset: TileSet | undefined;
            for (let j = tilesets.length - 1; j >= 0; j--) {
                if (tilesets[j].firstgid && tilesets[j].firstgid <= gid) {
                    tileset = tilesets[j];
                    break;
                }
            }
            
            if (!tileset) {
                // If no tileset found, put tile in z=0 layer
                if (!layersByZ.has(0)) {
                    layersByZ.set(0, new Array(layerData.length).fill(0));
                }
                layersByZ.get(0)![i] = gid;
                continue;
            }
            
            // Get tile properties from tileset
            const localTileId = gid - tileset.firstgid;
            // @ts-ignore
            const tileProperties = tileset.tileset.tiles?.[localTileId]?.properties;
            const zValue = tileProperties?.z ?? 0;
            
            // Count tiles with explicit z property
            if (tileProperties?.z !== undefined) {
                tilesWithZ++;
            }
            
            // Create or get the layer for this z value
            if (!layersByZ.has(zValue)) {
                layersByZ.set(zValue, new Array(layerData.length).fill(0));
            }
            
            // Place tile in the appropriate z layer
            layersByZ.get(zValue)![i] = gid;
        }
        
        // Create layers for each z value, ensuring z=0 comes first
        const sortedZValues = Array.from(layersByZ.keys()).sort((a, b) => a - b);
        
        for (const zValue of sortedZValues) {
            const layerDataForZ = layersByZ.get(zValue)!;
            
            // Only create layer if it has tiles
            if (layerDataForZ.some(gid => gid !== 0)) {
                const newLayer = {
                    ...layer,
                    name: `${layer.name}_z${zValue}`, // Always add _z suffix
                    data: layerDataForZ,
                    properties: {
                        ...layer.properties,
                        z: zValue
                    }
                };
                
                reorganizedLayers.push(newLayer);
            }
        }
    }
    
    // Sort final layers to ensure z=0 layers come first, then by z value
    reorganizedLayers.sort((a, b) => {
        const zA = a.properties?.z ?? 0.5;
        const zB = b.properties?.z ?? 0.5;
        return zA - zB;
    });
    
    return reorganizedLayers;
}

export function TiledMap(props) {
    const { map, basePath, createLayersPerTilesZ } = useProps(props, {
        createLayersPerTilesZ: false,
        basePath: ''
    })
    const layers = signal<TiledLayer[]>([])
    const objectLayer = props.objectLayer
    let tilesets: TileSet[] = []
    let mapData: TiledMap = {} as TiledMap

    const parseTmx = async (file: string, relativePath: string = '') => {
        if (typeof file !== 'string') {
            return file
        }
        // @ts-ignore
        const parser = new TiledParserFile(
            file,
            {
                basePath: '',
                staticDir: '',
                relativePath
            }
        )
        const data = await parser.parseFilePromise({
            getOnlyBasename: false
        })

        return data
    }

    effect(async () => {
        const _map = map()
        if (_map) {
            mapData = await parseTmx(_map, basePath())
            tilesets = [] // Reset tilesets array
            for (let tileSet of mapData.tilesets) {
                // @ts-ignore
                if (tileSet.tile) tileSet.tiles = tileSet.tile
                tilesets.push(await new TileSet(tileSet).load(tileSet.image.source))
            }
            
            // Reorganize layers by tile z property if enabled
            let finalLayers = mapData.layers;
            if (createLayersPerTilesZ()) {
                finalLayers = reorganizeLayersByTileZ(mapData.layers, tilesets, mapData);
            }
            
            layers.set(finalLayers)
        }
    })

    const createLayer = (layers, props = {}) => {
        return h(Container, props, loop<any>(layers, (layer) => {
            switch (layer.type) {
                case TiledLayerType.Tile:
                    return h(CompositeTileLayer, {
                        tilewidth: mapData.tilewidth,
                        tileheight: mapData.tileheight,
                        // @ts-ignore
                        width: mapData.width,
                        // @ts-ignore
                        height: mapData.height,
                        ...layer,
                        tilesets
                    })
                case TiledLayerType.Image:
                    const { width, height, source } = layer.image
                    return h(TilingSprite, {
                        image: source,
                        ...layer,
                        width: layer.repeatx ? layer.width * layer.tilewidth : width,
                        height: layer.repeaty ? layer.height * layer.tileheight : height
                    })
                case TiledLayerType.Group:
                    return createLayer(signal(layer.layers), layer)
                case TiledLayerType.ObjectGroup:
                    const child = objectLayer?.(layer)
                    return h(Container, layer, child)
                default:
                    return h(Container)
            }
        }))
    }

    return h(Container, props, createLayer(layers))
}