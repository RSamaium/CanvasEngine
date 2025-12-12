# Testing Examples

This directory contains example tests demonstrating how to use the `@canvasengine/testing` package.

## Running Tests

To run the tests, use:

```bash
npm test
```

Or to run once:

```bash
npm run test:run
```

## Example Test File

The `example.spec.ts` file demonstrates:

- Creating mock elements with `createMockElement`
- Using PixiJS mocks directly (`MockContainer`, `MockSprite`, etc.)
- Spying on element methods and properties with `spyOnElement`
- Testing real-world scenarios like parent-child relationships
- Testing event handling
- Testing element properties and state

## Key Concepts

### Creating Mock Elements

```typescript
import { createMockElement } from '@canvasengine/testing';

const element = createMockElement('Container', { x: 100, y: 50 });
```

### Using PixiJS Mocks

```typescript
import { MockContainer, MockSprite } from '@canvasengine/testing';

const container = new MockContainer();
const sprite = new MockSprite();
container.addChild(sprite);
```

### Spying on Elements

```typescript
import { createMockElement, spyOnElement } from '@canvasengine/testing';

const element = createMockElement('Container');
const spy = spyOnElement(element, 'addChild');
element.componentInstance.addChild(new MockSprite());
expect(spy).toHaveBeenCalled();
```

## More Information

For complete documentation, see the [Testing Package Documentation](/api/testing).
