import { signal, Signal } from "@signe/reactive";
import { Element } from "./reactive";
import { CanvasViewport } from "../components/Viewport";

/**
 * Options for scroll behavior when navigating to focused elements
 * 
 * @property padding - Padding around the element in pixels (default: 0)
 * @property smooth - Enable smooth scrolling animation (default: false)
 * @property center - Center the element in the viewport (default: true)
 * @property duration - Animation duration in ms if smooth=true (default: 300)
 */
export interface ScrollOptions {
  padding?: number;
  smooth?: boolean;
  center?: boolean;
  duration?: number;
}

/**
 * Data structure for a focus container
 */
interface FocusContainerData {
  id: string;
  focusables: Map<number, Element>;
  currentIndex: Signal<number | null>;
  focusedElement: Signal<Element | null>;
  onFocusChange?: (index: number, element: Element | null) => void;
  autoScroll?: boolean | ScrollOptions;
  viewport?: CanvasViewport;
  throttle?: number;
  lastNavigateTime?: number;
}

/**
 * Central manager for focus navigation system
 * 
 * Manages focusable elements within containers, handles navigation,
 * and provides scroll integration with Viewport.
 * 
 * @example
 * ```typescript
 * const manager = FocusManager.getInstance();
 * manager.registerContainer('menu', containerData);
 * manager.navigate('menu', 'next');
 * ```
 */
export class FocusManager {
  private static instance: FocusManager | null = null;
  private containers: Map<string, FocusContainerData> = new Map();
  private scrollAnimations: Map<string, { startTime: number; startX: number; startY: number; targetX: number; targetY: number; duration: number }> = new Map();

