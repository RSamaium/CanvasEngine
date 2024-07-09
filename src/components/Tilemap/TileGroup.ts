interface TileOptions {
    tilesetIndex?: number
    tileId: number
    x: number
    y: number
}

interface TilesGroupOptions {
    ignore?: boolean
    probability?: number
    baseHeight?: number
    baseWidth?: number
    rectMargin?: number
    baseOffsetX?: number
    baseOffsetY?: number
}

export class TileInfo {
    tilesetIndex?: number
    tileId: number
    flags: Map<string, any> = new Map()
    id: number = Math.random()

    constructor(obj: TileOptions) {
        this.tilesetIndex = obj.tilesetIndex ?? 0
        this.tileId = obj.tileId
    }

    addFlag(key: string, value: any) {
        this.flags.set(key, value)
    }
}

export class TilesGroup {
    tiles: (TileInfo | null)[][] = []
    width: number
    height: number
    ignore: boolean = false
    probability: number = 1
    baseHeight: number = 1
    baseWidth?: number
    baseOffsetX: number = 0
    baseOffsetY: number = 0
    rectMargin: number = 0

    constructor(tiles: TileOptions[], public tilesetIndex: number = 0, options: TilesGroupOptions = {}) {
        const pointsX = tiles.map(tile => tile.x)
        const pointsY = tiles.map(tile => tile.y)
        const offsetX = Math.min(...pointsX)
        const offsetY = Math.min(...pointsY)
        this.width = Math.max(...pointsX) - offsetX + 1
        this.height = Math.max(...pointsY) - offsetY + 1
        this.ignore = !!options.ignore
        this.probability = options.probability ?? 1
        this.baseHeight = options.baseHeight ?? 1
        this.baseWidth = options.baseWidth
        this.rectMargin = options.rectMargin ?? 0
        this.baseOffsetX = options.baseOffsetX ?? 0
        this.baseOffsetY = options.baseOffsetY ?? 0
        this.fillTiles()
        for (let tile of tiles) {
            this.addTile(tile.x - offsetX, tile.y - offsetY, tile)
        }
    }

    getRect(x: number, y: number): { minX: number, minY: number, maxX: number, maxY: number } {
        const margin = this.rectMargin
        return {
            minX: x - margin + this.baseOffsetX,
            minY: y - this.tilesBaseHeight - margin - this.baseOffsetY,
            maxX: x + this.tilesBaseWidth + margin,
            maxY: y + margin
        }
    }

    get tilesBase() {
        return this.tiles[this.tiles.length - 1]
    }

    get tilesBaseWidth(): number {
        return this.baseWidth ?? this.tilesBase.length
    }

    get tilesBaseHeight(): number {
        return this.baseHeight
    }

    forEach(cb: (tileInfo: TileInfo | null, x: number, y: number) => void) {
        for (let i = 0; i < this.tiles.length; i++) {
            for (let j = 0; j < this.tiles[i].length; j++) {
                cb(this.tiles[i][j], j, i)
            }
        }
    }

    find(cb: (tileInfo: TileInfo | null, x: number, y: number) => boolean): TileInfo | null {
        let found: TileInfo | null = null
        this.forEach((tileInfo, x, y) => {
            const bool = cb(tileInfo, x, y)
            if (bool) found = tileInfo
        })
        return found
    }

    getOffsetY(): number {
        const tilesBase = this.tilesBase
        let offset = 0
        this.forEach((tile, x, y) => {
            if (tile?.tileId == (tilesBase?.[0]?.tileId)) {
                offset = y
            }
        })
        return offset
    }

    fillTiles() {
        for (let i = 0; i < this.height; i++) {
            this.tiles[i] = []
            for (let j = 0; j < this.width; j++) {
                this.tiles[i][j] = null
            }
        }
    }

    shiftToTopLeft(): void {
        const matrix = this.tiles

        // Find the first non-undefined element and its position
        const foundFirst = () => {
            let firstElementRow = -1;
            let firstElementColumn = -1;

            for (let col = 0; col < matrix.length; col++) {
                if (!matrix[col]) matrix[col] = []
                for (let row = 0; row < matrix[col].length; row++) {
                    if (matrix[col][row] !== undefined) {
                        firstElementRow = row;
                        firstElementColumn = col;
                        return {
                            firstElementRow,
                            firstElementColumn
                        };
                    }
                }
            }

            return {
                firstElementRow,
                firstElementColumn
            }
        }

        const { firstElementRow, firstElementColumn } = foundFirst()

        // If no non-undefined element is found, return the original matrix
        if (firstElementRow === -1) {
            return;
        }

        // Shift the matrix elements
        const newMatrix: (TileInfo | null)[][] = [];
        for (let col = firstElementColumn; col < matrix.length; col++) {
            const newRow: (TileInfo | null)[] = [];
            for (let row = firstElementRow; row < matrix[col].length; row++) {
                newRow.push(matrix[col][row]);
            }
            newMatrix.push(newRow);
        }

        this.tiles = newMatrix;

        this.width = this.tiles[0].length
        this.height = this.tiles.length
    }

    addTile(x: number, y: number, tileOptions: TileOptions) {
        if (!this.tiles[y]) this.tiles[y] = []
        this.tiles[y][x] = new TileInfo(tileOptions)
    }

    addTileFlag(x: number, y: number, key: string, value: any) {
        this.getTile(x, y)?.addFlag(key, value)
    }

    getTile(x: number, y: number): TileInfo | null {
        return this.tiles[y]?.[x]
    }

    getTilesByFlag(key: string, value: any): { tileInfo: TileInfo, x: number, y: number }[] {
        const array: any = []
        this.forEach((tileInfo, x, y) => {
            const flag = tileInfo?.flags.get(key)
            if (flag && flag == value) {
                array.push({
                    tileInfo,
                    x,
                    y
                })
            }
        })
        return array
    }

    isTileBase(tileInfo: TileInfo): boolean {
        return !!this.tilesBase.find(tile => tile?.id == tileInfo.id)
    }
}