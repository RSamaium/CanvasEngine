import { Text as PixiText, TextStyle } from "pixi.js";
import { createComponent, registerComponent } from "../engine/reactive";
import { DisplayObject } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";
import { Signal } from "@signe/reactive";
import { on } from "../engine/trigger";

enum TextEffect {
  Typewriter = "typewriter",
}

interface TextProps extends DisplayObjectProps {
  text?: string;
  style?: Partial<TextStyle>;
  color?: string;
  size?: string;
  typewriter?: {
    speed?: number;
    start?: () => void;
    onComplete?: () => void;
    skip?: () => void;
  };
}

class CanvasText extends DisplayObject(PixiText) {
  private subscriptionTick: any;
  private fullText: string = "";
  private currentIndex: number = 0;
  private typewriterSpeed: number = 1; // Default speed
  private _wordWrapWidth: number = 0;
  private typewriterOptions: any = {};
  private skipSignal?: () => void;

  onMount(args) {
    super.onMount(args);
    const { props } = args;
    const tick: Signal = props.context.tick;

    if (props.text && props.typewriter) {
      this.fullText = props.text;
      this.text = "";
      this.currentIndex = 0;
      // Set typewriter options
      if (props.typewriter) {
        this.typewriterOptions = props.typewriter;
        if (this.typewriterOptions.skip) {
          on(this.typewriterOptions.skip, () => {
            this.skipTypewriter();
          });
        }
      }
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
      }
    } else {
      this.text = this.fullText;
    }
    if (props.text !== undefined && props.text !== this.fullText) {
      this.text = "";
      this.currentIndex = 0;
      this.fullText = props.text;
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
    if (this._wordWrapWidth) {
      this.setWidth(this._wordWrapWidth);
    } else {
      this.setWidth(this.width);
    }
    this.setHeight(this.height);
  }

  get onCompleteCallback() {
    return this.typewriterOptions.onComplete;
  }

  private typewriterEffect() {
    if (this.currentIndex < this.fullText.length) {
      const nextIndex = Math.min(
        this.currentIndex + this.typewriterOptions.speed ?? 1,
        this.fullText.length
      );
      this.text = this.fullText.slice(0, nextIndex);
      this.currentIndex = nextIndex;

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
  public skipTypewriter() {
    if (this.skipSignal) {
      this.skipSignal();
    }
    this.text = this.fullText;
    this.currentIndex = this.fullText.length;
  }

  onDestroy(): void {
    super.onDestroy();
    this.subscriptionTick.unsubscribe();
  }
}

interface CanvasText extends PixiText {}

registerComponent("Text", CanvasText);

export function Text(props: TextProps) {
  return createComponent("Text", props);
}
