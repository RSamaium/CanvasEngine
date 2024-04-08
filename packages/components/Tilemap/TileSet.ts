import { TiledTileset, Tileset as TiledTilesetClass } from "@rpgjs/tiled";
import { Assets, Rectangle, Texture } from "pixi.js";

export class TileSet extends TiledTilesetClass {
  public textures: Texture[] = [];
  private tileGroups = {};

  constructor(tileSet: TiledTileset) {
    super(tileSet);
  }

  loadGroup() {
    // for (let tile of this.tileset.tiles) {
    // }
  }

  /** @internal */
  async load(image: string) {
    const texture = await Assets.load(image);
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
          new Texture({
            source: texture.source,
            frame: new Rectangle(+x, +y, +this.tilewidth, +this.tileheight),
          })
        );
      }
    }
    this.loadGroup();
    return this;
  }
}
