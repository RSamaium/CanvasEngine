import { ControlsBase, Controls } from "./ControlsBase";
import { WritableSignal } from "@signe/reactive";
import 'joypad.js'

/**
 * Gamepad configuration interface
 * 
 * @example
 * ```ts
 * const gamepadConfig: GamepadConfig = {
 *   enabled: true,
 *   buttonMapping: {
 *     'button_0': 'action',
 *     'button_1': 'back'
 *   },
 *   axisMapping: {
 *     'top': 'up',
 *     'bottom': 'down',
 *     'left': 'left',
 *     'right': 'right'
 *   },
 *   moveInterval: 400,
 *   onConnect: () => console.log('Gamepad connected!'),
 *   onDisconnect: () => console.log('Gamepad disconnected!')
 * };
 * ```
 */
export interface GamepadConfig {
    /** Whether gamepad is enabled (default: true) */
    enabled?: boolean;
    /** Mapping of gamepad button names to control names */
    buttonMapping?: {
        [buttonName: string]: string; // e.g., 'button_0' -> 'action'
    };
    /** Mapping of axis directions to control directions */
    axisMapping?: {
        [axisDirection: string]: string; // e.g., 'top' -> 'up'
    };
    /** Threshold for axis movement detection (default: 0.5) */
    axisThreshold?: number;
    /** Interval in milliseconds for repeating movement actions (default: 400) */
    moveInterval?: number;
    /** Callback called when a gamepad is connected */
    onConnect?: () => void;
    /** Callback called when a gamepad is disconnected */
    onDisconnect?: () => void;
    /** Signal that tracks gamepad connection status (optional) */
    gamepadConnected?: WritableSignal<boolean>;
}

/**
 * Default button mapping
 */
const DEFAULT_BUTTON_MAPPING: { [buttonName: string]: string } = {
    'button_0': 'action',
    'button_1': 'back',
    'button_9': 'back'
};

/**
 * Default axis mapping
 */
const DEFAULT_AXIS_MAPPING: { [axisDirection: string]: string } = {
    'top': 'up',
    'bottom': 'down',
    'left': 'left',
    'right': 'right'
};

/**
 * Gamepad input controls implementation
 * 
 * Handles gamepad input events using joypad.js library and maps them to control actions.
 * Supports button presses and analog stick movement with configurable mappings.
 * 
 * The gamepad controls are automatically activated when joypad.js is available and enabled.
 * 
 * @example
 * ```ts
 * const gamepadControls = new GamepadControls();
 * gamepadControls.setInputs({
 *   up: {
 *     repeat: true,
 *     bind: 'up',
 *     keyDown() {
 *       console.log('Up pressed');
 *     }
 *   }
 * });
 * gamepadControls.updateGamepadConfig({
 *   enabled: true,
 *   buttonMapping: {
 *     'button_0': 'action'
 *   }
 * });
 * gamepadControls.start();
 * ```
 */
export class GamepadControls extends ControlsBase {
    private gamepadEnabled: boolean = true;
    private gamepadConfig: GamepadConfig = {
        enabled: true,
        buttonMapping: DEFAULT_BUTTON_MAPPING,
        axisMapping: DEFAULT_AXIS_MAPPING,
        axisThreshold: 0.5,
        moveInterval: 400
    };
    private gamepadMoving: boolean = false;
    private gamepadDirections: { [direction: string]: boolean } = {};
    private gamepadAxisDate: number = 0;
    private gamepadMoveInterval: any = null;
    private joypad: any = null;
    private connectCallbacks: Array<() => void> = [];
    private disconnectCallbacks: Array<() => void> = [];

    /**
     * Setup gamepad event listeners
     * Initializes joypad.js if available
     */
    protected setupListeners(): void {
        this.initGamepad();
    }

    /**
     * Cleanup gamepad event listeners and intervals
     */
    protected cleanup(): void {
        if (this.gamepadMoveInterval) {
            clearInterval(this.gamepadMoveInterval);
            this.gamepadMoveInterval = null;
        }
    }

