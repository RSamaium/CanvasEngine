import { TilesetTile } from "../types/Tile";
import { TileGid } from "./Gid";

type TileInfo = TilesetTile & { gid?: number, index: number, layerIndex?: number }

export class Tile extends TileGid {
    index: number

    constructor(public tile: TileInfo | { gid: number }) {
        super(tile)
        // Store the properties before Object.assign to avoid overwriting them
        const preservedProperties = this.properties
        Reflect.deleteProperty(tile, 'gid')
        Object.assign(this, tile)
        // Restore properties if they were overwritten by Object.assign
        if (preservedProperties && Object.keys(preservedProperties).length > 0) {
            this.properties = { ...preservedProperties, ...this.properties }
        }
    } 
}

export interface Tile extends TileInfo {}