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
}

export function ImageExtractor(props) {
  const { imageSource, tileData } = useProps(props);
  const tiles = signal<TileData[]>([]);

  effect(() => {
    // Assuming tileData is a string path to a JSON file
    fetch(tileData())
      .then((response) => response.json())
      .then((data) => tiles.set(data));
  });

  const createTiles = () => {
    return h(
      Container,
      {},
      loop(tiles, (tile) => {
        const [x, y, width, height] = tile.rect;
        const [drawX, drawY] = tile.drawIn;

        return h(Sprite, {
          sheet: {
            image: imageSource(),
            x: drawX,
            y: drawY,
            rectangle: {
              x,
              y,
              width,
              height,
            },
          },
        });
      })
    );
  };

  return createTiles();
}
