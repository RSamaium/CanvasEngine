import { computed, effect, Signal } from "@signe/reactive";
import {
  Assets,
  Container,
  Sprite as PixiSprite,
  Rectangle,
  Texture,
} from "pixi.js";
import { Subscription } from "rxjs";
import {
  Element,
  createComponent,
  registerComponent,
} from "../engine/reactive";
import { arrayEquals, isFunction } from "../engine/utils";
import { DisplayObject } from "./DisplayObject";
import {
  AnimationFrames,
  FrameOptions,
  SpritesheetOptions,
  TextureOptions,
  TransformOptions,
} from "./types/Spritesheet";
import { ComponentFunction } from "../engine/signal";
import { DisplayObjectProps } from "./types/DisplayObject";
import { AnimatedState, isAnimatedSignal } from "../engine/animation";

const log = console.log;

type Image = { image: string };

type TextureOptionsMerging = TextureOptions & {
  spriteWidth: number;
  spriteHeight: number;
  sound?: string;
} & Image &
  TransformOptions;

type FrameOptionsMerging = TextureOptionsMerging & FrameOptions;
type SpritesheetOptionsMerging = TextureOptionsMerging & SpritesheetOptions;
type TransformOptionsAsArray = Pick<
  TransformOptions,
  "anchor" | "scale" | "skew" | "pivot"
>;

type AnimationDataFrames = {
  sprites: FrameOptionsMerging[];
  frames: Texture[][];
  name: string;
  animations: AnimationFrames;
  params: any[];
  data: TextureOptionsMerging;
};

export enum StandardAnimation {
  Stand = "stand",
  Walk = "walk",
}

export class CanvasSprite extends DisplayObject(PixiSprite) {
  public hitbox: { w: number; h: number };
  public applyTransform: (
    frame: FrameOptionsMerging,
    data: TextureOptionsMerging,
    spritesheet: SpritesheetOptionsMerging
  ) => Partial<FrameOptionsMerging>;
  private spritesheet: SpritesheetOptionsMerging;
  private currentAnimation: AnimationDataFrames | null = null;
  private time: number = 0;
  private frameIndex: number = 0;
  private animations: Map<string, AnimationDataFrames> = new Map();
  private subscriptionTick: Subscription;
  private subscriptionSheet: Subscription[] = [];
  private sheetParams: any = {};
  private sheetCurrentAnimation: string = StandardAnimation.Stand;
  private isMoving = false;
  private newX = 0;
  private newY = 0;
  onFinish: () => void;

  private currentAnimationContainer: Container | null = null;

  private async createTextures(
    options: Required<TextureOptionsMerging>
  ): Promise<Texture[][]> {
    const { width, height, framesHeight, framesWidth, image, offset } = options;
    const texture = await Assets.load(image);
    const spriteWidth = options.spriteWidth;
    const spriteHeight = options.spriteHeight;
    const frames: Texture[][] = [];
    const offsetX = (offset && offset.x) || 0;
    const offsetY = (offset && offset.y) || 0;
    for (let i = 0; i < framesHeight; i++) {
      frames[i] = [];
      for (let j = 0; j < framesWidth; j++) {
        const rectX = j * spriteWidth + offsetX;
        const rectY = i * spriteHeight + offsetY;
        if (rectY > height) {
          throw log(
            `Warning, there is a problem with the height of the "${this.id}" spritesheet. When cutting into frames, the frame exceeds the height of the image.`
          );
        }
        if (rectX > width) {
          throw log(
            `Warning, there is a problem with the width of the "${this.id}" spritesheet. When cutting into frames, the frame exceeds the width of the image.`
          );
        }
        frames[i].push(
          new Texture({
            source: texture.source,
            frame: new Rectangle(rectX, rectY, spriteWidth, spriteHeight),
          })
        );
      }
    }
    return frames;
  }

  private async createAnimations() {
    const { textures } = this.spritesheet;
    if (!textures) {
      return;
    }
    for (let animationName in textures) {
      const props: (keyof TextureOptionsMerging)[] = [
        "width",
        "height",
        "framesHeight",
        "framesWidth",
        "rectWidth",
        "rectHeight",
        "offset",
        "image",
        "sound",
      ];
      const parentObj = props.reduce(
        (prev, val) => ({ ...prev, [val]: this.spritesheet[val] }),
        {}
      );
      const optionsTextures: TextureOptionsMerging = {
        ...parentObj,
        ...textures[animationName],
      } as any;
      const {
        rectWidth,
        width = 0,
        framesWidth = 1,
        rectHeight,
        height = 0,
        framesHeight = 1,
      } = optionsTextures;
      optionsTextures.spriteWidth = rectWidth ? rectWidth : width / framesWidth;
      optionsTextures.spriteHeight = rectHeight
        ? rectHeight
        : height / framesHeight;
      this.animations.set(animationName, {
        frames: await this.createTextures(
          optionsTextures as Required<TextureOptionsMerging>
        ),
        name: animationName,
        animations: textures[animationName].animations,
        params: [],
        data: optionsTextures,
        sprites: [],
      });
    }
  }

