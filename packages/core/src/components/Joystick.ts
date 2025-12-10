/*
 * Joystick
 *
 * Inspired by https://github.com/endel/pixi-virtual-joystick
 */

import * as PIXI from "pixi.js";
import { Container, Graphics, Sprite, h, signal, isSignal } from "../";

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

export interface JoystickSettings {
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
  const innerAlphaStandby = 0.5;

  let dragging = false;
  let startPosition: PIXI.PointData | null = null;
  let power = 0;

  const innerPositionX = signal(0);
  const innerPositionY = signal(0);
  const innerAlpha = signal(innerAlphaStandby);

  function getPower(centerPoint: PIXI.Point) {
    const a = centerPoint.x - 0;
    const b = centerPoint.y - 0;
    return Math.min(1, Math.sqrt(a * a + b * b) / outerRadius);
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
    startPosition = event.getLocalPosition(this);
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
    innerPositionX.set(0);
    innerPositionY.set(0);
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

    let newPosition = event.getLocalPosition(this);

    let sideX = newPosition.x - (startPosition?.x ?? 0);
    let sideY = newPosition.y - (startPosition?.y ?? 0);

    let centerPoint = new PIXI.Point(0, 0);
    let angle = 0;

    if (sideX == 0 && sideY == 0) {
      return;
    }

    let calRadius = 0;

    if (sideX * sideX + sideY * sideY >= outerRadius * outerRadius) {
      calRadius = outerRadius;
    } else {
      calRadius = outerRadius - innerRadius;
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

    let direction = Direction.LEFT;

    if (sideX == 0) {
      if (sideY > 0) {
        centerPoint.set(0, sideY > outerRadius ? outerRadius : sideY);
        angle = 270;
        direction = Direction.BOTTOM;
      } else {
        centerPoint.set(
          0,
          -(Math.abs(sideY) > outerRadius ? outerRadius : Math.abs(sideY))
        );
        angle = 90;
        direction = Direction.TOP;
      }
      innerPositionX.set(centerPoint.x);
      innerPositionY.set(centerPoint.y);
      power = getPower(centerPoint);
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
      return;
    }

    if (sideY == 0) {
      if (sideX > 0) {
        centerPoint.set(
          Math.abs(sideX) > outerRadius ? outerRadius : Math.abs(sideX),
          0
        );
        angle = 0;
        direction = Direction.RIGHT;
      } else {
        centerPoint.set(
          -(Math.abs(sideX) > outerRadius ? outerRadius : Math.abs(sideX)),
          0
        );
        angle = 180;
        direction = Direction.LEFT;
      }

      innerPositionX.set(centerPoint.x);
      innerPositionY.set(centerPoint.y);
      power = getPower(centerPoint);
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
      return;
    }

    let tanVal = Math.abs(sideY / sideX);
    let radian = Math.atan(tanVal);
    angle = (radian * 180) / Math.PI;

    let centerX = 0;
    let centerY = 0;

    if (sideX * sideX + sideY * sideY >= outerRadius * outerRadius) {
      centerX = outerRadius * Math.cos(radian);
      centerY = outerRadius * Math.sin(radian);
    } else {
      centerX = Math.abs(sideX) > outerRadius ? outerRadius : Math.abs(sideX);
      centerY = Math.abs(sideY) > outerRadius ? outerRadius : Math.abs(sideY);
    }

    if (sideY < 0) {
      centerY = -Math.abs(centerY);
    }
    if (sideX < 0) {
      centerX = -Math.abs(centerX);
    }

    if (sideX > 0 && sideY < 0) {
      // < 90
    } else if (sideX < 0 && sideY < 0) {
      // 90 ~ 180
      angle = 180 - angle;
    } else if (sideX < 0 && sideY > 0) {
      // 180 ~ 270
      angle = angle + 180;
    } else if (sideX > 0 && sideY > 0) {
      // 270 ~ 369
      angle = 360 - angle;
    }
    centerPoint.set(centerX, centerY);
    power = getPower(centerPoint);

    direction = getDirection(centerPoint);
    innerPositionX.set(centerPoint.x);
    innerPositionY.set(centerPoint.y);
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
        g.circle(0, 0, outerRadius).fill(settings.outerColor);
      },
      alpha: 0.5,
    });
  } else {
    outerElement = h(Sprite, {
      image: settings.outer,
      anchor: { x: 0.5, y: 0.5 },
      scale: settings.outerScale,
    });
  }

  const innerOptions: any = {
    scale: settings.innerScale,
    x: innerPositionX,
    y: innerPositionY,
    alpha: innerAlpha,
  };

  if (!settings.inner) {
    innerElement = h(Graphics, {
      draw: (g) => {
        g.circle(0, 0, innerRadius * 2.5).fill(settings.innerColor);
      },
      ...innerOptions,
    });
  } else {
    innerElement = settings.inner
  }

  return h(
    Container,
    {
      ...opts,
      pointerdown: handleDragStart,
      pointerup: handleDragEnd,
      pointerupoutside: handleDragEnd,
      pointermove: handleDragMove,
    },
    outerElement,
    innerElement,
  );
}
