import { Text as PixiText, TextStyle } from "pixi.js";
import { createComponent, registerComponent, Element, Props } from "../engine/reactive";
import { DisplayObject, ComponentInstance } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";
import { Signal } from "@signe/reactive";
import { on, isTrigger } from "../engine/trigger";
import { Howl } from "howler";

enum TextEffect {
  Typewriter = "typewriter",
}

export interface TextProps extends DisplayObjectProps {
  text?: string;
  style?: Partial<TextStyle>;
  color?: string;
  size?: string;
  fontFamily?: string;
  typewriter?: {
    speed?: number;
    start?: () => void;
    onComplete?: () => void;
    skip?: () => void;
    sound?: {
      src: string;
      volume?: number;
      rate?: number;
    };
  };
  context?: any; // Ensure context is available, ideally typed from a base prop or injected
}

class CanvasText extends DisplayObject(PixiText) {
  private subscriptionTick: any;
  private fullText: string = "";
  private currentIndex: number = 0;
  private typewriterSpeed: number = 1; // Default speed
  private _wordWrapWidth: number = 0;
  private typewriterOptions: any = {};
  private skipSignal?: () => void;
  private typewriterSound?: Howl;
  private lastSoundTime: number = 0;
  private soundDuration: number = 0; // Duration of the sound in milliseconds

  /**
   * Called when the component is mounted to the scene graph.
   * Initializes the typewriter effect if configured.
   * @param {Element<CanvasText>} element - The element being mounted with parent and props.
   * @param {number} [index] - The index of the component among its siblings.
   */
  async onMount(element: Element<CanvasText>, index?: number): Promise<void> {
    const { props } = element;
    await super.onMount(element, index);
    const tick: Signal = props.context.tick;

    if (props.text && props.typewriter) {
      this.fullText = props.text;
      this.text = "";
      this.currentIndex = 0;
      // Set typewriter options
      if (props.typewriter) {
        this.typewriterOptions = props.typewriter;
        if (this.typewriterOptions.skip && isTrigger(this.typewriterOptions.skip)) {
          on(this.typewriterOptions.skip, () => {
            this.skipTypewriter();
          });
        }
        // Initialize typewriter sound if configured
        if (this.typewriterOptions.sound) {
          this.initializeTypewriterSound();
        }
      }
      // Update layout after initializing typewriter
      this.updateLayout();
    }
    this.subscriptionTick = tick.observable.subscribe(() => {
      if (props.typewriter) {
        this.typewriterEffect();
      }
    });
  }

  onUpdate(props: TextProps) {
    super.onUpdate(props);
    if (props.typewriter) {
      if (props.typewriter) {
        this.typewriterOptions = props.typewriter;
        // Reinitialize sound if sound configuration changed
        if (props.typewriter.sound) {
          this.initializeTypewriterSound();
        }
      }
    }
    if (props.text !== undefined) {
      this.text = ''+props.text;
    }
    if (props.text !== undefined && props.text !== this.fullText && this.fullProps.typewriter) {
      this.text = "";
      this.currentIndex = 0;
      this.fullText = props.text;
      // Update layout after resetting typewriter
      this.updateLayout();
    }
    if (props.style) {
      for (const key in props.style) {
        this.style[key] = props.style[key];
      }
      if (props.style.wordWrapWidth) {
        this._wordWrapWidth = props.style.wordWrapWidth;
      }
    }
    if (props.color) {
      this.style.fill = props.color;
    }
    if (props.size) {
      this.style.fontSize = props.size;
    }
    if (props.fontFamily) {
      this.style.fontFamily = props.fontFamily;
    }
    
    // Use the centralized layout update method
    this.updateLayout();
  }

  get onCompleteCallback() {
    return this.typewriterOptions.onComplete;
  }

  /**
   * Initializes the typewriter sound effect using Howler.
   * Creates a Howl instance with the configured sound settings.
   * Calculates the sound duration to prevent overlapping sounds.
   */
  private initializeTypewriterSound() {
    if (!this.typewriterOptions.sound?.src) return;
    
    this.typewriterSound = new Howl({
      src: [this.typewriterOptions.sound.src],
      volume: this.typewriterOptions.sound.volume ?? 0.5,
      rate: this.typewriterOptions.sound.rate ?? 1.0,
      preload: true,
      onload: () => {
        // Calculate sound duration in milliseconds
        if (this.typewriterSound) {
          const duration = this.typewriterSound.duration();
          const rate = this.typewriterOptions.sound?.rate ?? 1.0;
          this.soundDuration = (duration / rate) * 1000;
        }
      }
    });
  }

  /**
   * Plays the typewriter sound with duration-based cooldown to prevent overlapping sounds.
   * @param {number} currentTime - The current timestamp to check against sound duration.
   */
  private playTypewriterSound(currentTime: number) {
    if (!this.typewriterSound || !this.typewriterOptions.sound) return;
    
    // Check if enough time has passed since the last sound play
    // Use the actual sound duration to prevent overlap
    if (this.soundDuration > 0 && currentTime - this.lastSoundTime < this.soundDuration) return;
    
    this.typewriterSound.play();
    this.lastSoundTime = currentTime;
  }

  /**
   * Updates the layout properties of the text component.
   * This method ensures consistent width, height and word wrap behavior.
   */
  private updateLayout() {
    if (this._wordWrapWidth) {
      this.setWidth(this._wordWrapWidth);
    } else {
      this.setWidth(this.width);
    }
    this.setHeight(this.height);
  }

  private typewriterEffect() {
    if (this.currentIndex < this.fullText.length) {
      const nextIndex = Math.min(
        this.currentIndex + (this.typewriterOptions.speed ?? 1),
        this.fullText.length
      );
      this.text = this.fullText.slice(0, nextIndex);
      this.currentIndex = nextIndex;

      // Play typewriter sound if configured
      if (this.typewriterOptions.sound) {
        this.playTypewriterSound(Date.now());
      }

      // Update layout after text change to maintain proper word wrap and dimensions
      this.updateLayout();

      // Check if typewriter effect is complete
      if (
        this.currentIndex === this.fullText.length &&
        this.onCompleteCallback
      ) {
        this.onCompleteCallback();
      }
    }
  }

  // Add a method to skip the typewriter effect
  private skipTypewriter() {
    if (this.skipSignal) {
      this.skipSignal();
    }
    this.text = this.fullText;
    this.currentIndex = this.fullText.length;
    
    // Update layout after setting full text to maintain proper word wrap and dimensions
    this.updateLayout();
  }

  /**
   * Called when the component is about to be destroyed.
   * Unsubscribes from the tick observable and cleans up sound resources.
   * @param {Element<any>} parent - The parent element.
   * @param {() => void} [afterDestroy] - An optional callback function to be executed after the component's own destruction logic.
   */
  async onDestroy(parent: Element<any>, afterDestroy?: () => void): Promise<void> {
    const _afterDestroy = async () => {
      if (this.subscriptionTick) {
        this.subscriptionTick.unsubscribe();
      }
      // Clean up typewriter sound
      if (this.typewriterSound) {
        this.typewriterSound.stop();
        this.typewriterSound.unload();
        this.typewriterSound = undefined;
      }
      if (afterDestroy) {
        afterDestroy();
      }
    }
    await super.onDestroy(parent, _afterDestroy);
  }
}

// interface CanvasText extends PixiText {} // Removed as it's redundant and causes type conflicts

registerComponent("Text", CanvasText);

export function Text(props: TextProps) {
  return createComponent("Text", props);
}
