import { ImageMap } from "./src/components/DrawMap";
import { Sprite, SpriteProps } from "./src/components/Sprite";
import {
  h,
  Canvas,
  Container,
  signal,
  Viewport,
  ParticlesEmitter,
  Graphics,
} from "./src";
import "./src/directives";
import { effect } from "@signe/reactive";
import { animatedSignal } from "./src/engine/animation";
import { bootstrapCanvas } from "./src/engine/bootstrap";
import {
  Assets,
  BlurFilter,
  Texture,
  BLEND_MODES,
  ColorMatrixFilter,
  Filter,
} from "pixi.js";
import * as PIXI from "pixi.js";
import * as filters from "pixi-filters";
import { PointLight } from "@pixi/lights";
import { Stage } from "@pixi/layers";
import { Joystick } from "./src/composition/Joystick";

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
const speed = 5;

const controls = signal({
  down: {
    repeat: true,
    bind: ["down", 'bottom_right', 'bottom_left'],
    trigger() {
      y.update((y) => y + speed);
      direction.set(Direction.Down);
    },
  },
  up: {
    repeat: true,
    bind: ['up', 'top_left', 'top_right'],
    trigger() {
      y.update((y) => y - speed);
      direction.set(Direction.Up);
    },
  },
  left: {
    repeat: true,
    bind: "left",
    trigger() {
      x.update((x) => x - speed);
      direction.set(Direction.Left);
    },
  },
  right: {
    repeat: true,
    bind: "right",
    trigger() {
      x.update((x) => x + speed);
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

const scale = animatedSignal(1);

const minScale = 1;
const maxScale = 1.2; // Reduced max scale for subtler effect
const scintillationSpeed = 0.001; // Significantly reduced for slower scintillation

const animate = () => {
  // Use time-based animation for smoother, slower scintillation
  const time = Date.now() * scintillationSpeed;

  // Combine multiple sine waves for a more natural, less predictable effect
  const scintillationFactor =
    (Math.sin(time) + Math.sin(time * 1.3) + Math.sin(time * 0.7)) / 3;

  // Map the scintillation factor to the scale range
  const newScale =
    minScale + (maxScale - minScale) * (scintillationFactor * 0.5 + 0.5);

  scale.update(() => newScale);

  requestAnimationFrame(animate);
};

animate();

const mapWidth = 3000;
const mapHeight = 3000;
const filter = new filters.GodrayFilter({
  gain: 0.5,
  lacunarity: 2.5,
  angle: 30,
  parallel: true,
  center: [400, 300],
});

const updateFilter = () => {
  filter.time += Math.random() * 0.01;
  filter.center = [0, 0];
  requestAnimationFrame(updateFilter);
};

updateFilter();

const map = h(ImageMap, {
  id: "map",
  imageSource: "tileset.png",
  tileData: "tilesetData.json",
  // filters: [filter],
  // filterArea: {
  //   x: 0,
  //   y: 0,
  //   width: 3000,
  //   height: 3000,
  // },
  objects() {
    return [
      h(Sprite, {
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
        zIndex: y,
        pointerdown() {
          console.log("click");
        },
      }),
    ];
  },
});

const darknessFilter = new filters.AdvancedBloomFilter({
  threshold: 0.5,
  bloomScale: 1.5,
  brightness: 5,
  blur: 1,
  quality: 5,
});

const darkness = h(
  Container,
  {
    // blendMode: 'erase'
  },

  h(Graphics, {
    id: "lightMask",

    //  blendMode: 'add',
    alpha: 0.5,
    draw(g) {
      // Fonction pour créer un trou de lumière
      const createLightHole = (x, y, radius) => {
        g.circle(x, y, radius).fill("white");
      };

      createLightHole(800, 600, 100);
      createLightHole(500, 500, 50);
      createLightHole(1500, 1500, 75);
    },
  })
);

// const stage = new Stage()

// const light = new PointLight(0xffffff, 1);
// light.x = 1000;
// light.y = 1000;
// stage.addChild(light)

const root = h(
  Canvas,
  {
    width: "100%",
    height: "100%",
    antialias: true,
    class: "bg-red-500",
    background: "red",
  },
  h(Viewport, {
    worldHeight: 2000,
    worldWidth: 2000,
    clamp: {
      direction: "all",
    }
  }, map),
  h(Joystick, {
    // outer: "joystick.png",
    // inner: "joystick-handle.png",
    x: 350,
    y: 350,
    onChange(settings) {
      console.log(settings);
    },
  })
);

bootstrapCanvas(document.getElementById("root"), root);
