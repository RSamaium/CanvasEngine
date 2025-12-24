import { Directive, registerDirective, applyDirective } from "../engine/directive";
import { type Element } from "../engine/reactive";
import { focusManager } from "../engine/FocusManager";
import { ControlsDirective } from "./Controls";
import { Controls } from "./ControlsBase";
import { isSignal, Signal } from "@signe/reactive";
import { CanvasFocusContainer } from "../components/FocusContainer";

/**
 * FocusNavigation directive for automatic focus navigation via Controls
 * 
 * This directive integrates with the Controls system to automatically navigate
 * between focusable elements using keyboard arrows or gamepad input.
 * 
 * The directive is automatically applied when a FocusContainer has a `controls` prop.
 * It wraps the existing Controls configuration to add focus navigation behavior.
 * 
 * @example
 * ```typescript
 * // Automatic navigation with Controls
 * <FocusContainer tabindex={0} controls={controlsConfig}>
 *   <Button tabindex={0} text="Button 1" />
 *   <Button tabindex={1} text="Button 2" />
 * </FocusContainer>
 * ```
 */
export class FocusNavigationDirective extends Directive {
  private element: Element<CanvasFocusContainer> | null = null;
  private controlsDirective: ControlsDirective | null = null;
  private containerId: string = '';
  private controlsSubscription: any = null;
  private originalControls: Controls | null = null;

  /**
   * Initialize the focus navigation directive
   * 
   * @param element - FocusContainer element
   */
  onInit(element: Element<CanvasFocusContainer>) {
    this.element = element;

    // Get container ID from component instance
    const instance = element.componentInstance as CanvasFocusContainer;
    if (instance && typeof instance.getContainerId === 'function') {
      this.containerId = instance.getContainerId();
    }

    // Get controls from props
    const controlsProp = element.props.controls;
    if (!controlsProp) return;

    // Get controls value (handle signals)
    const controlsValue = isSignal(controlsProp) ? controlsProp() : controlsProp;
    if (!controlsValue) return;

    this.originalControls = controlsValue;

    // Note: Controls directive will be created/initialized in onMount
    // We'll set up navigation controls there
  }

  /**
   * Set up navigation controls
   * 
   * @param controls - Controls configuration
   */
  private setupNavigationControls(controls: Controls) {
    if (!this.controlsDirective) {
      console.warn('FocusNavigation: Controls directive not found, cannot set up navigation');
      return;
    }
    controls = (controls.value ?? controls) as Controls;
    // Create navigation controls by wrapping existing ones
    const navigationControls: Controls = {
      ...controls,
      // Override or add navigation controls
      up: {
        ...controls.up,
        repeat: controls.up?.repeat ?? true,
        bind: controls.up?.bind ?? ['up', 'top_left', 'top_right'],
        keyDown: (boundKey?: any) => {
          // Navigate up/previous first
          this.navigate('previous');
          // Call original handler if exists
          controls.up?.keyDown?.(boundKey);
        }
      },
      down: {
        ...controls.down,
        repeat: controls.down?.repeat ?? true,
        bind: controls.down?.bind ?? ['down', 'bottom_left', 'bottom_right'],
        keyDown: (boundKey?: any) => {
          // Navigate down/next first
          this.navigate('next');
          // Call original handler if exists
          controls.down?.keyDown?.(boundKey);
        }
      },
      left: {
        ...controls.left,
        repeat: controls.left?.repeat ?? true,
        bind: controls.left?.bind ?? 'left',
        keyDown: (boundKey?: any) => {
          // Navigate previous (for horizontal lists)
          this.navigate('previous');
          // Call original handler if exists
          controls.left?.keyDown?.(boundKey);
        }
      },
      right: {
        ...controls.right,
        repeat: controls.right?.repeat ?? true,
        bind: controls.right?.bind ?? 'right',
        keyDown: (boundKey?: any) => {
          // Navigate next (for horizontal lists)
          this.navigate('next');
          // Call original handler if exists
          controls.right?.keyDown?.(boundKey);
        }
      },
      action: {
        ...controls.action,
        bind: controls.action?.bind ?? ['space', 'enter'],
        keyDown: (boundKey?: any) => {
          // Trigger action on focused element (e.g., click)
          this.triggerAction();
          // Call original handler if exists
          controls.action?.keyDown?.(boundKey);
        }
      }
    };

    // Update controls directive with navigation controls
    this.controlsDirective.onUpdate({ controls: navigationControls }, this.element!);
  }

  /**
   * Navigate to next or previous focusable element
   * 
   * @param direction - Navigation direction
   */
  private navigate(direction: 'next' | 'previous') {
    if (!this.containerId) return;
    focusManager.navigate(this.containerId, direction);
  }

  /**
   * Trigger action on currently focused element
   */
  private triggerAction() {
    if (!this.containerId) return;

    const focusedElementSignal = focusManager.getFocusedElementSignal(this.containerId);
    if (!focusedElementSignal) return;

    const focusedElement = focusedElementSignal();
    if (!focusedElement) return;

    // Try to trigger click/pointertap event on focused element
    const instance = focusedElement.componentInstance;
    if (instance && typeof instance.emit === 'function') {
      // Emit pointertap event (equivalent to click)
      instance.emit('pointertap', { target: instance });
    }
  }

  /**
   * Mount hook
   * 
   * @param element - FocusContainer element
   */
  onMount(element: Element<CanvasFocusContainer>) {
    // Get container ID again (should be available now)
    const instance = element.componentInstance as CanvasFocusContainer;
    if (instance && typeof instance.getContainerId === 'function') {
      this.containerId = instance.getContainerId();
    }

    // Get or create Controls directive
    this.controlsDirective = element.directives?.controls as ControlsDirective;

    // If Controls directive doesn't exist, create it
    if (!this.controlsDirective) {
      const controlsDirective = applyDirective(element, 'controls');
      if (controlsDirective) {
        if (!element.directives) {
          element.directives = {};
        }
        element.directives.controls = controlsDirective;
        this.controlsDirective = controlsDirective as ControlsDirective;
      }
    }

    // Get controls from props
    const controlsProp = element.props.controls;
    if (controlsProp) {
      const controlsValue = isSignal(controlsProp) ? controlsProp() : controlsProp;
      if (controlsValue) {
        this.originalControls = controlsValue;
        this.setupNavigationControls(controlsValue);
      }
    }

    // Handle controls prop updates if it's a signal
    if (isSignal(controlsProp)) {
      this.controlsSubscription = (controlsProp as Signal<Controls>).observable.subscribe((controls) => {
        if (controls) {
          this.originalControls = controls;
          this.setupNavigationControls(controls);
        }
      });
    }
  }

  /**
   * Update hook
   * 
   * @param props - Updated properties
   * @param element - FocusContainer element
   */
  onUpdate(props: any, element: Element<CanvasFocusContainer>) {
    // Update controls if changed
    if (props.controls !== undefined) {
      const controlsValue = isSignal(props.controls) ? props.controls() : props.controls;
      if (controlsValue) {
        this.originalControls = controlsValue;
        this.setupNavigationControls(controlsValue);
      }
    }
  }

  /**
   * Destroy hook
   * 
   * @param element - FocusContainer element
   */
  onDestroy(element: Element<CanvasFocusContainer>) {
    // Cleanup subscription
    if (this.controlsSubscription) {
      this.controlsSubscription.unsubscribe();
      this.controlsSubscription = null;
    }

    this.element = null;
    this.controlsDirective = null;
    this.originalControls = null;
  }
}

registerDirective('focusNavigation', FocusNavigationDirective);

