# Testing Package

The `@canvasengine/testing` package provides comprehensive testing utilities and mocks for CanvasEngine. It allows you to test your CanvasEngine components without requiring a full PixiJS environment or jsdom setup.

## Installation

```bash
npm install @canvasengine/testing --save-dev
```

or with pnpm:

```bash
pnpm add @canvasengine/testing --save-dev
```

## Overview

The testing package includes:

- **PixiJS Mocks**: Complete mocks for all PixiJS classes used in CanvasEngine (Container, Sprite, Text, Application, etc.)
- **Element Helpers**: Utilities to create mock elements with spyable `componentInstance`
- **Spy Utilities**: Helpers to easily spy on element properties and methods

## PixiJS Mocks

The package provides mocks for all major PixiJS classes:

- `MockContainer` - Mock for PixiJS Container
- `MockSprite` - Mock for PixiJS Sprite
- `MockText` - Mock for PixiJS Text
- `MockGraphics` - Mock for PixiJS Graphics
- `MockMesh` - Mock for PixiJS Mesh
- `MockTilingSprite` - Mock for PixiJS TilingSprite
- `MockNineSlicePlane` - Mock for PixiJS NineSlicePlane
- `MockDOMElement` - Mock for PixiJS DOMElement
- `MockDOMContainer` - Mock for PixiJS DOMContainer
- `MockApplication` - Mock for PixiJS Application
- `MockTexture` - Mock for PixiJS Texture
- `MockRectangle` - Mock for PixiJS Rectangle
- `MockObservablePoint` - Mock for PixiJS ObservablePoint
- `MockVideoResource` - Mock for PixiJS VideoResource

All mocks include:
- Essential properties (x, y, width, height, alpha, visible, rotation, etc.)
- Methods mocked with `vi.fn()` for easy spying
- Event support (on, off, emit)
- Child management for Container-based mocks

### Using PixiJS Mocks

```typescript
import { MockContainer, MockSprite } from '@canvasengine/testing';

// Create a mock container
const container = new MockContainer();
container.x = 100;
container.y = 50;
container.width = 200;
container.height = 150;

// Create a mock sprite
const sprite = new MockSprite();
sprite.x = 10;
sprite.y = 10;

// Add sprite to container
container.addChild(sprite);

// Spy on methods
import { vi } from 'vitest';
const addChildSpy = vi.spyOn(container, 'addChild');
container.addChild(new MockContainer());
expect(addChildSpy).toHaveBeenCalled();
```

## Creating Mock Elements

The `createMockElement` helper creates a complete mock Element with all required properties.

### Basic Usage

```typescript
import { createMockElement } from '@canvasengine/testing';

// Create a basic element with default mock
const element = createMockElement('Container', { x: 100, y: 50 });

expect(element.tag).toBe('Container');
expect(element.props.x).toBe(100);
expect(element.componentInstance.x).toBe(100);
```

### With Custom ComponentInstance

```typescript
import { createMockElement, MockSprite } from '@canvasengine/testing';

// Create an element with custom componentInstance
const customInstance = new MockSprite();
const spriteElement = createMockElement('Sprite', { 
  image: 'hero.png',
  x: 200,
  y: 100
}, customInstance);

expect(spriteElement.componentInstance).toBe(customInstance);
expect(spriteElement.componentInstance.x).toBe(200);
```

### Accessing componentInstance

The `componentInstance` property contains the mock PixiJS instance, which you can spy upon:

```typescript
import { createMockElement } from '@canvasengine/testing';
import { vi } from 'vitest';

const element = createMockElement('Container', { x: 100 });

// Access the componentInstance
const instance = element.componentInstance;
expect(instance.x).toBe(100);

// Spy on properties or methods
const xSpy = vi.spyOn(instance, 'x', 'get');
const addChildSpy = vi.spyOn(instance, 'addChild');
```

## Spying on Elements

The `spyOnElement` helper makes it easy to spy on element properties and methods.

### Spying on a Single Property

```typescript
import { createMockElement, spyOnElement } from '@canvasengine/testing';

const element = createMockElement('Container', { x: 100 });

// Spy on a property
const spy = spyOnElement(element, 'x');
element.componentInstance.x = 200;

// Note: For property setters, you may need to use vi.spyOn directly
// depending on your testing needs
```

### Spying on Methods

