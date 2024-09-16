import { ImageExtractor } from "./src/components/DrawMap";
import { Sprite, SpriteProps } from "./src/components/Sprite";
import { h, Canvas, Container, signal, Viewport } from "./src";
import "./src/directives";
import { effect } from "@signe/reactive";
import { animatedSignal } from "./src/engine/animation";

enum Direction {
  Down = "down",
  Left = "left",
  Right = "right",
  Up = "up",
}

enum Animation {
  Stand = "stand",
  Walk = "walk",
  Attack = "attack",
  Skill = "skill",
}

const x = animatedSignal(800);
const y = animatedSignal(600);
const direction = signal(Direction.Down);

const controls = signal({
  down: {
    repeat: true,
    bind: "down",
    trigger() {
      y.update((y) => y + 3);
      direction.set(Direction.Down);
    },
  },
  up: {
    repeat: true,
    bind: "up",
    trigger() {
      y.update((y) => y - 3);
      direction.set(Direction.Up);
    },
  },
  left: {
    repeat: true,
    bind: "left",
    trigger() {
      x.update((x) => x - 3);
      direction.set(Direction.Left);
    },
  },
  right: {
    repeat: true,
    bind: "right",
    trigger() {
      x.update((x) => x + 3);
      direction.set(Direction.Right);
    },
  },
});

const LPCSpritesheetPreset = () => {
  const frameY = (direction: Direction) => {
    return {
      [Direction.Down]: 2,
      [Direction.Left]: 1,
      [Direction.Right]: 3,
      [Direction.Up]: 0,
    }[direction];
  };

  const stand = (direction: Direction) => [
    { time: 0, frameX: 0, frameY: frameY(direction) },
  ];
  const anim = (
    direction: Direction,
    framesWidth: number,
    speed: number = 5
  ) => {
    const array: any = [];
    for (let i = 0; i < framesWidth; i++) {
      array.push({ time: i * speed, frameX: i, frameY: frameY(direction) });
    }
    return array;
  };

  const ratio = 1.5;

  return {
    id: "hero",
    image: "./hero_2.png",
    width: 1248,
    height: 2016,
    opacity: 1,
    rectWidth: 64 * ratio,
    rectHeight: 64 * ratio,
    spriteRealSize: {
      width: 48 * ratio,
      height: 52 * ratio,
    },
    framesWidth: 6,
    framesHeight: 4,
    textures: {
      [Animation.Stand]: {
        offset: {
          x: 0,
          y: 512 * ratio,
        },
        animations: ({ direction }) => [stand(direction)],
      },
      [Animation.Walk]: {
        offset: {
          x: 0,
          y: 512 * ratio,
        },
        framesWidth: 9,
        framesHeight: 4,
        animations: ({ direction }) => [anim(direction, 9)],
      },
      [Animation.Attack]: {
        offset: {
          x: 0,
          y: 768 * ratio,
        },
        framesWidth: 6,
        framesHeight: 4,
        animations: (direction: Direction) => [anim(direction, 6, 3)],
      },
      [Animation.Skill]: {
        framesWidth: 7,
        framesHeight: 4,
        animations: (direction: Direction) => [anim(direction, 7, 3)],
      },
    },
  };
};

h(
  Canvas,
  {
    width: "100%",
    height: "100%",
    antialias: true,
  },
  h(
    Viewport,
    {
      worldHeight: 2000,
      worldWidth: 2000,
      clamp: {
        direction: "all",
      }
    },
    h(ImageExtractor, {
      imageSource: "tileset.png",
      tileData: "tilesetData.json",
      objectLayer() {
        return h(Sprite, {
          sheet: {
            definition: LPCSpritesheetPreset(),
            params: {
              direction,
            },
          },
          x,
          y,
          controls,
          viewportFollow: true,
        });
      },
    })
  )
);
