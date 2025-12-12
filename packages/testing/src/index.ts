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
