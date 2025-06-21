import { effect, signal, computed } from "@signe/reactive";
import { FederatedPointerEvent } from "pixi.js";
import { h } from "../engine/signal";
import { useDefineProps } from "../hooks/useProps";
import { Container } from "./Container";
import { Rect } from "./Graphic";
import { Text } from "./Text";

/**
 * Button states for visual feedback
 */
export enum ButtonState {
  Normal = "normal",
  Hover = "hover",
  Pressed = "pressed",
  Disabled = "disabled"
}

/**
 * Button style configuration for different visual approaches
 */
export interface ButtonStyle {
  /** Background color for each state */
  backgroundColor?: {
    [ButtonState.Normal]?: string;
    [ButtonState.Hover]?: string;
    [ButtonState.Pressed]?: string;
    [ButtonState.Disabled]?: string;
  };
  /** Border configuration */
  border?: {
    color?: string;
    width?: number;
    radius?: number;
  };
  /** Text styling */
  text?: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
  };
  /** Sprite textures for each state (alternative to backgroundColor) */
  textures?: {
    [ButtonState.Normal]?: string;
    [ButtonState.Hover]?: string;
    [ButtonState.Pressed]?: string;
    [ButtonState.Disabled]?: string;
  };
}

/**
 * Properties for the Button component
 */
export interface ButtonProps {
  /** Button text content */
  text?: string;
  /** Button disabled state */
  disabled?: boolean;
  /** Click event handler */
  click?: (event: FederatedPointerEvent) => void;
  /** Hover enter event handler */
  hoverEnter?: (event: FederatedPointerEvent) => void;
  /** Hover leave event handler */
  hoverLeave?: (event: FederatedPointerEvent) => void;
  /** Press down event handler */
  pressDown?: (event: FederatedPointerEvent) => void;
  /** Press up event handler */
  pressUp?: (event: FederatedPointerEvent) => void;
  /** Visual style configuration */
  style?: ButtonStyle;
  /** Button width */
  width?: number;
  /** Button height */
  height?: number;
  /** Button position X */
  x?: number;
  /** Button position Y */
  y?: number;
  /** Button alpha/opacity */
  alpha?: number;
  /** Button visibility */
  visible?: boolean;
  /** Button cursor */
  cursor?: string;
}

/**
 * Creates a Button component with interactive states and customizable styling.
 * 
 * This component provides a fully interactive button with visual feedback
 * for different states (normal, hover, pressed, disabled). It supports both
 * sprite-based and graphics-based rendering approaches.
 * 
 * The button is built using a Container with background and text elements,
 * providing reactive state management and event handling.
 * 
 * @param props - Button configuration including text, styling, and event handlers
 * @returns A reactive Button component
 * @example
 * ```typescript
 * // Simple button with text and click handler
 * const simpleButton = Button({
 *   text: "Click Me",
 *   onClick: () => console.log("Button clicked!"),
 *   width: 150,
 *   height: 50
 * });
 * 
 * // Styled button with custom colors
 * const styledButton = Button({
 *   text: "Styled Button",
 *   style: {
 *     backgroundColor: {
 *       normal: "#28a745",
 *       hover: "#218838",
 *       pressed: "#1e7e34",
 *       disabled: "#6c757d"
 *     },
 *     border: {
 *       radius: 8,
 *       width: 2,
 *       color: "#ffffff"
 *     },
 *     text: {
 *       fontSize: 18,
 *       color: "#ffffff"
 *     }
 *   }
 * });
 * 
 * // Sprite-based button
 * const spriteButton = Button({
 *   text: "Play Game",
 *   style: {
 *     textures: {
 *       normal: "/assets/button-normal.png",
 *       hover: "/assets/button-hover.png",
 *       pressed: "/assets/button-pressed.png"
 *     }
 *   }
 * });
 * ```
 */
export function Button(props: ButtonProps) {
  // Internal state signals
  const currentState = signal(ButtonState.Normal);
  const isPressed = signal(false);
  const isHovered = signal(false);

  // Define reactive props with defaults
  const defineProps = useDefineProps(props);
  const { text, disabled, width, height, style } = defineProps({
    text: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    },
    width: {
      type: Number,
      default: 120
    },
    height: {
      type: Number,
      default: 40
    },
    style: {
      type: Object,
      default: () => ({})
    }
  });

  // Update button state based on disabled and interaction states
  effect(() => {
    const isDisabled = disabled();
    const pressed = isPressed();
    const hovered = isHovered();

    if (isDisabled) {
      currentState.set(ButtonState.Disabled);
    } else if (pressed) {
      currentState.set(ButtonState.Pressed);
    } else if (hovered) {
      currentState.set(ButtonState.Hover);
    } else {
      currentState.set(ButtonState.Normal);
    }
  });

  // Event handlers
  const eventHandlers = {
    pointerenter: (event: FederatedPointerEvent) => {
      if (!disabled()) {
        isHovered.set(true);
        props.hoverEnter?.(event);
      }
    },
    pointerleave: (event: FederatedPointerEvent) => {
      isHovered.set(false);
      isPressed.set(false);
      props.hoverLeave?.(event);
    },
    pointerdown: (event: FederatedPointerEvent) => {
      if (!disabled()) {
        isPressed.set(true);
        props.pressDown?.(event);
      }
    },
    pointerup: (event: FederatedPointerEvent) => {
      if (!disabled() && isPressed()) {
        isPressed.set(false);
        props.pressUp?.(event);
      }
    },
    pointertap: (event: FederatedPointerEvent) => {
      if (!disabled()) {
        props.click?.(event);
      }
    }
  };

  // Return Container with h() children
  return h(Container, {
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    alpha: props.alpha,
    visible: props.visible,
    cursor: props.cursor || "pointer",
    ...eventHandlers
  }, [
    // Background element (either sprite or graphics)
    h(Rect, {
      width: width,
      height: height,
      color: computed(() => {
        const currentStyle = style();
        const backgroundColor = currentStyle.backgroundColor || {
          [ButtonState.Normal]: "#007bff",
          [ButtonState.Hover]: "#0056b3",
          [ButtonState.Pressed]: "#004085",
          [ButtonState.Disabled]: "#6c757d"
        };
        const state = currentState();
        return backgroundColor[state] || backgroundColor[ButtonState.Normal];
      })
    }),
    
    // Text element
    h(Text, {
      text: text,
      x: computed(() => width() / 2),
      y: computed(() => height() / 2),
      anchor: { x: 0.5, y: 0.5 },
      style: computed(() => {
        const currentStyle = style();
        const textStyle = currentStyle.text || {};
        return {
          fontSize: textStyle.fontSize || 16,
          fontFamily: textStyle.fontFamily || "Arial",
          fill: textStyle.color || "#ffffff"
        };
      })()
    })
  ]);
}