  async onMount(params: Element<CanvasSprite>) {
    const { props, propObservables } = params;
    const tick: Signal = props.context.tick;
    const sheet = props.sheet ?? {};
    if (sheet?.onFinish) {
      this.onFinish = sheet.onFinish;
    }
    this.subscriptionTick = tick.observable.subscribe((value) => {
      this.update(value);
    });
    if (props.sheet?.definition) {
      this.spritesheet = props.sheet.definition;
      await this.createAnimations();
    }
    if (sheet.params) {
      for (let key in propObservables?.sheet["params"]) {
        const value = propObservables?.sheet["params"][key] as Signal;
        this.subscriptionSheet.push(
          value.observable.subscribe((value) => {
            if (this.animations.size == 0) return;
            this.play(this.sheetCurrentAnimation, [{ [key]: value }]);
          })
        );
      }
    }

    const isMoving = computed(() => {
      const { x, y } = propObservables ?? {};
      if (!x || !y) return false;
      const isMovingX = isAnimatedSignal(x) && 
        x.animatedState().current !== x.animatedState().end;
      const isMovingY = isAnimatedSignal(y) && 
        y.animatedState().current !== y.animatedState().end;
      return isMovingX || isMovingY;
    });

    effect(() => {
      const _isMoving = isMoving();

      if (!this.isMounted) return;

      if (_isMoving) {
        this.sheetCurrentAnimation = StandardAnimation.Walk;
      } else {
        this.sheetCurrentAnimation = StandardAnimation.Stand;
      }

      this.play(this.sheetCurrentAnimation, [this.sheetParams]);
    });

    super.onMount(params);
  }

  async onUpdate(props) {
    super.onUpdate(props);

    const sheet = props.sheet;
    if (sheet?.params) this.sheetParams = sheet?.params;

    if (sheet?.playing && this.isMounted) {
      this.sheetCurrentAnimation = sheet?.playing;
      this.play(this.sheetCurrentAnimation, [this.sheetParams]);
    }

    if (props.scaleMode) this.baseTexture.scaleMode = props.scaleMode;
    else if (props.image) {
      if (props.rectangle === undefined) {
        this.texture = await Assets.load(props.image);
      } else {
        const { x, y, width, height } = props.rectangle;
        const texture = await Assets.load(props.image);
        this.texture = new Texture({
          source: texture.source,
          frame: new Rectangle(x, y, width, height),
        });
      }
    }
  }

  onDestroy(): void {
    super.onDestroy();
    this.subscriptionSheet.forEach((sub) => sub.unsubscribe());
    this.subscriptionTick.unsubscribe();
    if (this.currentAnimationContainer && this.parent instanceof Container) {
      this.parent.removeChild(this.currentAnimationContainer);
    }
  }

  has(name: string): boolean {
    return this.animations.has(name);
  }

  get(name: string): AnimationDataFrames {
    return this.animations.get(name) as AnimationDataFrames;
  }

  isPlaying(name?: string): boolean {
    if (!name) return !!this.currentAnimation;
    if (this.currentAnimation == null) return false;
    return this.currentAnimation.name == name;
  }

  stop() {
    this.currentAnimation = null;
    this.destroy();
  }

  play(name: string, params: any[] = []) {
    const animParams = this.currentAnimation?.params;

    if (this.isPlaying(name) && arrayEquals(params, animParams || [])) return;

    const animation = this.get(name);

    if (!animation) {
      throw new Error(
        `Impossible to play the ${name} animation because it doesn't exist on the "${this.spritesheet?.id}" spritesheet`
      );
    }

    const cloneParams = structuredClone(params);

    this.removeChildren();
    animation.sprites = [];
    this.currentAnimation = animation;
    this.currentAnimation.params = cloneParams;
    this.time = 0;
    this.frameIndex = 0;
    let animations: any = animation.animations;
    animations = isFunction(animations)
      ? (animations as Function)(...cloneParams)
      : animations;

    this.currentAnimationContainer = new Container();

    for (let container of animations as FrameOptionsMerging[][]) {
      const sprite = new PixiSprite();
      for (let frame of container) {
        this.currentAnimation.sprites.push(frame);
      }
      this.currentAnimationContainer.addChild(sprite);
    }

    const sound = this.currentAnimation.data.sound;

    if (sound) {
      //RpgSound.get(sound).play()
    }

    // Updates immediately to avoid flickering
    this.update({
      deltaRatio: 1,
    });
  }

