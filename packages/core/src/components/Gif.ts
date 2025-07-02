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

// AnimatedGIF interface - this requires @pixi/gif plugin to be installed
interface AnimatedGIF extends Container {
  play(): void;
  stop(): void;
  gotoAndPlay(frame: number): void;
  gotoAndStop(frame: number): void;
  duration: number;
  currentFrame: number;
  totalFrames: number;
  animationSpeed: number;
  loop: boolean;
  playing: boolean;
  onComplete?: () => void;
  onFrameChange?: (frame: number) => void;
  onLoop?: () => void;
}

interface AnimatedGIFStatic {
  fromBuffer(buffer: ArrayBuffer): Promise<AnimatedGIF>;
  fromURL(url: string): Promise<AnimatedGIF>;
}

export class CanvasGif extends DisplayObject(Container) {
  private animatedGif: any | null = null;
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
    if (this.animatedGif) {
      if (props.animationSpeed !== undefined) {
        this.animatedGif.animationSpeed = props.animationSpeed;
      }
      
      if (props.loop !== undefined) {
        this.animatedGif.loop = props.loop;
      }

      if (props.autoPlay !== false && !this.animatedGif.playing) {
        this.animatedGif.play();
      }

      if (props.autoPlay === false && this.animatedGif.playing) {
        this.animatedGif.stop();
      }

      // Set event handlers
      if (props.onComplete) {
        this.animatedGif.onComplete = props.onComplete;
      }

      if (props.onFrameChange) {
        this.animatedGif.onFrameChange = props.onFrameChange;
      }

      if (props.onLoop) {
        this.animatedGif.onLoop = props.onLoop;
      }

      // Handle specific frame control
      if (props.currentFrame !== undefined && props.currentFrame !== this.animatedGif.currentFrame) {
        if (props.playing !== false) {
          this.animatedGif.gotoAndPlay(props.currentFrame);
        } else {
          this.animatedGif.gotoAndStop(props.currentFrame);
        }
      }

      // Handle play/stop commands
      if (props.playing === true && !this.animatedGif.playing) {
        this.animatedGif.play();
      } else if (props.playing === false && this.animatedGif.playing) {
        this.animatedGif.stop();
      }
    }
  }

  private async loadGif(src: string) {
    try {
      // Remove existing gif if any
      if (this.animatedGif) {
        this.removeChild(this.animatedGif);
        this.animatedGif = null;
      }

      // Check if @pixi/gif is available
      if (typeof (globalThis as any).PIXI?.AnimatedGIF === 'undefined') {
        console.warn('AnimatedGIF is not available. Please install and import @pixi/gif plugin.');
        return;
      }

      const AnimatedGIF = (globalThis as any).PIXI.AnimatedGIF;

      // Load the GIF
      let gif;
      if (src.startsWith('http') || src.startsWith('/') || src.startsWith('./')) {
        // Load from URL
        gif = await AnimatedGIF.fromURL(src);
      } else {
        // Try to load from Assets first
        try {
          const buffer = await Assets.load(src);
          if (buffer instanceof ArrayBuffer) {
            gif = await AnimatedGIF.fromBuffer(buffer);
          } else {
            gif = await AnimatedGIF.fromURL(src);
          }
        } catch {
          gif = await AnimatedGIF.fromURL(src);
        }
      }

      this.animatedGif = gif;
      this.addChild(this.animatedGif);

      // Set initial properties
      const props = this.fullProps;
      if (props.animationSpeed !== undefined) {
        this.animatedGif.animationSpeed = props.animationSpeed;
      }
      
      if (props.loop !== undefined) {
        this.animatedGif.loop = props.loop;
      }

      if (props.autoPlay !== false) {
        this.animatedGif.play();
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

      if (this.animatedGif) {
        this.removeChild(this.animatedGif);
        this.animatedGif = null;
      }

      if (afterDestroy) {
        afterDestroy();
      }
    };
    await super.onDestroy(parent, _afterDestroy);
  }

  // Control methods
  play() {
    if (this.animatedGif) {
      this.animatedGif.play();
    }
  }

  stop() {
    if (this.animatedGif) {
      this.animatedGif.stop();
    }
  }

  gotoAndPlay(frame: number) {
    if (this.animatedGif) {
      this.animatedGif.gotoAndPlay(frame);
    }
  }

  gotoAndStop(frame: number) {
    if (this.animatedGif) {
      this.animatedGif.gotoAndStop(frame);
    }
  }

  // Getters for animation properties
  get duration() {
    return this.animatedGif?.duration || 0;
  }

  get currentFrame() {
    return this.animatedGif?.currentFrame || 0;
  }

  get totalFrames() {
    return this.animatedGif?.totalFrames || 0;
  }

  get isPlaying() {
    return this.animatedGif?.playing || false;
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