    /**
     * Initialize joypad.js library if available
     */
    private initGamepad(): void {
        if (typeof window === 'undefined') return;
        
        const joypadLib = (window as any)['joypad'];

        if (!joypadLib) {
            // joypad.js not available
            // Set initial state if signal is provided
            if (this.gamepadConfig.gamepadConnected) {
                this.gamepadConfig.gamepadConnected.set(false);
            }
            return;
        }

        this.joypad = joypadLib;

        // Setup event listeners
        this.joypad.on('connect', () => this.handleGamepadConnect());
        this.joypad.on('disconnect', () => this.handleGamepadDisconnect());
        this.joypad.on('button_press', (e: any) => this.handleGamepadButtonPress(e));
        this.joypad.on('axis_move', (e: any) => this.handleGamepadAxisMove(e));
    }

    /**
     * Handle gamepad connection event
     */
    private handleGamepadConnect(): void {
        if (!this.gamepadEnabled || !this.gamepadConfig.enabled) return;
        
        // Start movement processing interval
        this.gamepadMoveInterval = setInterval(() => {
            this.processGamepadMovement();
        }, this.gamepadConfig.moveInterval || 400);

        // Update gamepadConnected signal if provided
        if (this.gamepadConfig.gamepadConnected) {
            this.gamepadConfig.gamepadConnected.set(true);
        }

        // Call all registered connect callbacks
        this.connectCallbacks.forEach(callback => callback());
    }

    /**
     * Handle gamepad disconnection event
     */
    private handleGamepadDisconnect(): void {
        // Stop movement interval
        if (this.gamepadMoveInterval) {
            clearInterval(this.gamepadMoveInterval);
            this.gamepadMoveInterval = null;
        }
        
        // Reset states
        this.gamepadMoving = false;
        this.gamepadDirections = {};
        this.gamepadAxisDate = 0;

        // Update gamepadConnected signal if provided
        if (this.gamepadConfig.gamepadConnected) {
            this.gamepadConfig.gamepadConnected.set(false);
        }

        // Call all registered disconnect callbacks
        this.disconnectCallbacks.forEach(callback => callback());
    }

    /**
     * Handle gamepad button press event
     * 
     * @param e - Button press event from joypad.js
     */
    private handleGamepadButtonPress(e: any): void {
        if (!this.gamepadEnabled || !this.gamepadConfig.enabled) return;
        if (this.stop) return;

        const { buttonName } = e.detail;
        const buttonMapping = this.gamepadConfig.buttonMapping || DEFAULT_BUTTON_MAPPING;
        const controlName = buttonMapping[buttonName];

        if (controlName) {
            // Apply the control action (press and release)
            this.applyControl(controlName).catch(() => {
                // Ignore errors
            });
        }
    }

    /**
     * Handle gamepad axis movement event
     * 
     * @param e - Axis move event from joypad.js
     */
    private handleGamepadAxisMove(e: any): void {
        if (!this.gamepadEnabled || !this.gamepadConfig.enabled) return;
        if (this.stop) return;

        this.gamepadMoving = true;
        this.gamepadAxisDate = Date.now();

        let direction = e.detail.directionOfMovement;
        const axisMapping = this.gamepadConfig.axisMapping || DEFAULT_AXIS_MAPPING;

        // Map joypad direction to control direction
        if (direction === 'top') direction = axisMapping['top'] || 'up';
        else if (direction === 'bottom') direction = axisMapping['bottom'] || 'down';
        else if (direction === 'left') direction = axisMapping['left'] || 'left';
        else if (direction === 'right') direction = axisMapping['right'] || 'right';

        // Update active directions
        this.gamepadDirections = {
            [direction]: true
        };

        // Release other directions
        const allDirections = ['up', 'down', 'left', 'right'];
        for (const dir of allDirections) {
            if (!this.gamepadDirections[dir]) {
                this.applyControl(dir, false).catch(() => {
                    // Ignore errors
                });
            }
        }

        // Trigger movement
        this.processGamepadMovement();
    }

    /**
     * Process continuous gamepad movement
     * Called at intervals to repeat movement actions while axes are active
     */
    private processGamepadMovement(): void {
        if (!this.gamepadMoving) return;
        if (this.stop) return;

        for (const direction in this.gamepadDirections) {
            if (this.gamepadDirections[direction]) {
                this.applyControl(direction, true).catch(() => {
                    // Ignore errors
                });
            }
        }
    }