  update({ deltaRatio }) {
    if (!this.isPlaying() || !this.currentAnimation || !this.currentAnimationContainer) return;

    const { frames, sprites, data } = this.currentAnimation;
    let frame = sprites[this.frameIndex];
    const nextFrame = sprites[this.frameIndex + 1];
    

    for (let _sprite of this.currentAnimationContainer.children) {
      const sprite = _sprite as PixiSprite;

      if (!frame || frame.frameY == undefined || frame.frameX == undefined) {
        continue;
      }

      this.texture = frames[frame.frameY][frame.frameX];

      const getVal = <T extends keyof TransformOptions>(
        prop: T
      ): TransformOptions[T] | undefined => {
        return frame[prop] ?? data[prop] ?? this.spritesheet[prop];
      };

      const applyTransform = <T extends keyof TransformOptionsAsArray>(
        prop: T
      ): void => {
        const val = getVal<T>(prop);
        if (val) {
          sprite[prop as string].set(...val!);
        }
      };

      function applyTransformValue<T extends keyof TransformOptions>(prop: T);
      function applyTransformValue<T extends keyof TransformOptions>(
        prop: string,
        alias: T
      );
      function applyTransformValue<T extends keyof TransformOptions>(
        prop: T,
        alias?: T
      ): void {
        const optionProp = alias || prop;
        const val = getVal<T>(optionProp);
        if (val !== undefined) {
          sprite[prop as string] = val;
        }
      }

      if (this.applyTransform) {
        frame = {
          ...frame,
          ...this.applyTransform(frame, data, this.spritesheet),
        };
      }

      const realSize = getVal<"spriteRealSize">("spriteRealSize");
      const heightOfSprite =
        typeof realSize == "number" ? realSize : realSize?.height;
      const widthOfSprite =
        typeof realSize == "number" ? realSize : realSize?.width;

      const applyAnchorBySize = () => {
        if (heightOfSprite && this.hitbox) {
          const { spriteWidth, spriteHeight } = data;
          const w = (spriteWidth - this.hitbox.w) / 2 / spriteWidth;
          const gap = (spriteHeight - heightOfSprite) / 2;
          const h = (spriteHeight - this.hitbox.h - gap) / spriteHeight;
          sprite.anchor.set(w, h);
        }
      };

      if (frame.sound) {
        //RpgSound.get(frame.sound).play()
      }

      applyAnchorBySize();

      applyTransform("anchor");
      applyTransform("scale");
      applyTransform("skew");
      applyTransform("pivot");

      applyTransformValue("alpha", "opacity");
      applyTransformValue("x");
      applyTransformValue("y");
      applyTransformValue("angle");
      applyTransformValue("rotation");
      applyTransformValue("visible");
    }

    if (!nextFrame) {
      this.time = 0;
      this.frameIndex = 0;
      if (this.onFinish && sprites.length > 1) this.onFinish();
      return;
    }

    this.time += deltaRatio ?? 1;

    if (this.time >= nextFrame.time) {
      this.frameIndex++;
    }
  }
}

export interface CanvasSprite extends PixiSprite {}

registerComponent("Sprite", CanvasSprite);

// Define the props interface for Sprite
export interface SpriteProps extends DisplayObjectProps {
  sheet?: {
    definition?: SpritesheetOptionsMerging;
    playing?: string;
    params?: any;
    onFinish?: () => void;
  };
  scaleMode?: number;
  image?: string;
  rectangle?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  context?: {
    tick: Signal;
  };
}

export interface SpritePropsWithImage extends Omit<SpriteProps, "sheet"> {
  image: string;
  rectangle?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SpritePropsWithSheet
  extends Omit<SpriteProps, "image" | "rectangle"> {
  sheet: {
    definition: SpritesheetOptionsMerging;
    playing?: string;
    params?: any;
    onFinish?: () => void;
  };
}

export type SpritePropTypes = SpritePropsWithImage | SpritePropsWithSheet;

// Update the Sprite function to use the props interface
export const Sprite: ComponentFunction<SpritePropTypes> = (props) => {
  return createComponent("Sprite", props);
};
