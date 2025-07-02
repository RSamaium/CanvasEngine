import { computed, effect, isSignal, Signal } from "@signe/reactive";
import {
  Application,
  Assets,
  Container,
  Texture,
  GifSprite,
} from "pixi.js";
import { Subscription } from "rxjs";
import {
  Element,
  createComponent,
  isElement,
  registerComponent,
} from "../engine/reactive";
import { DisplayObject } from "./DisplayObject";
import { ComponentFunction } from "../engine/signal";
import { DisplayObjectProps } from "./types/DisplayObject";

export class CanvasGif extends DisplayObject(GifSprite) {
  private app: Application | null = null;
  private subscriptionTick: Subscription | null = null;

  get renderer() {
    return this.app?.renderer;
  }

  async onMount(params: Element<CanvasGif>) {
    const { props } = params;
    this.app = props.context.app();
    
    super.onMount(params);
  }

  async onUpdate(props) {
    if (this.destroyed) return;
    super.onUpdate(props);

    // Load GIF if source is provided
    if (props.src && props.src !== this.fullProps.src) {
      await this.loadGif(props.src);
    }

    // Update animation properties
    if (props.animationSpeed !== undefined) {
      this.animationSpeed = props.animationSpeed;
    }
    
    if (props.loop !== undefined) {
      this.loop = props.loop;
    }

    if (props.autoPlay !== false && !this.playing) {
      this.play();
    }

    if (props.autoPlay === false && this.playing) {
      this.stop();
    }

    // Set event handlers
    if (props.onComplete) {
      this.onComplete = props.onComplete;
    }

    if (props.onFrameChange) {
      this.onFrameChange = props.onFrameChange;
    }

    if (props.onLoop) {
      this.onLoop = props.onLoop;
    }

    // Handle specific frame control
    if (props.currentFrame !== undefined && props.currentFrame !== this.currentFrame) {
      if (props.playing !== false) {
        this.gotoAndPlay(props.currentFrame);
      } else {
        this.gotoAndStop(props.currentFrame);
      }
    }

    // Handle play/stop commands
    if (props.playing === true && !this.playing) {
      this.play();
    } else if (props.playing === false && this.playing) {
      this.stop();
    }
  }

  private async loadGif(src: string) {
    try {
      // Load GIF using GifSprite.fromURL
      if (src.startsWith('http') || src.startsWith('/') || src.startsWith('./')) {
        const gifData = await GifSprite.fromURL(src);
        this.copyGifData(gifData);
      } else {
        // Try to load as buffer first
        try {
          const buffer = await Assets.load(src);
          if (buffer instanceof ArrayBuffer) {
            const gifData = await GifSprite.fromBuffer(buffer);
            this.copyGifData(gifData);
          } else {
            const gifData = await GifSprite.fromURL(src);
            this.copyGifData(gifData);
          }
        } catch {
          const gifData = await GifSprite.fromURL(src);
          this.copyGifData(gifData);
        }
      }

      // Set initial properties
      const props = this.fullProps;
      if (props.animationSpeed !== undefined) {
        this.animationSpeed = props.animationSpeed;
      }
      
      if (props.loop !== undefined) {
        this.loop = props.loop;
      }

      if (props.autoPlay !== false) {
        this.play();
      }

    } catch (error) {
      console.error('Error loading GIF:', error);
    }
  }

  private copyGifData(source: GifSprite) {
    // Copy properties from the loaded GIF to this instance
    if (source.texture) {
      this.texture = source.texture;
    }
    if ((source as any).textures) {
      (this as any).textures = (source as any).textures;
    }
    if (source.totalFrames !== undefined) {
      (this as any).totalFrames = source.totalFrames;
    }
    if (source.animationSpeed !== undefined) {
      (this as any).animationSpeed = source.animationSpeed;
    }
    if (source.loop !== undefined) {
      (this as any).loop = source.loop;
    }
    if (source.currentFrame !== undefined) {
      (this as any).currentFrame = source.currentFrame;
    }
    if ((source as any).playing !== undefined) {
      (this as any).playing = (source as any).playing;
    }
  }

  async onDestroy(parent: Element, afterDestroy: () => void): Promise<void> {
    const _afterDestroy = async () => {
      if (this.subscriptionTick) {
        this.subscriptionTick.unsubscribe();
      }

      // Stop animation if playing
      if (this.playing) {
        this.stop();
      }

      if (afterDestroy) {
        afterDestroy();
      }
    };
    await super.onDestroy(parent, _afterDestroy);
  }
}

export interface GifProps extends DisplayObjectProps {
  src: string;
  animationSpeed?: number;
  loop?: boolean;
  autoPlay?: boolean;
  playing?: boolean;
  currentFrame?: number;
  onComplete?: () => void;
  onFrameChange?: (frame: number) => void;
  onLoop?: () => void;
  context?: {
    app: () => Application;
  };
}

registerComponent("Gif", CanvasGif);

export const Gif: ComponentFunction<GifProps> = (props) => {
  return createComponent("Gif", props);
};