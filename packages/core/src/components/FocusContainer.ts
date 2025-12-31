import { createComponent, registerComponent, type Element } from "../engine/reactive";
import { applyDirective } from "../engine/directive";
import { ComponentFunction } from "../engine/signal";
import { DisplayObjectProps } from "./types/DisplayObject";
import { focusManager, ScrollOptions } from "../engine/FocusManager";
import { signal, Signal, isSignal } from "@signe/reactive";
import { CanvasViewport } from "./Viewport";
import { Controls } from "../directives/ControlsBase";
// Import FocusNavigation directive to ensure it's registered
import "../directives/FocusNavigation";

/**
 * Properties for FocusContainer component
 * 
 * @property tabindex - Focus index for the container (default: 0 if present)
 * @property controls - Controls configuration for automatic navigation
 * @property onFocusChange - Callback when focus changes
 * @property autoScroll - Enable automatic scrolling to focused element (default: false)
 * @property viewport - Viewport instance to use for scrolling (optional, uses context viewport by default)
 */
export interface FocusContainerProps extends DisplayObjectProps {
  tabindex?: number;
  controls?: Controls | Signal<Controls>;
  onFocusChange?: (index: number, element: Element | null) => void;
  autoScroll?: boolean | ScrollOptions;
  viewport?: CanvasViewport;
}

/**
 * FocusContainer component for managing focus navigation
 * 
 * This component provides a container that manages focus navigation between
 * focusable child elements. It supports automatic navigation via Controls
 * (keyboard/gamepad) and automatic scrolling with Viewport.
 * 
 * ## Features
 * 
 * - **Focus Management**: Automatically registers focusable children
 * - **Navigation**: Supports keyboard/gamepad navigation via Controls
 * - **Auto-scroll**: Automatically scrolls viewport to show focused element
 * - **Hooks**: Provides reactive signals for focus state
 * 
 * @example
 * ```typescript
 * // Basic usage
 * <FocusContainer tabindex={0}>
 *   <Button tabindex={0} text="Button 1" />
 *   <Button tabindex={1} text="Button 2" />
 * </FocusContainer>
 * 
 * // With Controls
 * <FocusContainer tabindex={0} controls={controlsConfig}>
 *   <Button tabindex={0} text="Button 1" />
 *   <Button tabindex={1} text="Button 2" />
 * </FocusContainer>
 * 
 * // With auto-scroll
 * <Viewport worldWidth={2000} worldHeight={5000}>
 *   <FocusContainer tabindex={0} autoScroll={true}>
 *     <Button tabindex={0} y={0} text="Item 1" />
 *     <Button tabindex={1} y={100} text="Item 2" />
 *   </FocusContainer>
 * </Viewport>
 * ```
 */
export class CanvasFocusContainer {
  private containerId: string = '';
  private currentIndexSignal: Signal<number | null> | null = null;
  private focusedElementSignal: Signal<Element | null> | null = null;
  private registeredFocusables: Set<number> = new Set();

