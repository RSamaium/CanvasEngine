import { Directive, registerDirective } from "../engine/directive";
import { Element, isElementFrozen } from "../engine/reactive";
import { ControlsBase, Controls } from "./ControlsBase";
import { KeyboardControls } from "./KeyboardControls";
import { GamepadControls, GamepadConfig } from "./GamepadControls";
import { JoystickControls, JoystickConfig } from "./JoystickControls";
import { Signal, isSignal } from "@signe/reactive";
import { Subscription } from "rxjs";

/**
 * Controls directive that coordinates keyboard, gamepad, and joystick input systems
 * 
 * This directive automatically activates keyboard, gamepad, and joystick controls when available.
 * The gamepad is automatically enabled if joypad.js is detected in the environment.
 * 
 * All systems share the same control configuration and can work simultaneously.
 * 
 * @example
 * ```html
 * <Sprite 
 *   image="path/to/image.png" 
 *   controls={controlsConfig}
 *   x={x}
 *   y={y}
 * />
 * ```
 */
export class ControlsDirective extends Directive {
    private keyboardControls: KeyboardControls | null = null;
    private gamepadControls: GamepadControls | null = null;
    private joystickControls: JoystickControls | null = null;
    private freezeSubscription: Subscription | null = null;
    private element: Element | null = null;

    /**
     * Initialize the controls directive
     * Sets up keyboard, gamepad, and joystick controls if available
     */
    onInit(element: Element) {
        this.element = element;
        const value = element.props.controls?.value ?? element.props.controls;
        if (!value) return;

        // Initialize keyboard controls (always available)
        this.keyboardControls = new KeyboardControls();
        this.keyboardControls.setInputs(value as Controls);
        this.keyboardControls.start();

        // Initialize gamepad controls if gamepad config is present
        // GamepadControls will handle joypad.js availability internally
        const gamepadConfig = (value as Controls & { gamepad?: GamepadConfig }).gamepad;
        if (gamepadConfig !== undefined && gamepadConfig.enabled !== false) {
            this.gamepadControls = new GamepadControls();
            this.gamepadControls.setInputs(value as Controls & { gamepad?: GamepadConfig });
            this.gamepadControls.start();
        }

        // Initialize joystick controls if joystick config is present
        const joystickConfig = (value as Controls & { joystick?: JoystickConfig }).joystick;
        if (joystickConfig !== undefined && joystickConfig.enabled !== false) {
            this.joystickControls = new JoystickControls();
            this.joystickControls.setInputs(value as Controls & { joystick?: JoystickConfig });
            this.joystickControls.start();
        }

        // Check initial freeze state
        if (isElementFrozen(element)) {
            this.stopInputs();
        }

        // Subscribe to freeze prop if it's a signal
        const freezeProp = element.propObservables?.freeze ?? element.props?.freeze;
        if (isSignal(freezeProp)) {
            this.freezeSubscription = (freezeProp as Signal<boolean>).observable.subscribe((isFrozen) => {
                if (isFrozen) {
                    this.stopInputs();
                } else {
                    this.listenInputs();
                }
            });
        }
    }

    /**
     * Mount hook (no specific action needed)
     */
    onMount(element: Element) { }

    /**
     * Update controls configuration
     * Updates both keyboard and gamepad controls
     */
    onUpdate(props: any, element: Element) {
        const value = props.controls?.value ?? props.controls;
        if (value) {
            if (this.keyboardControls) {
                this.keyboardControls.setInputs(value as Controls);
            }

            if (this.gamepadControls) {
                this.gamepadControls.setInputs(value as Controls & { gamepad?: GamepadConfig });
            }
        }

        // Handle freeze prop update
        if (props.freeze !== undefined && this.element) {
            if (isElementFrozen(this.element)) {
                this.stopInputs();
            } else {
                this.listenInputs();
            }
        }
    }

    /**
     * Cleanup and destroy all control systems
     */
    onDestroy(element: Element) {
        if (this.freezeSubscription) {
            this.freezeSubscription.unsubscribe();
            this.freezeSubscription = null;
        }

        if (this.keyboardControls) {
            this.keyboardControls.destroy();
            this.keyboardControls = null;
        }

        if (this.gamepadControls) {
            this.gamepadControls.destroy();
            this.gamepadControls = null;
        }

        if (this.joystickControls) {
            this.joystickControls.destroy();
            this.joystickControls = null;
        }

        this.element = null;
    }

    /**
     * Get a control by input name
     * Delegates to keyboard controls (primary system)
     * 
     * @param inputName - Name of the input/key
     * @returns BoundKey if found, undefined otherwise
     */
    getControl(inputName: string) {
        return this.keyboardControls?.getControl(inputName);
    }

    /**
     * Get all bound controls
     * Delegates to keyboard controls (primary system)
     * 
     * @returns Object mapping input names to BoundKey objects
     */
    getControls() {
        return this.keyboardControls?.getControls() || {};
    }

    /**
     * Apply a control action programmatically
     * Applies to both keyboard and gamepad if available
     * 
     * @param controlName - Name of the control
     * @param isDown - Whether the control is pressed (true) or released (false)
     * @param payload - Optional payload to pass to keyDown/keyUp callbacks (e.g., { power: 0.8 })
     * @returns Promise that resolves when the action is complete
     */
    async applyControl(controlName: string | number, isDown?: boolean, payload?: any): Promise<void> {
        if (this.keyboardControls) {
            await this.keyboardControls.applyControl(controlName, isDown);
        }
        if (this.gamepadControls) {
            await this.gamepadControls.applyControl(controlName, isDown, payload);
        }
        if (this.joystickControls) {
            await this.joystickControls.applyControl(controlName, isDown, payload);
        }
    }

    /**
     * Stop listening to inputs
     * Stops keyboard, gamepad, and joystick input processing
     */
    stopInputs() {
        if (this.keyboardControls) {
            this.keyboardControls.stopInputs();
        }
        if (this.gamepadControls) {
            this.gamepadControls.stopInputs();
        }
        if (this.joystickControls) {
            this.joystickControls.stopInputs();
        }
    }

    /**
     * Resume listening to inputs
     * Resumes keyboard, gamepad, and joystick input processing
     */
    listenInputs() {
        if (this.keyboardControls) {
            this.keyboardControls.listenInputs();
        }
        if (this.gamepadControls) {
            this.gamepadControls.listenInputs();
        }
        if (this.joystickControls) {
            this.joystickControls.listenInputs();
        }
    }

    /**
     * Get the current controls configuration
     * Returns keyboard controls options (both systems share the same config)
     * 
     * @returns The controls options object
     */
    get options(): Controls {
        return this.keyboardControls?.options || {};
    }

    /**
     * Get the keyboard controls instance
     * 
     * @returns KeyboardControls instance or null
     */
    get keyboard(): KeyboardControls | null {
        return this.keyboardControls;
    }

    /**
     * Get the gamepad controls instance
     * 
     * @returns GamepadControls instance or null
     */
    get gamepad(): GamepadControls | null {
        return this.gamepadControls;
    }

    /**
     * Get the joystick controls instance
     * 
     * @returns JoystickControls instance or null
     */
    get joystick(): JoystickControls | null {
        return this.joystickControls;
    }
}

registerDirective('controls', ControlsDirective);
