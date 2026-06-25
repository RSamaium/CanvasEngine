/*
 * Joystick
 *
 * Inspired by https://github.com/endel/pixi-virtual-joystick
 */

import * as PIXI from "pixi.js";
import { Container, Graphics, Sprite, h, signal, isSignal, computed } from "../";
import type { DisplayObjectProps } from "./types/DisplayObject";

export interface JoystickChangeEvent {
  angle: number;
  direction: Direction;
  power: number;
}

export enum Direction {
  LEFT = "left",
  TOP = "top",
  BOTTOM = "bottom",
  RIGHT = "right",
  TOP_LEFT = "top_left",
  TOP_RIGHT = "top_right",
  BOTTOM_LEFT = "bottom_left",
  BOTTOM_RIGHT = "bottom_right",
}

export interface JoystickSettings extends DisplayObjectProps {
  outer?: string;
  inner?: string;
  outerScale?: { x: number; y: number };
  innerScale?: { x: number; y: number };
  innerColor?: string;
  outerColor?: string;
  onChange?: (data: JoystickChangeEvent) => void;
  onStart?: () => void;
  onEnd?: () => void;
  /** Controls instance to automatically apply joystick events to (e.g., JoystickControls or ControlsDirective) */
  controls?: any;
}

export function Joystick(opts: JoystickSettings = {}) {
  const settings = Object.assign(
    {
      outerScale: { x: 1, y: 1 },
      innerScale: { x: 1, y: 1 },
      innerColor: "black",
      outerColor: "black",
    },
    opts
  );

  // Unwrap controls if it's a signal
  const getControls = () => {
    if (isSignal(settings.controls)) {
      return settings.controls();
    }
    return settings.controls;
  };

  let outerRadius = 70;
  let innerRadius = 10;
  const innerVisualRadius = innerRadius * 2.5;
  const movementRadius = outerRadius - innerVisualRadius;
  const joystickSize = outerRadius * 2;
  const centerPosition = { x: outerRadius, y: outerRadius };
  const innerAlphaStandby = 0.5;

  let dragging = false;
  let power = 0;

  const innerPositionX = signal(centerPosition.x);
  const innerPositionY = signal(centerPosition.y);
  const innerAlpha = signal(innerAlphaStandby);

  function getPowerFromDistance(distance: number) {
    return Math.min(1, distance / outerRadius);
  }

  function getDirection(center: PIXI.Point) {
    let rad = Math.atan2(center.y, center.x); // [-PI, PI]
    if ((rad >= -Math.PI / 8 && rad < 0) || (rad >= 0 && rad < Math.PI / 8)) {
      return Direction.RIGHT;
    } else if (rad >= Math.PI / 8 && rad < (3 * Math.PI) / 8) {
      return Direction.BOTTOM_RIGHT;
    } else if (rad >= (3 * Math.PI) / 8 && rad < (5 * Math.PI) / 8) {
      return Direction.BOTTOM;
    } else if (rad >= (5 * Math.PI) / 8 && rad < (7 * Math.PI) / 8) {
      return Direction.BOTTOM_LEFT;
    } else if (
      (rad >= (7 * Math.PI) / 8 && rad < Math.PI) ||
      (rad >= -Math.PI && rad < (-7 * Math.PI) / 8)
    ) {
      return Direction.LEFT;
    } else if (rad >= (-7 * Math.PI) / 8 && rad < (-5 * Math.PI) / 8) {
      return Direction.TOP_LEFT;
    } else if (rad >= (-5 * Math.PI) / 8 && rad < (-3 * Math.PI) / 8) {
      return Direction.TOP;
    } else {
      return Direction.TOP_RIGHT;
    }
  }

  function handleDragStart(event: any) {
    dragging = true;
    innerAlpha.set(1);
    settings.onStart?.();
    
    // Notify controls if provided
    const controls = getControls();
    if (controls) {
      // Check if it's JoystickControls instance
      if (controls.handleJoystickStart) {
        controls.handleJoystickStart();
      }
      // Check if it's ControlsDirective with joystick getter
      else if (controls.joystick && controls.joystick.handleJoystickStart) {
        controls.joystick.handleJoystickStart();
      }
    }
  }

  function handleDragEnd() {
    if (!dragging) return;
    innerPositionX.set(centerPosition.x);
    innerPositionY.set(centerPosition.y);
    dragging = false;
    innerAlpha.set(innerAlphaStandby);
    settings.onEnd?.();
    
    // Notify controls if provided
    const controls = getControls();
    if (controls) {
      // Check if it's JoystickControls instance
      if (controls.handleJoystickEnd) {
        controls.handleJoystickEnd();
      }
      // Check if it's ControlsDirective with joystick getter
      else if (controls.joystick && controls.joystick.handleJoystickEnd) {
        controls.joystick.handleJoystickEnd();
      }
    }
  }

  function handleDragMove(event: any) {
    if (dragging == false) {
      return;
    }

    const target = event.currentTarget || event.target;
    let newPosition = event.getLocalPosition(target);

    const sideX = newPosition.x - centerPosition.x;
    const sideY = newPosition.y - centerPosition.y;
    const distance = Math.sqrt(sideX * sideX + sideY * sideY);

    if (distance == 0) {
      return;
    }

    /**
     * x:   -1 <-> 1
     * y:   -1 <-> 1
     *          Y
     *          ^
     *          |
     *     180  |  90
     *    ------------> X
     *     270  |  360
     *          |
     *          |
     */

    const visualDistance = Math.min(distance, movementRadius);
    const visualRatio = visualDistance / distance;
    const visualX = sideX * visualRatio;
    const visualY = sideY * visualRatio;
    const directionPoint = new PIXI.Point(sideX, sideY);
    let angle = -(Math.atan2(sideY, sideX) * 180) / Math.PI;
    if (angle < 0) {
      angle += 360;
    }

    innerPositionX.set(centerPosition.x + visualX);
    innerPositionY.set(centerPosition.y + visualY);
    power = getPowerFromDistance(distance);

    const direction = getDirection(directionPoint);
    const changeEvent = { angle, direction, power };
    settings.onChange?.(changeEvent);
    
    // Notify controls if provided
    const controls = getControls();
    if (controls) {
      // Check if it's JoystickControls instance
      if (controls.handleJoystickChange) {
        controls.handleJoystickChange(changeEvent);
      }
      // Check if it's ControlsDirective with joystick getter
      else if (controls.joystick && controls.joystick.handleJoystickChange) {
        controls.joystick.handleJoystickChange(changeEvent);
      }
    }
  }

  let innerElement;
  let outerElement;

  if (!settings.outer) {
    outerElement = h(Graphics, {
      draw: (g) => {
        g.circle(centerPosition.x, centerPosition.y, outerRadius).fill(settings.outerColor);
      },
      positionType: "absolute",
      alpha: 0.5,
    });
  } else {
    outerElement = h(Sprite, {
      image: settings.outer,
      x: centerPosition.x,
      y: centerPosition.y,
      anchor: { x: 0.5, y: 0.5 },
      scale: settings.outerScale,
      positionType: "absolute",
    });
  }

  const innerOptions: any = {
    scale: settings.innerScale,
    alpha: innerAlpha,
    positionType: "absolute",
  };

  if (!settings.inner) {
    innerElement = h(Graphics, {
      draw: (g) => {
        g.circle(innerVisualRadius, innerVisualRadius, innerVisualRadius).fill(settings.innerColor);
      },
      width: innerVisualRadius * 2,
      height: innerVisualRadius * 2,
      x: computed(() => innerPositionX() - innerVisualRadius),
      y: computed(() => innerPositionY() - innerVisualRadius),
      ...innerOptions,
    });
  } else {
    innerElement = h(Sprite, {
      image: settings.inner,
      x: innerPositionX,
      y: innerPositionY,
      anchor: { x: 0.5, y: 0.5 },
      ...innerOptions,
    });
  }

  return h(
    Container,
    {
      ...opts,
      width: opts.width ?? joystickSize,
      height: opts.height ?? joystickSize,
      pointerdown: handleDragStart,
      pointerup: handleDragEnd,
      pointerupoutside: handleDragEnd,
      pointermove: handleDragMove,
    },
    outerElement,
    innerElement,
  );
}