  /**
   * Initialize the focus container
   * 
   * @param props - Component properties
   */
  onInit(props: FocusContainerProps) {
    // Generate unique container ID
    this.containerId = `focus-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create signals for current index and focused element
    const currentIndex = signal<number | null>(null);
    const focusedElement = signal<Element | null>(null);

    this.currentIndexSignal = currentIndex;
    this.focusedElementSignal = focusedElement;

    // Get viewport from context or props
    const viewport = props.viewport || (props.context?.viewport as CanvasViewport | undefined);

    // Register container with FocusManager
    focusManager.registerContainer(this.containerId, {
      focusables: new Map(),
      currentIndex,
      focusedElement,
      onFocusChange: props.onFocusChange,
      autoScroll: props.autoScroll,
      viewport
    });
  }

  /**
   * Mount hook - register focusable children
   * 
   * @param element - The element being mounted
   */
  async onMount(element: Element<CanvasFocusContainer>): Promise<void> {
    // Update container with element reference for freeze checking
    focusManager.updateContainer(this.containerId, { element });

    // Apply focusNavigation directive if controls are provided
    if (element.props.controls) {
      const focusNavDirective = applyDirective(element, 'focusNavigation');
      if (focusNavDirective && !element.directives) {
        element.directives = {};
      }
      if (focusNavDirective) {
        element.directives.focusNavigation = focusNavDirective;
        // Initialize the directive
        focusNavDirective.onInit(element);
        focusNavDirective.onMount(element);
      }
    }

    // Subscribe to allElements to detect when children are mounted
    if (element.allElements) {
      const subscription = element.allElements.subscribe(() => {
        // Register children when they are mounted
        this.registerChildren(element);
      });
      // Store subscription for cleanup
      if (!element.effectSubscriptions) {
        element.effectSubscriptions = [];
      }
      element.effectSubscriptions.push(subscription);
    }

    // if (element.propObservables.tabindex) {
    //   const subscription = element.propObservables.tabindex.observable.subscribe((value: any) => {
    //     console.log("tabindex changed", value);
    //     if (value !== null) {
    //     //  focusManager.setIndex(this.containerId, value);
    //     }
    //   });
    //   element.effectSubscriptions.push(subscription);
    // }

    focusManager.setTabindex(this.containerId, element.propObservables.tabindex);

    // Register all focusable children initially
    // Use setTimeout to ensure children are mounted
    setTimeout(() => {
      this.registerChildren(element);
    }, 0);
  }

  /**
   * Update hook - handle prop changes
   * 
   * @param props - Updated properties
   */
  onUpdate(props: FocusContainerProps) {
    // Update viewport if changed
    const viewport = props.viewport || (props.context?.viewport as CanvasViewport | undefined);
    focusManager.updateContainer(this.containerId, {
      viewport,
      autoScroll: props.autoScroll,
      onFocusChange: props.onFocusChange
    });
  }

  /**
   * Destroy hook - cleanup
   * 
   * @param parent - Parent element
   * @param afterDestroy - Callback after destruction
   */
  async onDestroy(parent: Element<any>, afterDestroy?: () => void): Promise<void> {
    // Unregister all focusables
    for (const index of this.registeredFocusables) {
      focusManager.unregisterFocusable(this.containerId, index);
    }
    this.registeredFocusables.clear();

    // Unregister container
    focusManager.unregisterContainer(this.containerId);
    if (afterDestroy) {
      afterDestroy();
    }
  }

  /**
   * Register focusable children from element
   * 
   * @param element - Container element
   */
  private registerChildren(element: Element<CanvasFocusContainer>) {
    if (!element.props.children) return;


    let registeredCount = 0;
    const processChildren = (children: any[]) => {
      for (const child of children) {
        if (!child) continue;

        // Handle signals/observables
        if (isSignal(child) || (child && typeof child.subscribe === 'function')) {

          // Subscribe to changes
          const subscription = (isSignal(child) ? child.observable : child).subscribe((value: any) => {
            // Handle FlowObservable result (from loop, cond, etc.) - has 'elements' property
            if (value && typeof value === 'object' && 'elements' in value) {
              const elements = value.elements || [];
              if (Array.isArray(elements)) {
                processChildren(elements);
              }
            } else if (Array.isArray(value)) {
              processChildren(value);
            } else if (value) {
              processChild(value);
            }
          });
          // Note: We should track subscriptions for cleanup, but for now this works
          continue;
        }

        // Handle arrays
        if (Array.isArray(child)) {
          processChildren(child);
          continue;
        }

        // Handle single element
        processChild(child);
      }
    };

    const processChild = (child: Element) => {
      if (!child || !child.componentInstance) return;
      if (child.tag === "FocusContainer" && child !== (element as any)) {
        return;
      }

      // Check for tabindex in props
      let tabindex: number | undefined = undefined;

      // For DOMElement/DOMContainer, check attrs.tabindex
      if (child.props?.attrs?.tabindex !== undefined) {
        const tabindexValue = child.props.attrs.tabindex;
        tabindex = isSignal(tabindexValue) ? tabindexValue() : tabindexValue;
      }
      // For other components, check tabindex prop directly
      else if (child.props?.tabindex !== undefined) {
        const tabindexValue = child.props.tabindex;
        tabindex = isSignal(tabindexValue) ? tabindexValue() : tabindexValue;
      }

      // Register if tabindex >= 0
      if (tabindex !== undefined && tabindex >= 0) {
        if (!this.registeredFocusables.has(tabindex)) {
          focusManager.registerFocusable(this.containerId, child, tabindex);
          this.registeredFocusables.add(tabindex);
          registeredCount++;
        }
      }

      // Recursively process children unless we hit another FocusContainer
      if (child.props && child.props.children) {
        if (Array.isArray(child.props.children)) {
          processChildren(child.props.children);
        } else if (isSignal(child.props.children) || (child.props.children && typeof child.props.children.subscribe === 'function')) {
          const subscription = (isSignal(child.props.children) ? child.props.children.observable : child.props.children).subscribe((value: any) => {
            // Handle FlowObservable result (from loop, cond, etc.) - has 'elements' property
            if (value && typeof value === 'object' && 'elements' in value) {
              const elements = value.elements || [];
              if (Array.isArray(elements)) {
                processChildren(elements);
              }
            } else if (Array.isArray(value)) {
              processChildren(value);
            } else if (value) {
              processChild(value);
            }
          });
          // Store subscription for cleanup if child has effectSubscriptions
          if (child.effectSubscriptions) {
            child.effectSubscriptions.push(subscription);
          }
        } else {
          processChild(child.props.children as any);
        }
      }
    };

    if (Array.isArray(element.props.children)) {
      processChildren(element.props.children);
    } else if (element.props.children) {
      if (isSignal(element.props.children) || (element.props.children && typeof element.props.children.subscribe === 'function')) {
        const subscription = (isSignal(element.props.children) ? element.props.children.observable : element.props.children).subscribe((value: any) => {
          // Handle FlowObservable result (from loop, cond, etc.) - has 'elements' property
          if (value && typeof value === 'object' && 'elements' in value) {
            const elements = value.elements || [];
            if (Array.isArray(elements)) {
              processChildren(elements);
            }
          } else if (Array.isArray(value)) {
            processChildren(value);
          } else if (value) {
            processChild(value);
          }
        });
        // Store subscription for cleanup
        if (!element.effectSubscriptions) {
          element.effectSubscriptions = [];
        }
        element.effectSubscriptions.push(subscription);
      } else {
        processChild(element.props.children as any);
      }
    }
  }

  /**
   * Get the container ID
   * 
   * @returns Container identifier
   */
  getContainerId(): string {
    return this.containerId;
  }

  /**
   * Get current index signal
   * 
   * @returns Signal for current focus index
   */
  getCurrentIndexSignal(): Signal<number | null> | null {
    return this.currentIndexSignal;
  }

  /**
   * Get focused element signal
   * 
   * @returns Signal for current focused element
   */
  getFocusedElementSignal(): Signal<Element | null> | null {
    return this.focusedElementSignal;
  }
}

export interface CanvasFocusContainer extends DisplayObjectProps { }

registerComponent("FocusContainer", CanvasFocusContainer);

/**
 * FocusContainer component function
 * 
 * @param props - Component properties
 * @returns FocusContainer element
 */
export const FocusContainer: ComponentFunction<FocusContainerProps> = (props) => {
  return createComponent("FocusContainer", props);
};
