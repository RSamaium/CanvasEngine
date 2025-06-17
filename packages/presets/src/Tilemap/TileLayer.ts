import {
  CompositeTilemap,
  POINT_STRUCT_SIZE,
  Tilemap,
  settings,
} from "@canvasengine/tilemap";
import { Layer, Tile as TileClass } from "@canvasengine/tiled";
import {
  createComponent,
  registerComponent,
  DisplayObject,
  Signal,
} from "canvasengine";
import { Tile } from "./Tile";
import { TileSet } from "./TileSet";
import { Subscription } from "rxjs";

settings.use32bitIndex = true;

export class CanvasTileLayer extends DisplayObject(CompositeTilemap) {
  private _tiles: any = {};
  tiles: (TileClass | null)[];
  private _layer: any; // TODO: fix this, remove any. replace with Layer
  private frameTile: number = 0;
  private frameRateAnimation: number = 10;
  private subscriptionTick: Subscription;

  static findTileSet(gid: number, tileSets: TileSet[]) {
    let tileset: TileSet | undefined;
    for (let i = tileSets.length - 1; i >= 0; i--) {
      tileset = tileSets[i];
      if (tileset.firstgid && tileset.firstgid <= gid) {
        break;
      }
    }
    return tileset;
  }

  /** @internal */
  createTile(x: number, y: number, options: any = {}): Tile | undefined {
    const { real, filter } = options;
    const { tilewidth, tileheight, width } = this._layer;
    if (real) {
      x = Math.floor(x / tilewidth);
      y = Math.floor(y / tileheight);
    }
    const i = x + y * width;
    const tiledTile = this._layer.getTileByIndex(i);

    if (!tiledTile || (tiledTile && tiledTile.gid == 0)) return;

    const tileset = CanvasTileLayer.findTileSet(tiledTile.gid, this.tileSets);

    if (!tileset) return;

    const tile = new Tile(tiledTile, tileset);

    tile.x = x * tilewidth;
    tile.y = y * tileheight + (tileheight - tile.texture.height);

    tile._x = x;
    tile._y = y;

    if (tileset.tileoffset) {
      tile.x += tileset.tileoffset.x ?? 0;
      tile.y += tileset.tileoffset.y ?? 0;
    }

    if (filter) {
      const ret = filter(tile);
      if (!ret) return;
    }

    return tile;
  }

  private _addFrame(tile: Tile, x: number, y: number) {
    const frame = this.tile(tile.texture, tile.x, tile.y, {
      rotate: tile.texture.rotate,
    });
    // const pb = this.pointsBuf
    // if (!pb) return null
    // tile.pointsBufIndex = pb.length - POINT_STRUCT_SIZE
    tile.setAnimation(frame);
    this._tiles[x + ";" + y] = tile;
  }

  async onMount(args) {
    const { props } = args;

    this.tileSets = props.tilesets;
    this._layer = new Layer(
      {
        ...props,
      },
      this.tileSets
    );

    const tick: Signal = props.context.tick;

    this.subscriptionTick = tick.observable.subscribe(({ value }) => {
        if (value.frame % this.frameRateAnimation == 0) {
            this.tileAnim = [this.frameTile, this.frameTile];
            this.frameTile++
         }
    });

    super.onMount(args);
  }

  onUpdate(props) {
    super.onUpdate(props);
    if (!this.isMounted) return;
    if (props.tileheight) this._layer.tileheight = props.tileheight;
    if (props.tilewidth) this._layer.tilewidth = props.tilewidth;
    if (props.width) this._layer.width = props.width;
    if (props.height) this._layer.height = props.height;
    if (props.parallaxX) this._layer.parallaxX = props.parallaxx;
    if (props.parallaxY) this._layer.parallaxY = props.parallaxy;

    this.removeChildren();

    for (let y = 0; y < this._layer.height; y++) {
      for (let x = 0; x < this._layer.width; x++) {
        const tile = this.createTile(x, y);
        if (tile) {
          this._addFrame(tile, x, y);
        }
      }
    }
  }

  async onDestroy(parent: any) {
    this.subscriptionTick.unsubscribe();
    await super.onDestroy(parent);
  }
}

// @ts-ignore
export interface CanvasTileLayer extends CompositeTilemap {}

registerComponent("CompositeTileLayer", CanvasTileLayer);

export function CompositeTileLayer(props) {
  return createComponent("CompositeTileLayer", props);
}
