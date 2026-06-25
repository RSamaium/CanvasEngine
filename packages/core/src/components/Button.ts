import { effect, signal, computed, isSignal, Signal } from "@signe/reactive";
import { FederatedPointerEvent } from "pixi.js";
import { h } from "../engine/signal";
import { useDefineProps } from "../hooks/useProps";
import { Container } from "./Container";
import { Rect, Circle, Ellipse } from "./Graphic";
import { Text } from "./Text";
import { ControlsDirective } from "../directives/Controls";
import { JoystickControls } from "../directives/JoystickControls";
import { Element } from "../engine/reactive";

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
  /** Controls instance to automatically apply button events to (e.g., ControlsDirective or JoystickControls) */
  controls?: ControlsDirective | JoystickControls | any;
  /** Name of the control to trigger with applyControl when button is clicked */
  controlName?: string;
  /** Shape of the button background: 'rect', 'circle', or 'ellipse' */
  shape?: 'rect' | 'circle' | 'ellipse';
  /** Custom background component or element (replaces default background if provided) */
  background?: Element | any;
  /** Custom children components for button content (takes priority over text if provided) */
  children?: Element[];
  /** Focus index for the button */
  tabindex?: number | Signal<number>;
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
 * ## Features
 * 
 * - **Controls Integration**: Automatically trigger controls via `applyControl` when clicked
 * - **Multiple Shapes**: Support for rect, circle, and ellipse shapes
 * - **Custom Content**: Use children components for custom button content
 * - **Custom Background**: Provide a custom background component
 * 
 * @param props - Button configuration including text, styling, controls, shape, and event handlers
 * @returns A reactive Button component
 * @example
 * ```typescript
 * // Simple button with text and click handler
 * const simpleButton = Button({
 *   text: "Click Me",
 *   click: () => console.log("Button clicked!"),
 *   width: 150,
 *   height: 50
 * });
 * 
 * // Button with controls integration
 * const jumpButton = Button({
 *   text: "Jump",
 *   controls: controlsInstance,
 *   controlName: "jump",
 *   width: 120,
 *   height: 40
 * });
 * 
 * // Circular button
 * const circleButton = Button({
 *   text: "Action",
 *   shape: "circle",
 *   width: 100,
 *   height: 100
 * });
 * 
 * // Button with custom content (children)
 * const customButton = Button({
 *   shape: "circle",
 *   width: 80,
 *   height: 80,
 *   children: [
 *     h(Sprite, { image: "icon.png", width: 50, height: 50 })
 *   ]
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
  const { text, disabled, width, height, style, shape, controlName } = defineProps({
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
    },
    shape: {
      type: String,
      default: "rect"
    },
    controlName: {
      type: String,
      default: undefined
    }
  });

  // Helper function to get controls instance (handles signals like Joystick)
  const getControls = () => {
    if (!props.controls) return null;
    if (isSignal(props.controls)) {
      return props.controls();
    }
    return props.controls;
  };

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
    pointerdown: async (event: FederatedPointerEvent) => {
      if (!disabled()) {
        isPressed.set(true);
        props.pressDown?.(event);

        // Apply control if controls and controlName are provided
        const controls = getControls();
        const name = controlName();
        if (controls && name && controls.applyControl) {
          await controls.applyControl(name, true);
        }
      }
    },
    pointerup: async (event: FederatedPointerEvent) => {
      if (!disabled() && isPressed()) {
        isPressed.set(false);
        props.pressUp?.(event);

        // Apply control release if controls and controlName are provided
        const controls = getControls();
        const name = controlName();
        if (controls && name && controls.applyControl) {
          await controls.applyControl(name, false);
        }
      }
    },
    pointertap: async (event: FederatedPointerEvent) => {
      if (!disabled()) {
        props.click?.(event);

        // Apply control if controls and controlName are provided (press and release)
        const controls = getControls();
        const name = controlName();
        if (controls && name && controls.applyControl) {
          await controls.applyControl(name);
        }
      }
    }
  };

  // Generate background element
  const getBackgroundElement = () => {
    // If custom background is provided, use it
    if (props.background) {
      return props.background;
    }

    // Otherwise, use shape-based background
    const currentShape = shape();
    const bgColor = computed(() => {
      const currentStyle = style();
      const backgroundColor = currentStyle.backgroundColor || {
        [ButtonState.Normal]: "#007bff",
        [ButtonState.Hover]: "#0056b3",
        [ButtonState.Pressed]: "#004085",
        [ButtonState.Disabled]: "#6c757d"
      };
      const state = currentState();
      return backgroundColor[state] || backgroundColor[ButtonState.Normal];
    });
    const bgBorder = computed(() => style().border);

    if (currentShape === 'circle') {
      // For circle, use the smaller dimension as radius
      const radius = computed(() => Math.min(width(), height()) / 2);
      return h(Circle, {
        radius: radius,
        x: computed(() => (width() - radius() * 2) / 2),
        y: computed(() => (height() - radius() * 2) / 2),
        color: bgColor,
        border: bgBorder,
        positionType: "absolute"
      });
    } else if (currentShape === 'ellipse') {
      return h(Ellipse, {
        width: width,
        height: height,
        color: bgColor,
        border: bgBorder,
        positionType: "absolute"
      });
    } else {
      // Default: rect
      return h(Rect, {
        width: width,
        height: height,
        color: bgColor,
        border: bgBorder,
        positionType: "absolute"
      });
    }
  };

  // Generate content element(s)
  const getContentElements = () => {
    // If children are provided, use them (priority over text)
    if (props.children && props.children.length > 0) {
      return props.children;
    }

    // Otherwise, use text
    return [
      h(Text, {
        text: text,
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
    ];
  };

  // Return Container with h() children
  return h(Container, {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    alpha: props.alpha,
    visible: props.visible,
    cursor: props.cursor || "pointer",
    tabindex: props.tabindex,
    ...eventHandlers
  }, [
    getBackgroundElement(),
    ...getContentElements()
  ]);
}
