import { describe, expect, test } from 'vitest';
import { Button } from 'canvasengine';

describe('Button', () => {
  test('overlays default background and text inside the button box', () => {
    const button = Button({
      shape: 'circle',
      width: 68,
      height: 68,
      text: 'A',
    });
    const [background, label] = button.props.children;

    expect(button.props.width).toBe(68);
    expect(button.props.height).toBe(68);
    expect(button.props.display).toBe('flex');
    expect(button.props.justifyContent).toBe('center');
    expect(button.props.alignItems).toBe('center');
    expect(background.props.positionType).toBe('absolute');
    expect(background.props.x).toBe(0);
    expect(background.props.y).toBe(0);
    expect(label.props.text).toBe('A');
  });
});
