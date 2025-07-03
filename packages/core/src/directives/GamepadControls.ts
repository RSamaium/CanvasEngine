import { Directive, registerDirective } from "../engine/directive";
import { Element } from "../engine/reactive";
import { fps2ms } from "../engine/utils";
import 'joypad.js';

// Import interfaces from KeyboardControls
import { ControlOptions, Controls } from './KeyboardControls';

declare const joypad: any;

export interface GamepadOptions {
    connect?: {
        message?: string;
        time?: number;
        icon?: string;
        sound?: string;
    };
    disconnect?: {
        message?: string;
        time?: number;
        icon?: string;
        sound?: string;
    };
}

export enum GamepadInput {
    Button0 = 'button_0',
    Button1 = 'button_1',
    Button2 = 'button_2',
    Button3 = 'button_3',
    Button4 = 'button_4',
    Button5 = 'button_5',
    Button6 = 'button_6',
    Button7 = 'button_7',
    Button8 = 'button_8',
    Button9 = 'button_9',
    Button10 = 'button_10',
    Button11 = 'button_11',
    Button12 = 'button_12',
    Button13 = 'button_13',
    Button14 = 'button_14',
    Button15 = 'button_15',
    Button16 = 'button_16',
    Button17 = 'button_17',
    DpadUp = 'dpad_up',
    DpadDown = 'dpad_down',
    DpadLeft = 'dpad_left',
    DpadRight = 'dpad_right',
    LeftStickUp = 'left_stick_up',
    LeftStickDown = 'left_stick_down',
    LeftStickLeft = 'left_stick_left',
    LeftStickRight = 'left_stick_right',
    RightStickUp = 'right_stick_up',
    RightStickDown = 'right_stick_down',
    RightStickLeft = 'right_stick_left',
    RightStickRight = 'right_stick_right'
}

type BoundGamepadKey = { actionName: string, options: ControlOptions, parameters?: any }

export class GamepadControls extends Directive {
    private boundKeys: {
        [keyName: string]: BoundGamepadKey
    } = {}
    private stop: boolean = false
    private _controlsOptions: Controls = {}
    private interval: any
    private serverFps: number = 60
    private moving: boolean = false
    private directions: {[key: string]: boolean} = {}
    private axisDate: number = 0
    private isConnected: boolean = false
    private gamepadOptions: GamepadOptions = {}

    // Direction mappings
    private readonly DIRECTIONS = ['up', 'down', 'left', 'right']

    onInit(element: Element) {
        const value = element.props.gamepadControls?.value ?? element.props.gamepadControls
        const options = element.props.gamepadOptions?.value ?? element.props.gamepadOptions
        
        if (options) {
            this.gamepadOptions = options
        }

        if (!value) return
        
        this.setupGamepadListeners();
        this.setInputs(value)
        
        // Process gamepad input at consistent intervals
        this.interval = setInterval(() => {
            this.preStep()
        }, fps2ms(this.serverFps ?? 60))
    }

    onMount(element: Element) {}

    onUpdate(props) {
        if (props.gamepadControls) {
            this.setInputs(props.gamepadControls)
        }
        if (props.gamepadOptions) {
            this.gamepadOptions = props.gamepadOptions
        }
    }

    onDestroy() {
        if (this.interval) {
            clearInterval(this.interval)
        }
        // joypad event listeners are handled by the library itself
    }

    /** @internal */
    preStep() {
        if (this.stop || !this.isConnected) return;

        // Handle movement similar to KeyboardControls
        if (this.moving) {
            for (let dir in this.directions) {
                if (this.directions[dir]) {
                    this.applyGamepadControl(dir, true)
                }
            }
        }

        // Handle axis timeout
        let now = Date.now()
        if (now - this.axisDate > 100 && this.moving) {
            for (let dir of this.DIRECTIONS) {
                this.directions = {}
                this.moving = false
                this.applyGamepadControl(dir, false)
            }
        }
    }

    private setupGamepadListeners() {
        const defaultConnectOptions = {
            message: 'Your gamepad is connected!',
            time: 2000,
            sound: 'connect',
            ...this.gamepadOptions.connect || {}
        }
        
        const defaultDisconnectOptions = {
            message: 'Your gamepad is disconnected!',
            time: 2000,
            sound: 'disconnect',
            ...this.gamepadOptions.disconnect || {}
        }

        // Handle gamepad connection
        joypad.on('connect', (e: any) => {
            this.isConnected = true
            // Emit notification if RpgGui is available
            if (typeof window !== 'undefined' && (window as any).RpgGui) {
                (window as any).RpgGui.display('rpg-notification', defaultConnectOptions)
            }
            console.log('Gamepad connected:', e.gamepad?.id)
        })

        // Handle gamepad disconnection
        joypad.on('disconnect', (e: any) => {
            this.isConnected = false
            // Emit notification if RpgGui is available
            if (typeof window !== 'undefined' && (window as any).RpgGui) {
                (window as any).RpgGui.display('rpg-notification', defaultDisconnectOptions)
            }
            console.log('Gamepad disconnected:', e.gamepad?.id)
        })

        // Handle button presses
        joypad.on('button_press', (e: any) => {
            const { buttonName } = e.detail;
            this.handleButtonPress(buttonName)
        })

        // Handle button releases
        joypad.on('button_release', (e: any) => {
            const { buttonName } = e.detail;
            this.handleButtonRelease(buttonName)
        })

        // Handle axis movement (analog sticks)
        joypad.on('axis_move', (e: any) => {
            this.moving = true
            this.axisDate = Date.now()
            
            let direction = e.detail.directionOfMovement
            // Convert joypad direction names to our direction names
            if (direction === 'bottom') direction = 'down'
            else if (direction === 'top') direction = 'up'
            else if (direction === 'left') direction = 'left'
            else if (direction === 'right') direction = 'right'
            
            this.directions = {
                [direction]: true
            }
            
            // Release other directions
            for (let dir of this.DIRECTIONS) {
                if (!this.directions[dir]) {
                    this.applyGamepadControl(dir, false)
                }
            }
        })
    }

