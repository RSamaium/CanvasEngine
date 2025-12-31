import { Directive, registerDirective, applyDirective } from "../engine/directive";
import { type Element } from "../engine/reactive";
import { ControlsDirective } from "./Controls";
import { Controls } from "./ControlsBase";
import { isSignal, Signal } from "@signe/reactive";
import { CanvasFocusContainer } from "../components/FocusContainer";

/**
 * FocusNavigation directive for wiring Controls with FocusContainer
 * 
 * This directive integrates with the Controls system and lets external
 * control handlers update the FocusContainer tabindex signal.
 * 
 * The directive is automatically applied when a FocusContainer has a `controls` prop.
 * It keeps the Controls directive in sync with the provided controls config.
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
  private controlsSubscription: any = null;

  /**
   * Initialize the focus navigation directive
   * 
   * @param element - FocusContainer element
   */
  onInit(element: Element<CanvasFocusContainer>) {
    this.element = element;
  }

  /**
   * Mount hook
   * 
   * @param element - FocusContainer element
   */
  onMount(element: Element<CanvasFocusContainer>) {
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
        this.controlsDirective?.onUpdate({ controls: controlsValue }, element);
      }
    }

    // Handle controls prop updates if it's a signal
    if (isSignal(controlsProp)) {
      this.controlsSubscription = (controlsProp as Signal<Controls>).observable.subscribe((controls) => {
        if (controls) {
          this.controlsDirective?.onUpdate({ controls }, element);
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
        this.controlsDirective?.onUpdate({ controls: controlsValue }, element);
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
  }
}

registerDirective('focusNavigation', FocusNavigationDirective);
