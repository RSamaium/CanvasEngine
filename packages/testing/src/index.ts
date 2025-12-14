/**
 * @canvasengine/testing
 * 
 * Testing utilities and mocks for CanvasEngine
 * 
 * This package provides comprehensive mocks for PixiJS classes and helpers
 * for creating mock elements that can be used in tests without requiring
 * a full PixiJS environment or jsdom setup.
 */

// Export all PixiJS mocks
export {
  MockContainer,
  MockSprite,
  MockText,
  MockGraphics,
  MockMesh,
  MockTilingSprite,
  MockNineSlicePlane,
  MockDOMElement,
  MockDOMContainer,
  MockApplication,
  MockTexture,
  MockRectangle,
  MockObservablePoint,
  MockVideoResource,
} from './mocks/pixi-base';

// Import mocks for the mapping
import {
  MockContainer,
  MockSprite,
  MockText,
  MockGraphics,
  MockMesh,
  MockTilingSprite,
  MockNineSlicePlane,
  MockDOMElement,
  MockDOMContainer,
} from './mocks/pixi-base';

// Export helpers
export {
  createMockElement,
} from './helpers/createMockElement';

export {
  createMockComponentInstance,
} from './helpers/createMockComponentInstance';

export {
  spyOnElement,
  spyOnElementMultiple,
} from './helpers/spyOnElement';

// Re-export types from canvasengine for convenience
export type {
  Element,
  Props,
  ComponentInstance,
} from 'canvasengine';

/**
 * Mapping of CanvasEngine component names to their corresponding mock classes.
 * 
 * This object can be used with bootstrapCanvas() to register mock components for testing.
 * 
 * @example
 * ```typescript
 * import { mockComponents } from '@canvasengine/testing';
 * 
 * await bootstrapCanvas(rootElement, MyComponent, {
 *   components: mockComponents,
 *   autoRegister: false
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Use specific mocks only
 * import { mockComponents, MockSprite } from '@canvasengine/testing';
 * 
 * await bootstrapCanvas(rootElement, MyComponent, {
 *   components: {
 *     Sprite: MockSprite,
 *     Container: mockComponents.Container
 *   }
 * });
 * ```
 */
export const mockComponents = {
  Canvas: MockContainer,
  Container: MockContainer,
  Sprite: MockSprite,
  Text: MockText,
  Graphics: MockGraphics,
  Rect: MockGraphics,
  Circle: MockGraphics,
  Ellipse: MockGraphics,
  Triangle: MockGraphics,
  Svg: MockGraphics,
  Mesh: MockMesh,
  TilingSprite: MockTilingSprite,
  NineSliceSprite: MockNineSlicePlane,
  DOMContainer: MockDOMContainer,
  DOMElement: MockDOMElement,
  Viewport: MockContainer, // Viewport extends Container
  ParticlesEmitter: MockContainer, // ParticlesEmitter extends Container
} as const;
