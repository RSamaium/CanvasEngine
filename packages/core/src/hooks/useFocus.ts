import { Signal } from "@signe/reactive";
import { Element } from "../engine/reactive";
import { focusManager } from "../engine/FocusManager";
import { effect } from "@signe/reactive";

/**
 * Get the current focus index signal for a container
 * 
 * Returns a reactive signal that updates when the focus index changes.
 * 
 * @param containerId - Container identifier
 * @returns Signal for current focus index, or null if container not found
 * 
 * @example
 * ```typescript
 * const focusIndex = useFocusIndex('myContainer');
 * effect(() => {
 *   console.log('Current focus index:', focusIndex?.());
 * });
 * ```
 */
export function useFocusIndex(containerId: string): Signal<number | null> | null {
  return focusManager.getCurrentIndexSignal(containerId);
}

/**
 * Get the current focused element signal for a container
 * 
 * Returns a reactive signal that updates when the focused element changes.
 * 
 * @param containerId - Container identifier
 * @returns Signal for current focused element, or null if container not found
 * 
 * @example
 * ```typescript
 * const focusedElement = useFocusedElement('myContainer');
 * effect(() => {
 *   const element = focusedElement?.();
 *   if (element) {
 *     console.log('Focused element:', element);
 *   }
 * });
 * ```
 */
export function useFocusedElement(containerId: string): Signal<Element | null> | null {
  return focusManager.getFocusedElementSignal(containerId);
}

/**
 * Hook to react to focus changes
 * 
 * Sets up a reactive effect that calls the callback whenever the focus changes.
 * 
 * @param containerId - Container identifier
 * @param callback - Function to call when focus changes
 * @returns Cleanup function to unsubscribe
 * 
 * @example
 * ```typescript
 * useFocusChange('myContainer', (index, element) => {
 *   console.log('Focus changed to index', index);
 *   if (element) {
 *     console.log('Focused element:', element);
 *   }
 * });
 * ```
 */
export function useFocusChange(
  containerId: string,
  callback: (index: number | null, element: Element | null) => void
): () => void {
  const indexSignal = focusManager.getCurrentIndexSignal(containerId);
  const elementSignal = focusManager.getFocusedElementSignal(containerId);

  if (!indexSignal || !elementSignal) {
    console.warn(`FocusContainer with id "${containerId}" not found`);
    return () => {};
  }

  // Set up reactive effect
  const subscription = effect(() => {
    const index = indexSignal();
    const element = elementSignal();
    callback(index, element);
  });

  // Return cleanup function
  return () => {
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
    }
  };
}

