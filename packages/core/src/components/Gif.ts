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

// Get GifSprite class from PixiJS global
const getGifSpriteClass = () => {
  const PIXI_GIF = (globalThis as any).PIXI;
  
  if (PIXI_GIF?.GifSprite) {
    return PIXI_GIF.GifSprite;
  } else if (PIXI_GIF?.AnimatedGIF) {
    return PIXI_GIF.AnimatedGIF;
  }
  
  // Fallback for when @pixi/gif is not loaded
  return class MockGifSprite extends Container {
    play() { console.warn('GifSprite not available. Please install @pixi/gif plugin.'); }
    stop() { console.warn('GifSprite not available. Please install @pixi/gif plugin.'); }
    gotoAndPlay() { console.warn('GifSprite not available. Please install @pixi/gif plugin.'); }
    gotoAndStop() { console.warn('GifSprite not available. Please install @pixi/gif plugin.'); }
    duration = 0;
    currentFrame = 0;
    totalFrames = 0;
    animationSpeed = 1;
    loop = true;
    playing = false;
    onComplete?: () => void;
    onFrameChange?: (frame: number) => void;
    onLoop?: () => void;
  };
};

const GifSpriteClass = getGifSpriteClass();

export class CanvasGif extends DisplayObject(GifSpriteClass) {
  private app: Application | null = null;
  private subscriptionTick: Subscription | null = null;
  
  // GIF properties that may be available
  public animationSpeed?: number;
  public loop?: boolean;
  public playing?: boolean;
  public currentFrame?: number;
  public totalFrames?: number;
  public duration?: number;
  public onComplete?: () => void;
  public onFrameChange?: (frame: number) => void;
  public onLoop?: () => void;

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
    if (props.animationSpeed !== undefined && this.animationSpeed !== undefined) {
      this.animationSpeed = props.animationSpeed;
    }
    
    if (props.loop !== undefined && this.loop !== undefined) {
      this.loop = props.loop;
    }

    if (props.autoPlay !== false && this.playing !== undefined && !this.playing) {
      this.play();
    }

    if (props.autoPlay === false && this.playing !== undefined && this.playing) {
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
    if (props.currentFrame !== undefined && this.currentFrame !== undefined && props.currentFrame !== this.currentFrame) {
      if (props.playing !== false && this.gotoAndPlay) {
        this.gotoAndPlay(props.currentFrame);
      } else if (this.gotoAndStop) {
        this.gotoAndStop(props.currentFrame);
      }
    }

    // Handle play/stop commands
    if (props.playing === true && this.playing !== undefined && !this.playing) {
      this.play();
    } else if (props.playing === false && this.playing !== undefined && this.playing) {
      this.stop();
    }
  }

  private async loadGif(src: string) {
    try {
      // Check for available GIF classes
      const PIXI_GIF = (globalThis as any).PIXI;
      
      // Try to use static methods from GIF classes if available
      if (PIXI_GIF?.GifSprite?.fromURL && (src.startsWith('http') || src.startsWith('/') || src.startsWith('./'))) {
        // Use GifSprite.fromURL if available
        const gifData = await PIXI_GIF.GifSprite.fromURL(src);
        this.copyGifData(gifData);
      } else if (PIXI_GIF?.AnimatedGIF?.fromURL && (src.startsWith('http') || src.startsWith('/') || src.startsWith('./'))) {
        // Use AnimatedGIF.fromURL if available
        const gifData = await PIXI_GIF.AnimatedGIF.fromURL(src);
        this.copyGifData(gifData);
      } else if (PIXI_GIF?.GifSprite?.fromBuffer) {
        // Try to load as buffer first
        try {
          const buffer = await Assets.load(src);
          if (buffer instanceof ArrayBuffer) {
            const gifData = await PIXI_GIF.GifSprite.fromBuffer(buffer);
            this.copyGifData(gifData);
          } else {
            throw new Error('Buffer loading failed');
          }
        } catch {
          if (PIXI_GIF?.GifSprite?.fromURL) {
            const gifData = await PIXI_GIF.GifSprite.fromURL(src);
            this.copyGifData(gifData);
          } else {
            throw new Error('Failed to load GIF and no fallback method available');
          }
        }
      } else {
        // Fallback: load as regular texture
        const texture = await Assets.load(src);
        this.texture = texture;
        console.warn('Loaded as regular texture. GIF animation features may not be available.');
      }

      // Set initial properties
      const props = this.fullProps;
      if (props.animationSpeed !== undefined && this.animationSpeed !== undefined) {
        this.animationSpeed = props.animationSpeed;
      }
      
      if (props.loop !== undefined && this.loop !== undefined) {
        this.loop = props.loop;
      }

      if (props.autoPlay !== false && this.play) {
        this.play();
      }

    } catch (error) {
      console.error('Error loading GIF:', error);
    }
  }

  private copyGifData(source: any) {
    // Copy properties from the loaded GIF to this instance
    if (source.texture) {
      this.texture = source.texture;
    }
    if (source.textures) {
      (this as any).textures = source.textures;
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
    if (source.playing !== undefined) {
      (this as any).playing = source.playing;
    }
    
    // Copy methods if they exist
    if (source.play) {
      this.play = source.play.bind(this);
    }
    if (source.stop) {
      this.stop = source.stop.bind(this);
    }
    if (source.gotoAndPlay) {
      (this as any).gotoAndPlay = source.gotoAndPlay.bind(this);
    }
    if (source.gotoAndStop) {
      (this as any).gotoAndStop = source.gotoAndStop.bind(this);
    }
  }

  async onDestroy(parent: Element, afterDestroy: () => void): Promise<void> {
    const _afterDestroy = async () => {
      if (this.subscriptionTick) {
        this.subscriptionTick.unsubscribe();
      }

      // Stop animation if playing
      if (this.stop && this.playing) {
        this.stop();
      }

      if (afterDestroy) {
        afterDestroy();
      }
    };
    await super.onDestroy(parent, _afterDestroy);
  }

  // Control methods - these may be overridden by copyGifData()
  play() {
    console.warn('GIF play method not available. Make sure @pixi/gif is properly loaded.');
  }

  stop() {
    console.warn('GIF stop method not available. Make sure @pixi/gif is properly loaded.');
  }

  gotoAndPlay(frame: number) {
    console.warn('GIF gotoAndPlay method not available. Make sure @pixi/gif is properly loaded.');
  }

  gotoAndStop(frame: number) {
    console.warn('GIF gotoAndStop method not available. Make sure @pixi/gif is properly loaded.');
  }

  // Getters for animation properties
  get isPlaying() {
    return (this as any).playing || false;
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