```typescript
import { createMockElement, spyOnElement } from '@canvasengine/testing';

const element = createMockElement('Container');

// Spy on a method
const addChildSpy = spyOnElement(element, 'addChild');

element.componentInstance.addChild(new MockContainer());

expect(addChildSpy).toHaveBeenCalled();
```

### Spying on Multiple Properties

```typescript
import { createMockElement, spyOnElementMultiple } from '@canvasengine/testing';

const element = createMockElement('Container');

// Spy on multiple methods at once
const spies = spyOnElementMultiple(element, ['addChild', 'removeChild', 'destroy']);

element.componentInstance.addChild(new MockContainer());
element.componentInstance.removeChild(element.componentInstance.children[0]);
element.componentInstance.destroy();

expect(spies.addChild).toHaveBeenCalled();
expect(spies.removeChild).toHaveBeenCalled();
expect(spies.destroy).toHaveBeenCalled();
```

## Creating Mock Component Instances

The `createMockComponentInstance` helper creates appropriate mock instances based on component type:

```typescript
import { createMockComponentInstance } from '@canvasengine/testing';

const containerInstance = createMockComponentInstance('Container');
const spriteInstance = createMockComponentInstance('Sprite');
const textInstance = createMockComponentInstance('Text');
```

## Common Use Cases

### Testing Component Logic

```typescript
import { describe, test, expect, vi } from 'vitest';
import { createMockElement, spyOnElement } from '@canvasengine/testing';

describe('MyComponent', () => {
  test('should update position', () => {
    const element = createMockElement('Container', { x: 0, y: 0 });
    
    // Your component logic that updates position
    element.componentInstance.x = 100;
    element.componentInstance.y = 50;
    
    expect(element.componentInstance.x).toBe(100);
    expect(element.componentInstance.y).toBe(50);
  });

  test('should add children', () => {
    const parent = createMockElement('Container');
    const child = createMockElement('Sprite');
    
    const addChildSpy = spyOnElement(parent, 'addChild');
    parent.componentInstance.addChild(child.componentInstance);
    
    expect(addChildSpy).toHaveBeenCalledWith(child.componentInstance);
    expect(parent.componentInstance.children).toContain(child.componentInstance);
  });
});
```

### Testing Directives

```typescript
import { describe, test, expect } from 'vitest';
import { createMockElement } from '@canvasengine/testing';

describe('MyDirective', () => {
  test('should apply directive to element', () => {
    const element = createMockElement('Sprite', { x: 100, y: 100 });
    
    // Apply your directive
    // directive.onInit(element);
    
    // Test directive behavior
    // expect(element.directives.myDirective).toBeDefined();
  });
});
```

### Testing Event Handlers

```typescript
import { describe, test, expect } from 'vitest';
import { createMockElement } from '@canvasengine/testing';

describe('Event Handling', () => {
  test('should handle click events', () => {
    const element = createMockElement('Sprite');
    const clickHandler = vi.fn();
    
    element.componentInstance.on('click', clickHandler);
    element.componentInstance.emit('click', { x: 100, y: 100 });
    
    expect(clickHandler).toHaveBeenCalledWith({ x: 100, y: 100 });
  });
});
```

## Migration from Manual Mocks

If you're currently creating manual mocks in your tests, you can migrate to use `@canvasengine/testing`:

### Before

```typescript
// Manual mock
class MockContainer {
  x = 0;
  y = 0;
  children = [];
  addChild() {}
}

const element = {
  tag: 'Container',
  props: { x: 100 },
  componentInstance: new MockContainer(),
  // ... other properties
};
```

### After

```typescript
import { createMockElement } from '@canvasengine/testing';

const element = createMockElement('Container', { x: 100 });
// All properties are automatically set up
```

## Best Practices

1. **Use createMockElement for Elements**: Always use `createMockElement` when you need an Element in tests. It ensures all required properties are present.

2. **Spy on componentInstance**: Use `spyOnElement` to spy on the PixiJS instance methods and properties.

3. **Use Appropriate Mocks**: Use the specific mock class (MockSprite, MockText, etc.) when you need a particular PixiJS class.

4. **Test Behavior, Not Implementation**: Focus on testing the behavior of your components rather than internal PixiJS implementation details.

5. **Clean Up**: The mocks are lightweight and don't require cleanup, but if you're using spies, remember to clear them between tests if needed.

## TypeScript Support

The package is fully typed and provides TypeScript definitions for all mocks and helpers. You'll get full autocomplete and type checking in your tests.

