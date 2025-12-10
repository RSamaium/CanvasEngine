import { ControlsBase, Controls } from "./ControlsBase";

/**
 * Joystick directions reported by the Joystick component
 */
export type JoystickDirection =
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'top_left'
    | 'top_right'
    | 'bottom_left'
    | 'bottom_right';

/**
 * Joystick change event payload
 */
export interface JoystickChangeEvent {
    angle: number;
    direction: JoystickDirection;
    power: number;
}

/**
 * Joystick configuration interface
 * 
 * @example
 * ```ts
 * const joystickConfig: JoystickConfig = {
 *   enabled: true,
 *   directionMapping: {
 *     'top': 'up',
 *     'bottom': 'down',
 *     'left': 'left',
 *     'right': 'right',
 *     'top_left': ['up', 'left'],
 *     'top_right': ['up', 'right'],
 *     'bottom_left': ['down', 'left'],
 *     'bottom_right': ['down', 'right']
 *   },
 *   moveInterval: 50,
 *   threshold: 0.1
 * };
 * ```
 */
export interface JoystickConfig {
    /** Whether joystick is enabled (default: true) */
    enabled?: boolean;
    /** Mapping of joystick direction names to control names (can be single string or array for diagonals) */
    directionMapping?: {
        [joystickDirection: string]: string | string[]; // e.g., 'top' -> 'up', 'top_left' -> ['up', 'left']
    };
    /** Interval in milliseconds for repeating movement actions (default: 50) */
    moveInterval?: number;
    /** Threshold for power value to trigger movement (default: 0.1) */
    threshold?: number;
}

/**
 * Default direction mapping
 */
const DEFAULT_DIRECTION_MAPPING: { [direction: string]: string | string[] } = {
    'top': 'up',
    'bottom': 'down',
    'left': 'left',
    'right': 'right',
    'top_left': ['up', 'left'],
    'top_right': ['up', 'right'],
    'bottom_left': ['down', 'left'],
    'bottom_right': ['down', 'right']
};

/**
 * Joystick input controls implementation
 * 
 * Handles joystick input events from the Joystick component and maps them to control actions.
 * Supports directional movement with configurable mappings, including diagonal directions.
 * 
 * The joystick controls work by receiving change events from a Joystick component instance.
 * 
 * @example
 * ```ts
 * const joystickControls = new JoystickControls();
 * joystickControls.setInputs({
 *   up: {
 *     repeat: true,
 *     bind: 'up',
 *     keyDown() {
 *       console.log('Up pressed');
 *     }
 *   }
 * });
 * joystickControls.updateJoystickConfig({
 *   enabled: true,
 *   directionMapping: {
 *     'top': 'up'
 *   }
 * });
 * joystickControls.start();
 * 
 * // Later, when joystick changes:
 * joystickControls.handleJoystickChange({ angle: 90, direction: Direction.TOP, power: 0.8 });
 * ```
 */
export class JoystickControls extends ControlsBase {
    private joystickEnabled: boolean = true;
    private joystickConfig: JoystickConfig = {
        enabled: true,
        directionMapping: DEFAULT_DIRECTION_MAPPING,
        moveInterval: 50,
        threshold: 0.1
    };
    private joystickMoving: boolean = false;
    private joystickDirections: { [direction: string]: boolean } = {};
    private joystickLastUpdate: number = 0;
    private joystickMoveInterval: any = null;
    private currentPower: number = 0;

    /**
     * Setup joystick event listeners
     * Note: Joystick events are handled via handleJoystickChange() method
     */
    protected setupListeners(): void {
        // Joystick events are handled externally via handleJoystickChange()
        // This method is kept for consistency with ControlsBase interface
    }

    /**
     * Cleanup joystick intervals
     */
    protected cleanup(): void {
        if (this.joystickMoveInterval) {
            clearInterval(this.joystickMoveInterval);
            this.joystickMoveInterval = null;
        }
    }

    /**
     * Process joystick inputs each step
     * Handles timeout for stopping movements after joystick inactivity
     */
    protected preStep(): void {
        if (this.stop) return;

        // Stop movements if no joystick input for 100ms
        const now = Date.now();
        if (now - this.joystickLastUpdate > 100 && this.joystickMoving) {
            const allDirections = Object.keys(this.joystickDirections);
            for (const dir of allDirections) {
                this.joystickDirections = {};
                this.joystickMoving = false;
                this.applyControl(dir, false).catch(() => {
                    // Ignore errors
                });
            }
        }
    }

    /**
     * Handle joystick change event
     * Called by the Joystick component when its position changes
     * 
     * @param event - Joystick change event containing angle, direction, and power
     */
    handleJoystickChange(event: JoystickChangeEvent): void {
        if (!this.joystickEnabled || !this.joystickConfig.enabled) return;
        if (this.stop) return;

        this.joystickLastUpdate = Date.now();
        this.currentPower = event.power;

        // Check threshold
        if (event.power < (this.joystickConfig.threshold || 0.1)) {
            // Power too low, stop all movements
            this.stopAllMovements();
            return;
        }

        const directionMapping = this.joystickConfig.directionMapping || DEFAULT_DIRECTION_MAPPING;
        const directionKey = event.direction;
        const mappedControls = directionMapping[directionKey];

        if (!mappedControls) {
            // No mapping for this direction, stop all movements
            this.stopAllMovements();
            return;
        }

        // Convert to array if single string
        const controlNames = Array.isArray(mappedControls) ? mappedControls : [mappedControls];

        // Determine which directions to activate and deactivate
        const newDirections: { [dir: string]: boolean } = {};
        controlNames.forEach(controlName => {
            newDirections[controlName] = true;
        });

        // Deactivate directions that are no longer active
        const allDirections = new Set([
            ...Object.keys(this.joystickDirections),
            ...Object.keys(newDirections)
        ]);

        for (const dir of allDirections) {
            const wasActive = this.joystickDirections[dir];
            const shouldBeActive = newDirections[dir] || false;

            if (wasActive && !shouldBeActive) {
                // Deactivate this direction
                this.applyControl(dir, false).catch(() => {
                    // Ignore errors
                });
            }
        }

        // Update active directions
        this.joystickDirections = { ...newDirections };
        this.joystickMoving = true;

        // Activate new directions
        for (const controlName of controlNames) {
            this.applyControl(controlName, true).catch(() => {
                // Ignore errors
            });
        }

        // Start or restart movement interval
        if (this.joystickMoveInterval) {
            clearInterval(this.joystickMoveInterval);
        }

        this.joystickMoveInterval = setInterval(() => {
            this.processJoystickMovement();
        }, this.joystickConfig.moveInterval || 50);
    }

