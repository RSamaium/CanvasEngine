import { ImageExtractor } from "./src/components/DrawMap";
import { Sprite, SpriteProps } from "./src/components/Sprite";
import { h, Canvas, Container } from "./src";

h(
  Canvas,
  {
    width: 800,
    height: 600,
  },
  h(ImageExtractor, {
    imageSource: "tileset.png",
    tileData: "tilesetData.json",
  }),
  h(Sprite, {
    image: "tileset.png",
    rectangle: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    },
    click: () => {
      console.log("click");
    },
  })
);