  /**
   * Get the singleton instance of FocusManager
   * 
   * @returns The FocusManager instance
   */
  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }

  /**
   * Register a focus container
   * 
   * @param id - Unique identifier for the container
   * @param data - Container data including signals and callbacks
   */
  registerContainer(id: string, data: Omit<FocusContainerData, 'id'>): void {
    this.containers.set(id, { ...data, id });
  }

  /**
   * Unregister a focus container
   * 
   * @param id - Container identifier to remove
   */
  unregisterContainer(id: string): void {
    this.containers.delete(id);
    this.scrollAnimations.delete(id);
  }

  /**
   * Register a focusable element in a container
   * 
   * @param containerId - Container identifier
   * @param element - Element to register
   * @param index - Focus index for this element
   */
  registerFocusable(containerId: string, element: Element, index: number): void {
    const container = this.containers.get(containerId);
    if (!container) {
      console.warn(`FocusContainer with id "${containerId}" not found`);
      return;
    }
    container.focusables.set(index, element);
  }

  /**
   * Unregister a focusable element from a container
   * 
   * @param containerId - Container identifier
   * @param index - Focus index to remove
   */
  unregisterFocusable(containerId: string, index: number): void {
    const container = this.containers.get(containerId);
    if (!container) return;
    container.focusables.delete(index);
  }

  /**
   * Navigate to next or previous focusable element
   * 
   * @param containerId - Container identifier
   * @param direction - Navigation direction ('next' or 'previous')
   */
  navigate(containerId: string, direction: 'next' | 'previous'): void {
    const container = this.containers.get(containerId);
    if (!container) {
      return;
    }

    // Handle throttling
    if (container.throttle) {
      const now = Date.now();
      const lastTime = container.lastNavigateTime || 0;
      if (now - lastTime < container.throttle) {
        return;
      }
      container.lastNavigateTime = now;
    }

    const currentIndex = container.currentIndex();
    const focusableIndices = Array.from(container.focusables.keys()).sort((a, b) => a - b);

    if (focusableIndices.length === 0) return;

    let newIndex: number | null = null;

    if (currentIndex === null) {
      // No current focus, go to first or last
      newIndex = direction === 'next' ? focusableIndices[0] : focusableIndices[focusableIndices.length - 1];
    } else {
      const currentIndexPos = focusableIndices.indexOf(currentIndex);
      if (direction === 'next') {
        if (currentIndexPos < focusableIndices.length - 1) {
          newIndex = focusableIndices[currentIndexPos + 1];
        } else {
          // Wrap around to first
          newIndex = focusableIndices[0];
        }
      } else {
        if (currentIndexPos > 0) {
          newIndex = focusableIndices[currentIndexPos - 1];
        } else {
          // Wrap around to last
          newIndex = focusableIndices[focusableIndices.length - 1];
        }
      }
    }

    if (newIndex !== null) {
      this.setIndex(containerId, newIndex);
    }
  }

  /**
   * Set the focus index for a container
   * 
   * @param containerId - Container identifier
   * @param index - Focus index to set
   */
  setIndex(containerId: string, index: number): void {
    const container = this.containers.get(containerId);
    if (!container) return;

    const element = container.focusables.get(index);
    if (!element) {
      console.warn(`No focusable element at index ${index} in container "${containerId}"`);
      return;
    }

    container.currentIndex.set(index);
    container.focusedElement.set(element);

    // Trigger callback
    if (container.onFocusChange) {
      container.onFocusChange(index, element);
    }
    // Handle DOM focus and scrolling
    const instance = element.componentInstance as any;
    if (instance && instance.element && typeof instance.element.focus === 'function') {
      const domElement = instance.element as HTMLElement;
      // Focus the native DOM element so :focus styles apply
      domElement.focus();

      // Scroll the element into view, centering it in the scrollable parent
      if (typeof domElement.scrollIntoView === 'function') {
        domElement.scrollIntoView({
          block: 'center',
          behavior: 'smooth'
        });
      }
    }

    // Handle auto-scroll if enabled
    if (container.autoScroll) {
      const viewport = container.viewport;
      if (viewport) {
        const options: ScrollOptions = typeof container.autoScroll === 'boolean'
          ? { center: true }
          : container.autoScroll;
        this.scrollToElement(containerId, index, viewport, options);
      }
    }
  }

  /**
   * Get the element at a specific index
   * 
   * @param containerId - Container identifier
   * @param index - Focus index
   * @returns Element at index or null
   */
  getElement(containerId: string, index: number): Element | null {
    const container = this.containers.get(containerId);
    if (!container) return null;
    return container.focusables.get(index) || null;
  }

  /**
   * Get current focus index for a container
   * 
   * @param containerId - Container identifier
   * @returns Current index signal
   */
  getCurrentIndexSignal(containerId: string): Signal<number | null> | null {
    const container = this.containers.get(containerId);
    return container ? container.currentIndex : null;
  }

  /**
   * Get current focused element signal for a container
   * 
   * @param containerId - Container identifier
   * @returns Current element signal
   */
  getFocusedElementSignal(containerId: string): Signal<Element | null> | null {
    const container = this.containers.get(containerId);
    return container ? container.focusedElement : null;
  }

  /**
   * Check if an element is visible in the viewport
   * 
   * @param element - Element to check
   * @param viewport - Viewport to check against (optional)
   * @returns True if element is visible
   */
  isElementVisible(element: Element, viewport?: CanvasViewport): boolean {
    if (!viewport) return true;

    const bounds = this.getElementBounds(element);
    const visibleBounds = viewport.getVisibleBounds();

    return (
      bounds.x < visibleBounds.right &&
      bounds.x + bounds.width > visibleBounds.left &&
      bounds.y < visibleBounds.bottom &&
      bounds.y + bounds.height > visibleBounds.top
    );
  }

  /**
   * Get global bounds of an element
   * 
   * @param element - Element to get bounds for
   * @returns Bounds object with x, y, width, height
   */
  getElementBounds(element: Element): { x: number; y: number; width: number; height: number } {
    const instance = element.componentInstance;
    if (!instance) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Get local bounds
    const localBounds = instance.getLocalBounds();

    // Get global position
    const globalPos = instance.getGlobalPosition();

    return {
      x: globalPos.x,
      y: globalPos.y,
      width: localBounds.width,
      height: localBounds.height
    };
  }

  /**
   * Scroll viewport to show an element
   * 
   * @param containerId - Container identifier
   * @param index - Focus index of element to scroll to
   * @param viewport - Viewport instance (optional, uses container's viewport if not provided)
   * @param options - Scroll options
   */
  scrollToElement(
    containerId: string,
    index: number,
    viewport?: CanvasViewport,
    options: ScrollOptions = {}
  ): void {
    const container = this.containers.get(containerId);
    if (!container) return;

    const element = container.focusables.get(index);
    if (!element) return;

    const targetViewport = viewport || container.viewport;
    if (!targetViewport) return;

    const bounds = this.getElementBounds(element);
    const visibleBounds = targetViewport.getVisibleBounds();
    const padding = options.padding || 0;
    const center = options.center !== false; // Default to true
    const smooth = options.smooth || false;
    const duration = options.duration || 300;

    // Check if element is already visible
    if (this.isElementVisible(element, targetViewport)) {
      // Element is visible, but check if we need to center it
      if (center) {
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;

        if (smooth) {
          this.animateScroll(containerId, targetViewport, centerX, centerY, duration);
        } else {
          targetViewport.moveCenter(centerX, centerY);
        }
      }
      return;
    }

    // Element is not visible, scroll to it
    if (center) {
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      if (smooth) {
        this.animateScroll(containerId, targetViewport, centerX, centerY, duration);
      } else {
        targetViewport.moveCenter(centerX, centerY);
      }
    } else {
      // Scroll to make element visible with padding
      const targetX = bounds.x - padding;
      const targetY = bounds.y - padding;
      const targetWidth = bounds.width + padding * 2;
      const targetHeight = bounds.height + padding * 2;

      if (smooth) {
        // For smooth fit, we'll animate to center
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        this.animateScroll(containerId, targetViewport, centerX, centerY, duration);
      } else {
        targetViewport.fit(targetX, targetY, targetWidth, targetHeight, padding);
      }
    }
  }

  /**
   * Animate smooth scrolling
   * 
   * @param containerId - Container identifier
   * @param viewport - Viewport instance
   * @param targetX - Target X position
   * @param targetY - Target Y position
   * @param duration - Animation duration in ms
   */
  private animateScroll(
    containerId: string,
    viewport: CanvasViewport,
    targetX: number,
    targetY: number,
    duration: number
  ): void {
    const currentCenter = viewport.center;
    const startX = currentCenter.x;
    const startY = currentCenter.y;

    const animation = {
      startTime: Date.now(),
      startX,
      startY,
      targetX,
      targetY,
      duration
    };

    this.scrollAnimations.set(containerId, animation);

    // Use requestAnimationFrame for smooth animation
    const animate = () => {
      const anim = this.scrollAnimations.get(containerId);
      if (!anim) return;

      const elapsed = Date.now() - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentX = anim.startX + (anim.targetX - anim.startX) * eased;
      const currentY = anim.startY + (anim.targetY - anim.startY) * eased;

      viewport.moveCenter(currentX, currentY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scrollAnimations.delete(containerId);
      }
    };

    requestAnimationFrame(animate);
  }
}

// Export singleton instance
export const focusManager = FocusManager.getInstance();

