import { Graphics, Container, h, useProps, tick, signal, effect, mount } from "canvasengine";
import * as PIXI from "pixi.js";

/**
 * Loading Component Props
 */
export interface LoadingProps {
  /**
   * Size of the loading spinner (radius in pixels)
   * @default 30
   */
  size?: number;
  /**
   * Color of the spinner segments
   * @default "#3498db"
   */
  color?: string;
  /**
   * Background color of the spinner (optional)
   */
  backgroundColor?: string;
  /**
   * Rotation speed in degrees per second
   * @default 180
   */
  speed?: number;
  /**
   * Number of segments in the spinner
   * @default 8
   */
  segments?: number;
  /**
   * Width of each segment
   * @default 3
   */
  segmentWidth?: number;
  /**
   * Alpha value for inactive segments (0-1)
   * @default 0.15
   */
  inactiveAlpha?: number;
}

/**
 * Loading Component
 * 
 * Creates an animated circular loading spinner with customizable appearance and rotation speed.
 * The spinner consists of multiple segments that rotate continuously, creating a smooth loading indicator.
 * 
 * ## Design
 * 
 * The component uses a Graphics element to draw multiple segments arranged in a circle:
 * - **Segments**: Multiple radial segments that create a circular pattern
 * - **Rotation animation**: Continuous rotation using the tick system for smooth animation
 * - **Alpha variation**: Active segments are fully opaque while inactive segments have reduced opacity
 * - **Customizable**: Size, color, speed, and number of segments can be adjusted
 * 
 * @param {LoadingProps} opts - Configuration options for the loading spinner
 * 
 * @example
 * ```tsx
 * // Basic usage with default settings
 * <Loading />
 * 
 * // Custom size and color
 * <Loading 
 *   size={50}
 *   color="#e74c3c"
 * />
 * 
 * // Fast spinning loader
 * <Loading 
 *   speed={360}
 *   segments={12}
 * />
 * 
 * // Large loader with background
 * <Loading 
 *   size={80}
 *   color="#2ecc71"
 *   backgroundColor="#ecf0f1"
 *   segmentWidth={5}
 * />
 * 
 * // Using signals for dynamic control
 * const loaderSize = signal(30);
 * const loaderSpeed = signal(180);
 * 
 * <Loading 
 *   size={loaderSize}
 *   speed={loaderSpeed}
 * />
 * ```
 * 
 * @returns {JSX.Element} A container with an animated loading spinner
 */
export function Loading(opts: LoadingProps = {}) {
  const {
    size = 30,
    color = "#3498db",
    backgroundColor,
    speed = 180,
    segments = 8,
    segmentWidth = 3,
    inactiveAlpha = 0.15,
  } = useProps(opts, {
    size: 30,
    color: "#3498db",
    speed: 180,
    segments: 8,
    segmentWidth: 3,
    inactiveAlpha: 0.15,
  });

  const rotation = signal(0);

  // Animation loop using tick
  tick(({ deltaTime }) => {
    const speedValue = typeof speed === "function" ? speed() : speed;
    const rotationIncrement = (speedValue * deltaTime) / 1000;
    rotation.set(rotation() + rotationIncrement);
  });

  const draw = (graphics: PIXI.Graphics) => {
    const sizeValue = typeof size === "function" ? size() : size;
    const colorValue = typeof color === "function" ? color() : color;
    const backgroundColorValue = backgroundColor
      ? typeof backgroundColor === "function"
        ? backgroundColor()
        : backgroundColor
      : null;
    const segmentsValue = typeof segments === "function" ? segments() : segments;
    const segmentWidthValue =
      typeof segmentWidth === "function" ? segmentWidth() : segmentWidth;
    const inactiveAlphaValue =
      typeof inactiveAlpha === "function" ? inactiveAlpha() : inactiveAlpha;
    const rotationValue = rotation();

    // Draw background circle if specified
    if (backgroundColorValue) {
      graphics.circle(0, 0, sizeValue).fill(backgroundColorValue);
    }

    // Draw spinner segments with fade effect
    const angleStep = 360 / segmentsValue;
    const innerRadius = sizeValue * 0.4; // Inner radius of the spinner
    const outerRadius = sizeValue; // Outer radius of the spinner

    for (let i = 0; i < segmentsValue; i++) {
      const segmentBaseAngle = i * angleStep;
      
      // Calculate opacity based on how close this segment is to the rotation point
      // The rotation point acts as the "bright spot" that fades out
      const normalizedRotation = ((rotationValue % 360) + 360) % 360;
      let angleDiff = Math.abs(normalizedRotation - segmentBaseAngle);
      
      // Handle wrap-around (shorter distance)
      if (angleDiff > 180) {
        angleDiff = 360 - angleDiff;
      }
      
      // Create distinct fade effect: segments near rotation point are bright,
      // fading out quickly for more contrast
      const fadeRange = 120; // Reduced range for sharper fade
      let fadeProgress = angleDiff / fadeRange;
      
      // Apply stronger easing for more distinct opacity difference (cubic ease-out)
      fadeProgress = Math.min(1, fadeProgress);
      fadeProgress = fadeProgress * fadeProgress * fadeProgress; // Cubic easing for sharper contrast
      
      const opacity = inactiveAlphaValue + (1 - fadeProgress) * (1 - inactiveAlphaValue);

      // Draw segment at fixed position (not rotating with the spinner)
      const angle = segmentBaseAngle * (Math.PI / 180);
      const segmentAngle = angleStep * (Math.PI / 180);
      const startAngle = angle - segmentAngle / 2;
      const endAngle = angle + segmentAngle / 2;

      // Draw segment from inner to outer radius
      graphics
        .arc(0, 0, innerRadius, startAngle, endAngle)
        .arc(0, 0, outerRadius, endAngle, startAngle, true)
        .fill({ color: colorValue, alpha: opacity });
    }
  };

  // Calculate width and height based on size (diameter)
  const sizeValue = typeof size === "function" ? size() : size;
  const diameter = sizeValue * 2;
  const widthSignal = typeof size === "function" 
    ? signal(diameter)
    : signal(diameter);
  const heightSignal = typeof size === "function"
    ? signal(diameter)
    : signal(diameter);

  // Update width/height when size changes
  if (typeof size === "function") {
    effect(() => {
      const s = size();
      widthSignal.set(s * 2);
      heightSignal.set(s * 2);
    });
  }

  return h(Container, opts as any, [
    h(Graphics, {
      draw
    }),
  ]);
}
