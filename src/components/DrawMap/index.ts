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

export function ImageMap(props) {
  const { imageSource, tileData } = useProps(props);
  const tiles = signal<TileData[]>([]);

  effect(async () => {
    const data = await fetch(tileData()).then((response) => response.json());
    const objects = data;
    if (props.objects) {
      objects.push(...props.objects(data));
    }
    tiles.set(objects);
  });

  const createLayeredTiles = () => {
    const layers = [createTileLayer(0), createTileLayer(1, true), createTileLayer(2)];

    return h(Container, {}, ...layers);
  };

  const createTileLayer = (layerIndex: number, sortableChildren = false) => {
    return h(
      Container,
      {
        sortableChildren
      },
      loop(tiles, (object) => {

        if (object.tag && layerIndex == 1) {
            return object
        }

        object.layerIndex ||= 1;
        if (object.layerIndex !== layerIndex) return null;

        const [x, y, width, height] = object.rect;
        const [drawX, drawY] = object.drawIn;

        return h(Sprite, {
          image: imageSource(),
          x: drawX,
          y: drawY,
          rectangle: { x, y, width, height },
          zIndex: drawY + height - 70,
        });
      })
    );
  };

  return createLayeredTiles();
}