```typescript
import { createMockElement, Element, ComponentInstance } from '@canvasengine/testing';

const element: Element<ComponentInstance> = createMockElement('Container');
```

## Using Mocks with bootstrapCanvas

The `bootstrapCanvas` function supports component registration configuration, allowing you to use mocks for testing.

### mockComponents

The `mockComponents` object provides a mapping of all CanvasEngine component names to their corresponding mock classes. You can import it from `@canvasengine/testing`:

```typescript
import { mockComponents } from '@canvasengine/testing';
```

### Registering All Mocks

To register all components as mocks:

```typescript
import { bootstrapCanvas } from 'canvasengine';
import { mockComponents } from '@canvasengine/testing';

await bootstrapCanvas(rootElement, MyComponent, {
  components: mockComponents,
  autoRegister: false // Only register the specified (mocked) components
});
```

### Registering Specific Mocks

To register only specific components as mocks while keeping others as real components:

```typescript
import { bootstrapCanvas } from 'canvasengine';
import { MockSprite, MockContainer, mockComponents } from '@canvasengine/testing';

await bootstrapCanvas(rootElement, MyComponent, {
  components: {
    Sprite: MockSprite,
    Container: MockContainer,
    // Other components will be registered normally
  },
  autoRegister: true // Register all default components, then override with mocks
});
```

### Overriding Specific Components

To register all default components but override specific ones with mocks:

```typescript
import { bootstrapCanvas } from 'canvasengine';
import { MockSprite } from '@canvasengine/testing';

await bootstrapCanvas(rootElement, MyComponent, {
  components: {
    Sprite: MockSprite // Replace Sprite with mock, keep others as real
  },
  autoRegister: true // Register all default components first
});
```

### Available Mock Components

The `mockComponents` object includes mappings for:

- `Canvas` → `MockContainer`
- `Container` → `MockContainer`
- `Sprite` → `MockSprite`
- `Text` → `MockText`
- `Graphics`, `Rect`, `Circle`, `Ellipse`, `Triangle`, `Svg` → `MockGraphics`
- `Mesh` → `MockMesh`
- `TilingSprite` → `MockTilingSprite`
- `NineSliceSprite` → `MockNineSlicePlane`
- `DOMContainer` → `MockDOMContainer`
- `DOMElement` → `MockDOMElement`
- `Viewport` → `MockContainer`
- `ParticlesEmitter` → `MockContainer`

You can access individual mocks directly:

```typescript
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
  mockComponents
} from '@canvasengine/testing';
```

## API Reference

### mockComponents

```typescript
const mockComponents: {
  readonly Canvas: typeof MockContainer;
  readonly Container: typeof MockContainer;
  readonly Sprite: typeof MockSprite;
  readonly Text: typeof MockText;
  readonly Graphics: typeof MockGraphics;
  readonly Rect: typeof MockGraphics;
  readonly Circle: typeof MockGraphics;
  readonly Ellipse: typeof MockGraphics;
  readonly Triangle: typeof MockGraphics;
  readonly Svg: typeof MockGraphics;
  readonly Mesh: typeof MockMesh;
  readonly TilingSprite: typeof MockTilingSprite;
  readonly NineSliceSprite: typeof MockNineSlicePlane;
  readonly DOMContainer: typeof MockDOMContainer;
  readonly DOMElement: typeof MockDOMElement;
  readonly Viewport: typeof MockContainer;
  readonly ParticlesEmitter: typeof MockContainer;
}
```

Mapping of CanvasEngine component names to their corresponding mock classes. Can be used directly with `bootstrapCanvas()`.

### createMockElement

```typescript
function createMockElement<T extends ComponentInstance = ComponentInstance>(
  tag: string,
  props?: Props,
  componentInstance?: T
): Element<T>
```

Creates a mock Element with all required properties.

### createMockComponentInstance

```typescript
function createMockComponentInstance(componentType: string): ComponentInstance
```

Creates a mock ComponentInstance based on the component type.

### spyOnElement

```typescript
function spyOnElement<T extends ComponentInstance>(
  element: Element<T>,
  property: keyof T | string
): ReturnType<typeof vi.spyOn>
```

Creates a spy on a property or method of an element's componentInstance.

### spyOnElementMultiple

```typescript
function spyOnElementMultiple<T extends ComponentInstance>(
  element: Element<T>,
  properties: (keyof T | string)[]
): Record<string, ReturnType<typeof vi.spyOn>>
```

Creates spies on multiple properties or methods at once.
