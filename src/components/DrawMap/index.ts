import { effect, signal } from "@signe/reactive";
import { loop } from "../../engine/reactive";
import { h } from "../../engine/signal";
import { useProps } from "../../hooks/useProps";
import { Container } from "../Container";
import { Sprite } from "../Sprite";

interface TileData {
  id: number;
  rect: [number, number, number, number];
  drawIn: [number, number];
  layerIndex: number;
}

export function ImageExtractor(props) {
  const { imageSource, tileData } = useProps(props);
  const objectLayer = props.objectLayer;
  const tiles = signal<TileData[]>([]);

  effect(() => {
    fetch(tileData())
      .then((response) => response.json())
      .then((data) => tiles.set(data));
  });

  const createLayeredTiles = () => {
    const layers = [
      createTileLayer(0),
      h(Container, {}, objectLayer?.()),
      createTileLayer(1),
      createTileLayer(2),
    ];

    return h(Container, {}, ...layers);
  };

  const createTileLayer = (layerIndex: number) => {
    return h(
      Container,
      {},
      loop(tiles, (tile) => {
        tile.layerIndex ||= 0;
        if (tile.layerIndex !== layerIndex) return null;

        const [x, y, width, height] = tile.rect;
        const [drawX, drawY] = tile.drawIn;

        return h(Sprite, {
          image: imageSource(),
          x: drawX,
          y: drawY,
          rectangle: { x, y, width, height },
        });
      })
    );
  };

  return createLayeredTiles();
}
