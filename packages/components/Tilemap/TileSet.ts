import { TiledTileset, Tileset as TiledTilesetClass } from '@rpgjs/tiled'
import { Texture, BaseTexture, Rectangle } from 'pixi.js'

export class TileSet extends TiledTilesetClass {
    private baseTexture: BaseTexture
    public textures: Texture[] = []
    private tileGroups = {}

    constructor(tileSet: TiledTileset) {
        super(tileSet)
    }

    loadGroup() {
        // for (let tile of this.tileset.tiles) {
           
        // }
    }

    /** @internal */
    load(image: string) {
        this.baseTexture = Texture.from(image).baseTexture
        for (
            let y = this.margin;
            y < this.image.height;
            y += this.tileheight + this.spacing
        ) {
            for (
                let x = this.margin;
                x < this.image.width;
                x += this.tilewidth + this.spacing
            ) {
                this.textures.push(
                    new Texture(
                        this.baseTexture,
                        new Rectangle(+x, +y, +this.tilewidth, +this.tileheight)
                    )
                )
            }
        }
        this.loadGroup()
        return this
    }
}