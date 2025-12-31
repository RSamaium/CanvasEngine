import { fps2ms } from "../engine/utils";

export interface ControlOptions {
    repeat?: boolean;
    bind: string | string[];
    keyUp?: Function;
    keyDown?: Function;
    throttle?: number;
    delay?: number | {
        duration: number;
        otherControls?: (string)[];
    };
}

export interface Controls {
    [controlName: string]: ControlOptions;
}

export type BoundKey = { actionName: string, options: ControlOptions, parameters?: any };

/**
 * Abstract base class for control systems (keyboard, gamepad, etc.)
 * 
 * This class provides common functionality shared across all control implementations:
 * - Input binding and management
 * - Control configuration
 * - Input state management
 * - Common methods for querying and triggering controls
 * 
 * @example
 * ```ts
 * class MyControls extends ControlsBase {
 *   protected setupListeners() {
 *     // Setup specific input listeners
 *   }
 *   
 *   protected cleanup() {
 *     // Cleanup specific resources
 *   }
 *   
 *   protected preStep() {
 *     // Process inputs each frame
 *   }
 * }
 * ```
 */
export abstract class ControlsBase {
    protected boundKeys: {
        [keyName: string]: BoundKey
    } = {}
    protected stop: boolean = false
    protected _controlsOptions: Controls = {}
    protected interval: any
    protected serverFps: number = 60

    /**
     * Setup input listeners specific to this control implementation
     * Must be implemented by subclasses
     */
    protected abstract setupListeners(): void;

    /**
     * Cleanup resources specific to this control implementation
     * Must be implemented by subclasses
     */
    protected abstract cleanup(): void;

    /**
     * Process inputs each step/frame
     * Must be implemented by subclasses
     */
    protected abstract preStep(): void;

    /**
     * Start the control processing loop
     * Initializes listeners and starts the interval
     */
    start() {
        this.setupListeners();
        this.interval = setInterval(() => {
            this.preStep()
        }, fps2ms(this.serverFps ?? 60))
    }

    /**
     * Stop the control processing and cleanup resources
     */
    destroy() {
        if (this.interval) {
            clearInterval(this.interval)
        }
        this.cleanup();
    }

    /**
     * Bind a key/input to a control action
     * 
     * @param keys - Single key or array of keys to bind
     * @param actionName - Name of the control action
     * @param options - Control options (repeat, keyDown, keyUp, etc.)
     * @param parameters - Optional parameters to pass to the control callbacks
     */
    protected bindKey(keys: string | string[], actionName: string, options: ControlOptions, parameters?: object) {
        if (!Array.isArray(keys)) keys = [keys]
        const keyOptions = Object.assign({
            repeat: false
        }, options);
        keys.forEach(keyName => {
            this.boundKeys[keyName] = { actionName, options: keyOptions, parameters }
        })
    }

    /**
     * Apply an input action for a bound key
     * Can be overridden by subclasses for custom behavior
     * 
     * @param keyName - Name of the key/input to process
     */
    protected applyInput(keyName: string) {
        const boundKey = this.boundKeys[keyName];
        if (!boundKey) return;

        const { repeat, keyDown } = boundKey.options;
        // Default implementation - subclasses may override for state tracking
        if (keyDown) {
            let parameters = boundKey.parameters;
            if (typeof parameters === "function") {
                parameters = parameters();
            }
            keyDown(boundKey);
        }
    }

    /**
     * Get a control by input name
     * 
     * @param inputName - Name of the input/key
     * @returns BoundKey if found, undefined otherwise
     * @example
     * ```ts
     * const control = controls.getControl('up');
     * if (control) {
     *   console.log(control.actionName); // 'up'
     * }
     * ```
     */
    getControl(inputName: string): BoundKey | undefined {
        return this.boundKeys[inputName]
    }

    /**
     * Get all bound controls
     * 
     * @returns Object mapping input names to BoundKey objects
     * @example
     * ```ts
     * const allControls = controls.getControls();
     * console.log(Object.keys(allControls)); // ['up', 'down', 'left', 'right', ...]
     * ```
     */
    getControls(): { [key: string]: BoundKey } {
        return this.boundKeys
    }

    /**
     * Apply a control action programmatically
     * 
     * Must be implemented by subclasses to provide input-specific behavior
     * 
     * @param controlName - Name or identifier of the control
     * @param isDown - Whether the control is pressed down (true) or released (false)
     * @returns Promise that resolves when the control action is complete
     * @example
     * ```ts
     * // Press a control
     * await controls.applyControl('action', true);
     * 
     * // Release a control
     * await controls.applyControl('action', false);
     * 
     * // Press and release (default)
     * await controls.applyControl('action');
     * ```
     */
    abstract applyControl(controlName: string | number, isDown?: boolean): Promise<void>;

    /**
     * Stop listening to inputs
     * Input events will be ignored until listenInputs() is called
     * 
     * @example
     * ```ts
     * controls.stopInputs();
     * // ... later
     * controls.listenInputs();
     * ```
     */
    stopInputs() {
        this.stop = true
    }

    /**
     * Resume listening to inputs after stopInputs() was called
     * 
     * @example
     * ```ts
     * controls.stopInputs();
     * // ... later
     * controls.listenInputs();
     * ```
     */
    listenInputs() {
        this.stop = false
    }

    /**
     * Configure controls with input mappings
     * 
     * This method sets up the binding between input keys/buttons and control actions.
     * It clears existing bindings and creates new ones based on the provided configuration.
     * 
     * @param inputs - Control configuration object
     * @example
     * ```ts
     * controls.setInputs({
     *   up: {
     *     repeat: true,
     *     bind: 'up',
     *     keyDown() {
     *       console.log('Up pressed');
     *     }
     *   },
     *   action: {
     *     bind: ['space', 'enter'],
     *     keyDown() {
     *       console.log('Action triggered');
     *     }
     *   }
     * });
     * ```
     */
    setInputs(inputs: Controls) {
        if (!inputs) return
        this.boundKeys = {}
        for (let control in inputs) {
            const option = inputs[control]
            const { bind } = option
            let inputsKey: any = bind
            if (!Array.isArray(inputsKey)) {
                inputsKey = [bind]
            }
            for (let input of inputsKey) {
                this.bindKey(input, control, option)
            }
        }
        this._controlsOptions = inputs
    }

    /**
     * Get the current controls configuration
     * 
     * @returns The controls options object
     */
    get options(): Controls {
        return this._controlsOptions
    }
}
