import { vi } from 'vitest';
import { Element, ComponentInstance } from 'canvasengine';

/**
 * Creates a spy on a property or method of an element's componentInstance
 * 
 * This helper makes it easy to spy on the PixiJS instance (componentInstance) of an element.
 * It's a convenience wrapper around vi.spyOn that targets element.componentInstance.
 * 
 * @param element - The element whose componentInstance should be spied upon
 * @param property - The property or method name to spy on
 * @returns A Vitest spy object
 * 
 * @example
 * ```typescript
 * const element = createMockElement('Container', { x: 100 });
 * 
 * // Spy on a property getter/setter
 * const xSpy = spyOnElement(element, 'x');
 * element.componentInstance.x = 200;
 * expect(xSpy).toHaveBeenCalled();
 * 
 * // Spy on a method
 * const addChildSpy = spyOnElement(element, 'addChild');
 * element.componentInstance.addChild(new MockContainer());
 * expect(addChildSpy).toHaveBeenCalled();
 * ```
 */
export function spyOnElement<T extends ComponentInstance>(
  element: Element<T>,
  property: keyof T | string
): ReturnType<typeof vi.spyOn> {
  if (!element.componentInstance) {
    throw new Error('Element componentInstance is not defined');
  }

  return vi.spyOn(element.componentInstance as any, property as string);
}

/**
 * Creates spies on multiple properties or methods of an element's componentInstance
 * 
 * This helper allows you to spy on multiple properties/methods at once.
 * 
 * @param element - The element whose componentInstance should be spied upon
 * @param properties - Array of property or method names to spy on
 * @returns An object with spy objects keyed by property name
 * 
 * @example
 * ```typescript
 * const element = createMockElement('Container');
 * const spies = spyOnElementMultiple(element, ['addChild', 'removeChild', 'destroy']);
 * 
 * element.componentInstance.addChild(new MockContainer());
 * expect(spies.addChild).toHaveBeenCalled();
 * ```
 */
export function spyOnElementMultiple<T extends ComponentInstance>(
  element: Element<T>,
  properties: (keyof T | string)[]
): Record<string, ReturnType<typeof vi.spyOn>> {
  const spies: Record<string, ReturnType<typeof vi.spyOn>> = {};
  
  properties.forEach(property => {
    spies[property as string] = spyOnElement(element, property);
  });
  
  return spies;
}