    private handleButtonPress(buttonName: string) {
        // Handle bound buttons
        if (this.boundKeys[buttonName]) {
            const boundKey = this.boundKeys[buttonName]
            const { keyDown } = boundKey.options
            if (keyDown) {
                keyDown(boundKey)
            }
        }
    }

    private handleButtonRelease(buttonName: string) {
        // Handle bound buttons
        if (this.boundKeys[buttonName]) {
            const boundKey = this.boundKeys[buttonName]
            const { keyUp } = boundKey.options
            if (keyUp) {
                keyUp(boundKey)
            }
        }
    }

    private bindKey(keys: GamepadInput | GamepadInput[], actionName: string, options: ControlOptions, parameters?: object) {
        if (!Array.isArray(keys)) keys = [keys] as GamepadInput[]
        const keyOptions = Object.assign({
            repeat: false
        }, options);
        (keys as GamepadInput[]).forEach(keyName => {
            this.boundKeys[keyName] = { actionName, options: keyOptions, parameters }
        })
    }

    /**
     * Apply control using the same method as KeyboardControls
     * This allows gamepad controls to trigger the same actions as keyboard controls
     */
    async applyGamepadControl(controlName: string | number, isDown?: boolean | undefined): Promise<void> {
        const control = this._controlsOptions[controlName]
        if (control) {
            const input = Array.isArray(control.bind) ? control.bind[0] : control.bind
            
            // Create synthetic keyboard events to trigger KeyboardControls
            if (typeof input === 'string') {
                if (isDown === undefined) {
                    // Simulate key press (down then up)
                    this.dispatchSyntheticKeyEvent(input, true)
                    setTimeout(() => {
                        this.dispatchSyntheticKeyEvent(input, false)
                    }, 100)
                } else {
                    this.dispatchSyntheticKeyEvent(input, isDown)
                }
            }
        }
    }

    private dispatchSyntheticKeyEvent(keyName: string, isDown: boolean) {
        // Map common key names to key codes
        const keyCodeMap: { [key: string]: number } = {
            'up': 38,
            'down': 40,
            'left': 37,
            'right': 39,
            'space': 32,
            'enter': 13,
            'escape': 27,
            'a': 65,
            'b': 66,
            'c': 67,
            'd': 68,
            'e': 69,
            'f': 70,
            'g': 71,
            'h': 72,
            'i': 73,
            'j': 74,
            'k': 75,
            'l': 76,
            'm': 77,
            'n': 78,
            'o': 79,
            'p': 80,
            'q': 81,
            'r': 82,
            's': 83,
            't': 84,
            'u': 85,
            'v': 86,
            'w': 87,
            'x': 88,
            'y': 89,
            'z': 90
        }

        const keyCode = keyCodeMap[keyName.toLowerCase()]
        if (keyCode) {
            const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
                keyCode: keyCode,
                bubbles: true,
                cancelable: true
            } as any)
            
            // Dispatch the event to the document
            document.dispatchEvent(event)
        }
    }

    /**
     * Get control information
     */
    getControl(inputName: string): BoundGamepadKey | undefined {
        return this.boundKeys[inputName]
    }

    /**
     * Get all controls
     */
    getControls(): { [key: string]: BoundGamepadKey } {
        return this.boundKeys
    }

    /**
     * Apply control directly (similar to KeyboardControls.applyControl)
     */
    async applyControl(controlName: string | number, isDown?: boolean | undefined): Promise<void> {
        await this.applyGamepadControl(controlName, isDown)
    }

    /**
     * Stop listening to gamepad inputs
     */
    stopInputs() {
        this.stop = true
    }

    /**
     * Resume listening to gamepad inputs
     */
    listenInputs() {
        this.stop = false
        this.directions = {}
        this.moving = false
    }

    /**
     * Set gamepad input mappings
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
     * Get current options
     */
    get options(): Controls {
        return this._controlsOptions
    }

    /**
     * Check if gamepad is connected
     */
    get connected(): boolean {
        return this.isConnected
    }
}

registerDirective('gamepadControls', GamepadControls)