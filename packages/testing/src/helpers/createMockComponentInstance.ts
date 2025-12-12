import { ComponentInstance } from 'canvasengine';
import { MockContainer, MockSprite, MockText, MockGraphics, MockMesh, MockTilingSprite, MockNineSlicePlane, MockDOMElement, MockDOMContainer, MockTexture } from '../mocks/pixi-base';

/**
 * Creates a mock ComponentInstance based on the component type
 * 
 * This helper function creates appropriate mock instances for different component types.
 * It's useful when you need a ComponentInstance but don't want to use the real PixiJS implementation.
 * 
 * @param componentType - The type of component to create a mock for
 * @returns A mock ComponentInstance appropriate for the component type
 * 
 * @example
 * ```typescript
 * const containerInstance = createMockComponentInstance('Container');
 * const spriteInstance = createMockComponentInstance('Sprite');
 * ```
 */
export function createMockComponentInstance(componentType: string): ComponentInstance {
  switch (componentType.toLowerCase()) {
    case 'container':
      return new MockContainer() as any;
    case 'sprite':
      return new MockSprite() as any;
    case 'text':
      return new MockText() as any;
    case 'graphics':
    case 'rect':
    case 'circle':
    case 'ellipse':
    case 'triangle':
    case 'svg':
      return new MockGraphics() as any;
    case 'mesh':
      return new MockMesh() as any;
    case 'tilingsprite':
      return new MockTilingSprite(new MockTexture()) as any;
    case 'nineslicesprite':
      return new MockNineSlicePlane(new MockTexture()) as any;
    case 'domelement':
      return new MockDOMElement() as any;
    case 'domcontainer':
      return new MockDOMContainer() as any;
    default:
      // Default to Container for unknown types
      return new MockContainer() as any;
  }
}