    /**
     * Handle joystick start event
     * Called when user starts interacting with the joystick
     */
    handleJoystickStart(): void {
        if (!this.joystickEnabled || !this.joystickConfig.enabled) return;
        if (this.stop) return;
        // Start event doesn't need special handling, change event will handle activation
    }

    /**
     * Handle joystick end event
     * Called when user stops interacting with the joystick
     */
    handleJoystickEnd(): void {
        if (!this.joystickEnabled || !this.joystickConfig.enabled) return;
        this.stopAllMovements();
    }

    /**
     * Stop all active joystick movements
     */
    private stopAllMovements(): void {
        if (this.joystickMoveInterval) {
            clearInterval(this.joystickMoveInterval);
            this.joystickMoveInterval = null;
        }

        const allDirections = Object.keys(this.joystickDirections);
        for (const dir of allDirections) {
            this.applyControl(dir, false).catch(() => {
                // Ignore errors
            });
        }

        this.joystickDirections = {};
        this.joystickMoving = false;
        this.currentPower = 0;
    }

    /**
     * Process continuous joystick movement
     * Called at intervals to repeat movement actions while joystick is active
     */
    private processJoystickMovement(): void {
        if (!this.joystickMoving) return;
        if (this.stop) return;

        for (const direction in this.joystickDirections) {
            if (this.joystickDirections[direction]) {
                this.applyControl(direction, true).catch(() => {
                    // Ignore errors
                });
            }
        }
    }

    /**
     * Update joystick configuration
     * Merges provided config with defaults
     * 
     * @param config - Partial joystick configuration
     */
    updateJoystickConfig(config: Partial<JoystickConfig>): void {
        this.joystickConfig = {
            enabled: config.enabled !== undefined ? config.enabled : true,
            directionMapping: config.directionMapping || DEFAULT_DIRECTION_MAPPING,
            moveInterval: config.moveInterval || 50,
            threshold: config.threshold || 0.1
        };
    }

    /**
     * Extract joystick config from controls configuration and update
     * 
     * @param inputs - Controls configuration that may contain a 'joystick' property
     */
    extractJoystickConfig(inputs: Controls & { joystick?: JoystickConfig }): void {
        if (inputs.joystick) {
            this.updateJoystickConfig(inputs.joystick);
        }
    }

    /**
     * Get the current joystick configuration
     * 
     * @returns The joystick configuration object
     */
    getJoystickConfig(): JoystickConfig {
        return this.joystickConfig;
    }

    /**
     * Apply a control action programmatically
     * Uses the bound controls to trigger actions
     * 
     * @param controlName - Name of the control
     * @param isDown - Whether the control is pressed (true) or released (false)
     * @returns Promise that resolves when the action is complete
     */
    async applyControl(controlName: string | number, isDown?: boolean): Promise<void> {
        const control = this._controlsOptions[controlName];
        if (!control) return;

        // Find the bound key for this control
        const boundKeys = Object.keys(this.boundKeys);
        for (const keyName of boundKeys) {
            const boundKey = this.boundKeys[keyName];
            if (boundKey.actionName === String(controlName)) {
                // Execute the control callback
                if (isDown === undefined) {
                    // Press and release (simulate button press)
                    if (boundKey.options.keyDown) {
                        let parameters = boundKey.parameters;
                        if (typeof parameters === "function") {
                            parameters = parameters();
                        }
                        boundKey.options.keyDown(boundKey);
                    }
                    // Release after a short delay (similar to keyboard)
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            if (boundKey.options.keyUp) {
                                let parameters = boundKey.parameters;
                                if (typeof parameters === "function") {
                                    parameters = parameters();
                                }
                                boundKey.options.keyUp(boundKey);
                            }
                            resolve();
                        }, 200);
                    });
                } else if (isDown) {
                    if (boundKey.options.keyDown) {
                        let parameters = boundKey.parameters;
                        if (typeof parameters === "function") {
                            parameters = parameters();
                        }
                        boundKey.options.keyDown(boundKey);
                    }
                } else {
                    if (boundKey.options.keyUp) {
                        let parameters = boundKey.parameters;
                        if (typeof parameters === "function") {
                            parameters = parameters();
                        }
                        boundKey.options.keyUp(boundKey);
                    }
                }
                break;
            }
        }
    }

    /**
     * Override setInputs to extract joystick config
     */
    setInputs(inputs: Controls & { joystick?: JoystickConfig }): void {
        super.setInputs(inputs);
        this.extractJoystickConfig(inputs);
    }

    /**
     * Check if joystick is currently active
     * 
     * @returns true if joystick is moving, false otherwise
     */
    isActive(): boolean {
        return this.joystickMoving;
    }
}
