import { describe, expect, test } from 'vitest';
import { Joystick } from 'canvasengine';

describe('Joystick', () => {
  test('creates a centered layout box by default', () => {
    const joystick = Joystick();
    const [outer, inner] = joystick.props.children;

    expect(joystick.props.width).toBe(140);
    expect(joystick.props.height).toBe(140);
    expect(outer.props.positionType).toBe('absolute');
    expect(inner.props.width).toBe(50);
    expect(inner.props.height).toBe(50);
    expect(inner.props.x).toBe(45);
    expect(inner.props.y).toBe(45);
    expect(inner.props.positionType).toBe('absolute');
  });

  test('preserves explicit layout dimensions', () => {
    const joystick = Joystick({ width: 180, height: 180 });

    expect(joystick.props.width).toBe(180);
    expect(joystick.props.height).toBe(180);
  });
});
