import { computed, effect, isSignal, Signal } from "@signe/reactive";
import {
  Application,
  Assets,
  Container,
  Texture,
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

// GIF sprite interfaces - supports both AnimatedGIF and GifSprite from @pixi/gif plugin
interface GifSpriteBase extends Container {
  play(): void;
  stop(): void;
  gotoAndPlay?(frame: number): void;
  gotoAndStop?(frame: number): void;
  duration?: number;
  currentFrame?: number;
  totalFrames?: number;
  animationSpeed?: number;
  loop?: boolean;
  playing?: boolean;
  onComplete?: () => void;
  onFrameChange?: (frame: number) => void;
  onLoop?: () => void;
}

interface GifSpriteStatic {
  fromBuffer?(buffer: ArrayBuffer): Promise<GifSpriteBase>;
  fromURL?(url: string): Promise<GifSpriteBase>;
  new?(texture?: any): GifSpriteBase;
}

export class CanvasGif extends DisplayObject(Container) {
  private gifSprite: GifSpriteBase | null = null;
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
    if (this.gifSprite) {
      if (props.animationSpeed !== undefined && this.gifSprite.animationSpeed !== undefined) {
        this.gifSprite.animationSpeed = props.animationSpeed;
      }
      
      if (props.loop !== undefined && this.gifSprite.loop !== undefined) {
        this.gifSprite.loop = props.loop;
      }

      if (props.autoPlay !== false && this.gifSprite.playing !== undefined && !this.gifSprite.playing) {
        this.gifSprite.play();
      }

      if (props.autoPlay === false && this.gifSprite.playing !== undefined && this.gifSprite.playing) {
        this.gifSprite.stop();
      }

      // Set event handlers
      if (props.onComplete) {
        this.gifSprite.onComplete = props.onComplete;
      }

      if (props.onFrameChange) {
        this.gifSprite.onFrameChange = props.onFrameChange;
      }

      if (props.onLoop) {
        this.gifSprite.onLoop = props.onLoop;
      }

      // Handle specific frame control
      if (props.currentFrame !== undefined && this.gifSprite.currentFrame !== undefined && props.currentFrame !== this.gifSprite.currentFrame) {
        if (props.playing !== false && this.gifSprite.gotoAndPlay) {
          this.gifSprite.gotoAndPlay(props.currentFrame);
        } else if (this.gifSprite.gotoAndStop) {
          this.gifSprite.gotoAndStop(props.currentFrame);
        }
      }

      // Handle play/stop commands
      if (props.playing === true && this.gifSprite.playing !== undefined && !this.gifSprite.playing) {
        this.gifSprite.play();
      } else if (props.playing === false && this.gifSprite.playing !== undefined && this.gifSprite.playing) {
        this.gifSprite.stop();
      }
    }
  }

  private async loadGif(src: string) {
    try {
      // Remove existing gif if any
      if (this.gifSprite) {
        this.removeChild(this.gifSprite);
        this.gifSprite = null;
      }

      // Check for available GIF classes
      const PIXI_GIF = (globalThis as any).PIXI;
      let GifClass: GifSpriteStatic | null = null;
      
      // Try GifSprite first, then AnimatedGIF
      if (PIXI_GIF?.GifSprite) {
        GifClass = PIXI_GIF.GifSprite;
      } else if (PIXI_GIF?.AnimatedGIF) {
        GifClass = PIXI_GIF.AnimatedGIF;
      } else {
        console.warn('No GIF sprite class found. Please install and import @pixi/gif plugin.');
        return;
      }

      // Load the GIF using different methods based on available API
      let gif: GifSpriteBase;

      if (GifClass.fromURL && (src.startsWith('http') || src.startsWith('/') || src.startsWith('./'))) {
        // Use fromURL if available
        gif = await GifClass.fromURL(src);
      } else if (GifClass.fromBuffer) {
        // Try to load as buffer first
        try {
          const buffer = await Assets.load(src);
          if (buffer instanceof ArrayBuffer) {
            gif = await GifClass.fromBuffer(buffer);
          } else if (GifClass.fromURL) {
            gif = await GifClass.fromURL(src);
          } else {
            throw new Error('No suitable loading method available');
          }
        } catch {
          if (GifClass.fromURL) {
            gif = await GifClass.fromURL(src);
          } else {
            throw new Error('Failed to load GIF and no fallback method available');
          }
        }
      } else if (GifClass.new) {
        // Fallback to constructor if available
        const texture = await Assets.load(src);
        gif = GifClass.new(texture);
      } else {
        console.warn('No compatible loading method found for GIF sprite.');
        return;
      }

      this.gifSprite = gif;
      this.addChild(this.gifSprite);

      // Set initial properties
      const props = this.fullProps;
      if (props.animationSpeed !== undefined && this.gifSprite.animationSpeed !== undefined) {
        this.gifSprite.animationSpeed = props.animationSpeed;
      }
      
      if (props.loop !== undefined && this.gifSprite.loop !== undefined) {
        this.gifSprite.loop = props.loop;
      }

      if (props.autoPlay !== false) {
        this.gifSprite.play();
      }

    } catch (error) {
      console.error('Error loading GIF:', error);
    }
  }

  async onDestroy(parent: Element, afterDestroy: () => void): Promise<void> {
    const _afterDestroy = async () => {
      if (this.subscriptionTick) {
        this.subscriptionTick.unsubscribe();
      }

      if (this.gifSprite) {
        this.removeChild(this.gifSprite);
        this.gifSprite = null;
      }

      if (afterDestroy) {
        afterDestroy();
      }
    };
    await super.onDestroy(parent, _afterDestroy);
  }

  // Control methods
  play() {
    if (this.gifSprite) {
      this.gifSprite.play();
    }
  }

  stop() {
    if (this.gifSprite) {
      this.gifSprite.stop();
    }
  }

  gotoAndPlay(frame: number) {
    if (this.gifSprite && this.gifSprite.gotoAndPlay) {
      this.gifSprite.gotoAndPlay(frame);
    }
  }

  gotoAndStop(frame: number) {
    if (this.gifSprite && this.gifSprite.gotoAndStop) {
      this.gifSprite.gotoAndStop(frame);
    }
  }

  // Getters for animation properties
  get duration() {
    return this.gifSprite?.duration || 0;
  }

  get currentFrame() {
    return this.gifSprite?.currentFrame || 0;
  }

  get totalFrames() {
    return this.gifSprite?.totalFrames || 0;
  }

  get isPlaying() {
    return this.gifSprite?.playing || false;
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