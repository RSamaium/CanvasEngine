import { Text as PixiText, TextStyle } from "pixi.js";
import { createComponent, registerComponent, Element, Props } from "../engine/reactive";
import { DisplayObject, ComponentInstance } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";
import { Signal } from "@signe/reactive";
import { on, isTrigger } from "../engine/trigger";

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
   * Unsubscribes from the tick observable.
   * @param {Element<any>} parent - The parent element.
   * @param {() => void} [afterDestroy] - An optional callback function to be executed after the component's own destruction logic.
   */
  async onDestroy(parent: Element<any>, afterDestroy?: () => void): Promise<void> {
    const _afterDestroy = async () => {
      if (this.subscriptionTick) {
        this.subscriptionTick.unsubscribe();
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