    /**
     * Process gamepad inputs each step
     * Handles timeout for stopping movements after axis inactivity
     */
    protected preStep(): void {
        if (this.stop) return;

        // Stop movements if no axis input for 100ms
        const now = Date.now();
        if (now - this.gamepadAxisDate > 100 && this.gamepadMoving) {
            const allDirections = ['up', 'down', 'left', 'right'];
            for (const dir of allDirections) {
                this.gamepadDirections = {};
                this.gamepadMoving = false;
                this.applyControl(dir, false).catch(() => {
                    // Ignore errors
                });
            }
        }
    }

    /**
     * Update gamepad configuration
     * Merges provided config with defaults
     * Automatically registers callbacks from config
     * 
     * @param config - Partial gamepad configuration
     */
    updateGamepadConfig(config: Partial<GamepadConfig>): void {
        // Remove old callbacks if they were registered
        if (this.gamepadConfig.onConnect) {
            this.offConnect(this.gamepadConfig.onConnect);
        }
        if (this.gamepadConfig.onDisconnect) {
            this.offDisconnect(this.gamepadConfig.onDisconnect);
        }

        this.gamepadConfig = {
            enabled: config.enabled !== undefined ? config.enabled : true,
            buttonMapping: config.buttonMapping || DEFAULT_BUTTON_MAPPING,
            axisMapping: config.axisMapping || DEFAULT_AXIS_MAPPING,
            axisThreshold: config.axisThreshold || 0.5,
            moveInterval: config.moveInterval || 400,
            onConnect: config.onConnect,
            onDisconnect: config.onDisconnect,
            gamepadConnected: config.gamepadConnected
        };

        // Register new callbacks if provided
        if (this.gamepadConfig.onConnect) {
            this.onConnect(this.gamepadConfig.onConnect);
        }
        if (this.gamepadConfig.onDisconnect) {
            this.onDisconnect(this.gamepadConfig.onDisconnect);
        }
    }

    /**
     * Extract gamepad config from controls configuration and update
     * Note: Callbacks are stored but not automatically registered, they should be registered in mount()
     * 
     * @param inputs - Controls configuration that may contain a 'gamepad' property
     */
    extractGamepadConfig(inputs: Controls & { gamepad?: GamepadConfig }): void {
        if (inputs.gamepad) {
            this.updateGamepadConfig(inputs.gamepad);
        }
    }

    /**
     * Get the current gamepad configuration
     * 
     * @returns The gamepad configuration object
     */
    getGamepadConfig(): GamepadConfig {
        return this.gamepadConfig;
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
     * Override setInputs to extract gamepad config
     */
    setInputs(inputs: Controls & { gamepad?: GamepadConfig }): void {
        super.setInputs(inputs);
        this.extractGamepadConfig(inputs);
    }

    /**
     * Register a callback to be called when a gamepad is connected
     * 
     * @param callback - Function to call when gamepad connects
     * @example
     * ```ts
     * gamepadControls.onConnect(() => {
     *   console.log('Gamepad connected!');
     * });
     * ```
     */
    onConnect(callback: () => void): void {
        this.connectCallbacks.push(callback);
    }

    /**
     * Register a callback to be called when a gamepad is disconnected
     * 
     * @param callback - Function to call when gamepad disconnects
     * @example
     * ```ts
     * gamepadControls.onDisconnect(() => {
     *   console.log('Gamepad disconnected!');
     * });
     * ```
     */
    onDisconnect(callback: () => void): void {
        this.disconnectCallbacks.push(callback);
    }

    /**
     * Remove a connect callback
     * 
     * @param callback - Callback to remove
     */
    offConnect(callback: () => void): void {
        const index = this.connectCallbacks.indexOf(callback);
        if (index > -1) {
            this.connectCallbacks.splice(index, 1);
        }
    }

    /**
     * Remove a disconnect callback
     * 
     * @param callback - Callback to remove
     */
    offDisconnect(callback: () => void): void {
        const index = this.disconnectCallbacks.indexOf(callback);
        if (index > -1) {
            this.disconnectCallbacks.splice(index, 1);
        }
    }

    /**
     * Check if gamepad is currently connected
     * 
     * @returns true if gamepad is connected, false otherwise
     */
    isConnected(): boolean {
        return this.gamepadMoveInterval !== null;
    }

    /**
     * Reinitialize gamepad listeners
     * Useful if joypad.js becomes available after initialization
     * 
     * @example
     * ```ts
     * // If joypad.js loads later
     * gamepadControls.reinit();
     * ```
     */
    reinit(): void {
        if (!this.joypad) {
            this.initGamepad();
        }
    }
}
