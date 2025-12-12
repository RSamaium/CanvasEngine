import { Element, Props } from 'canvasengine';
import { ComponentInstance } from 'canvasengine';
import { Subject } from 'rxjs';
import { createMockComponentInstance } from './createMockComponentInstance';

/**
 * Creates a mock Element with all required properties
 * 
 * This function creates a complete mock Element that can be used in tests.
 * The element includes a mock componentInstance (PixiJS instance) that can be spied upon.
 * 
 * @param tag - The tag name of the element (e.g., 'Container', 'Sprite')
 * @param props - Optional props to assign to the element
 * @param componentInstance - Optional custom componentInstance. If not provided, a default mock will be created
 * @returns A complete mock Element with all required properties
 * 
 * @example
 * ```typescript
 * // Create a basic element with default mock
 * const element = createMockElement('Container', { x: 100, y: 50 });
 * 
 * // Create an element with custom componentInstance
 * const customInstance = new MockSprite();
 * const spriteElement = createMockElement('Sprite', { image: 'hero.png' }, customInstance);
 * 
 * // Access and spy on componentInstance
 * expect(element.componentInstance.x).toBe(100);
 * ```
 */
export function createMockElement<T extends ComponentInstance = ComponentInstance>(
  tag: string,
  props: Props = {},
  componentInstance?: T
): Element<T> {
  const instance = componentInstance || (createMockComponentInstance(tag) as T);

  // Apply props to componentInstance if they are standard PixiJS properties
  if (instance && typeof instance === 'object') {
    Object.keys(props).forEach(key => {
      if (key in instance && !['children', 'context'].includes(key)) {
        (instance as any)[key] = props[key];
      }
    });
  }

  const element: Element<T> = {
    tag,
    props: { ...props },
    componentInstance: instance,
    propSubscriptions: [],
    propObservables: undefined,
    parent: null,
    context: undefined,
    directives: {},
    destroy: () => {
      // Mock destroy implementation
      element.propSubscriptions.forEach(sub => sub.unsubscribe());
      element.effectSubscriptions.forEach(sub => sub.unsubscribe());
      element.effectUnmounts.forEach(fn => {
        if (typeof fn === 'function') {
          fn();
        }
      });
    },
    allElements: new Subject(),
    isFrozen: false,
    effectSubscriptions: [],
    effectMounts: [],
    effectUnmounts: [],
  };

  return element;
}
