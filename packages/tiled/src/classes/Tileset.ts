import { TilesetTile } from "../types/Tile"
import { TiledTileset } from "../types/Tileset"
import { TiledProperties } from "./Properties"
import { Tile } from "./Tile"

export class Tileset extends TiledProperties {
    private cacheTileId: Map<number, Tile> = new Map()

    constructor(private tileset: TiledTileset) {
        super(tileset)
        Object.assign(this, tileset)
        this.margin = this.margin ?? 0
        this.spacing = this.spacing ?? 0
        // Handle both 'tiles' and 'tile' property names
        const tilesArray = tileset.tiles || (tileset as any).tile || []
        for (let tile of tilesArray) {
            this.addTile(tile)
        }
        Reflect.deleteProperty(this, 'tiles')
        Reflect.deleteProperty(this, 'tile')
    }

    addTile(tileObj: TilesetTile): Tile {
        const tile = new Tile(tileObj)
        this.cacheTileId.set(tile.id, tile)
        return tile
    }

    getTile(id: number): Tile | undefined {
        return this.cacheTileId.get(+id)
    }
}

export interface Tileset extends TiledTileset {}