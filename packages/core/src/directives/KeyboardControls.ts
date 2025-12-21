import { ControlsBase, ControlOptions, Controls, BoundKey } from "./ControlsBase";

export enum Input {
    Break = 'break',
    Backspace = 'backspace',
    Tab = 'tab',
    Clear = 'clear',
    Enter = 'enter',
    Shift = 'shift',
    Ctrl = 'ctrl',
    Alt = 'alt',
    Pause = 'pause/break',
    CapsLock = 'caps lock',
    Escape = 'escape',
    Conversion = 'conversion',
    NonConversion = 'non-conversion',
    Space = 'space',
    PageUp = 'page up',
    PageDown = 'page down',
    End = 'end',
    Home = 'home',
    Left = 4,
    Up = 1,
    Right = 2,
    Down = 3,
    Select = 'select',
    Print = 'print',
    Execute = 'execute',
    PrintScreen = 'Print Screen',
    Insert = 'insert',
    Delete = 'delete',
    Zero = '0',
    One = '1',
    Two = '2',
    Three = '3',
    Four = '4',
    Five = '5',
    Six = '6',
    Seven = '7',
    Height = '8',
    Nine = '9',
    Equal = '=',
    Semicolon = 'semicolon (firefox), equals',
    LessThan = '<',
    Equals = 'equals (firefox)',
    Beta = 'ß',
    At = '@',
    A = 'a',
    B = 'b',
    C = 'c',
    D = 'd',
    E = 'e',
    F = 'f',
    G = 'g',
    H = 'h',
    I = 'i',
    J = 'j',
    K = 'k',
    L = 'l',
    M = 'm',
    N = 'n',
    O = 'o',
    P = 'p',
    Q = 'q',
    R = 'r',
    S = 's',
    T = 't',
    U = 'u',
    V = 'v',
    W = 'w',
    X = 'x',
    Y = 'y',
    Z = 'z',
    SearchKey = 'Windows Key / Left ⌘ / Chromebook Search key',
    NumPad0 = 'numpad 0',
    NumPad1 = 'numpad 1',
    NumPad2 = 'numpad 2',
    NumPad3 = 'numpad 3',
    NumPad4 = 'numpad 4',
    NumPad5 = 'numpad 5',
    NumPad6 = 'numpad 6',
    NumPad7 = 'numpad 7',
    NumPad8 = 'numpad 8',
    NumPad9 = 'numpad 9',
    Multiply = 'multiply',
    Add = 'add',
    Subtract = 'subtract',
    DecimalPoint = 'decimal point',
    Divide = 'divide',
    F1 = 'f1',
    F2 = 'f2',
    F3 = 'f3',
    F4 = 'f4',
    F5 = 'f5',
    F6 = 'f6',
    F7 = 'f7',
    F8 = 'f8',
    F9 = 'f9',
    F10 = 'f10',
    F11 = 'f11',
    F12 = 'f12',
    F13 = 'f13',
    F14 = 'f14',
    F15 = 'f15',
    F16 = 'f16',
    F17 = 'f17',
    F18 = 'f18',
    F19 = 'f19',
    F20 = 'f20',
    F21 = 'f21',
    F22 = 'f22',
    F23 = 'f23',
    F24 = 'f24',
    NumLock = 'num lock',
    ScrollLock = 'scroll lock',
    CircumflexAccent = '^',
    ExclamationMark = '!',
    Hash = '#',
    Dollar = '$',
    AccentU = 'ù',
    PageBackward = 'page backward',
    PageForWard = 'page forward',
    Star = '*',
    DecreaseVolume = 'decrease volume level',
    IncreaseVolume = 'increase volume level',
    Next = 'next',
    Previous = 'previous',
    Stop = 'stop',
    PlayPause = 'play/pause',
    Email = 'e-mail',
    SemiColon = 'semi-colon / ñ',
    EqualSign = 'equal sign',
    Comma = 'comma',
    Dash = 'dash',
    FowardSlach = 'forward slash / ç',
    GraveAccent = 'grave accent / ñ / æ',
    OpenBracket = 'open bracket',
    BackSlach = 'back slash',
    CloseBracket = 'close bracket / å',
    SingleQuote = 'single quote / ø',
    BackQuote = '`',
    Altgr = 'altgr'
}

// Re-export for backward compatibility
export type { ControlOptions, Controls, BoundKey };

// keyboard handling
const keyCodeTable = {
    3: 'break',
    8: 'backspace', // backspace / delete
    9: 'tab',
    12: 'clear',
    13: 'enter',
    16: 'shift',
    17: 'ctrl',
    18: 'alt',
    19: 'pause/break',
    20: 'caps lock',
    27: 'escape',
    28: 'conversion',
    29: 'non-conversion',
    32: 'space',
    33: 'page up',
    34: 'page down',
    35: 'end',
    36: 'home',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    41: 'select',
    42: 'print',
    43: 'execute',
    44: 'Print Screen',
    45: 'insert',
    46: 'delete',
    48: 'n0',
    49: 'n1',
    50: 'n2',
    51: 'n3',
    52: 'n4',
    53: 'n5',
    54: 'n6',
    55: 'n7',
    56: 'n8',
    57: 'n9',
    58: ':',
    59: 'semicolon (firefox), equals',
    60: '<',
    61: 'equals (firefox)',
    63: 'ß',
    64: '@',
    65: 'a',
    66: 'b',
    67: 'c',
    68: 'd',
    69: 'e',
    70: 'f',
    71: 'g',
    72: 'h',
    73: 'i',
    74: 'j',
    75: 'k',
    76: 'l',
    77: 'm',
    78: 'n',
    79: 'o',
    80: 'p',
    81: 'q',
    82: 'r',
    83: 's',
    84: 't',
    85: 'u',
    86: 'v',
    87: 'w',
    88: 'x',
    89: 'y',
    90: 'z',
    91: 'Windows Key / Left ⌘ / Chromebook Search key',
    92: 'right window key',
    93: 'Windows Menu / Right ⌘',
    96: 'numpad 0',
    97: 'numpad 1',
    98: 'numpad 2',
    99: 'numpad 3',
    100: 'numpad 4',
    101: 'numpad 5',
    102: 'numpad 6',
    103: 'numpad 7',
    104: 'numpad 8',
    105: 'numpad 9',
    106: 'multiply',
    107: 'add',
    108: 'numpad period (firefox)',
    109: 'subtract',
    110: 'decimal point',
    111: 'divide',
    112: 'f1',
    113: 'f2',
    114: 'f3',
    115: 'f4',
    116: 'f5',
    117: 'f6',
    118: 'f7',
    119: 'f8',
    120: 'f9',
    121: 'f10',
    122: 'f11',
    123: 'f12',
    124: 'f13',
    125: 'f14',
    126: 'f15',
    127: 'f16',
    128: 'f17',
    129: 'f18',
    130: 'f19',
    131: 'f20',
    132: 'f21',
    133: 'f22',
    134: 'f23',
    135: 'f24',
    144: 'num lock',
    145: 'scroll lock',
    160: '^',
    161: '!',
    163: '#',
    164: '$',
    165: 'ù',
    166: 'page backward',
    167: 'page forward',
    169: 'closing paren (AZERTY)',
    170: '*',
    171: '~ + * key',
    173: 'minus (firefox), mute/unmute',
    174: 'decrease volume level',
    175: 'increase volume level',
    176: 'next',
    177: 'previous',
    178: 'stop',
    179: 'play/pause',
    180: 'e-mail',
    181: 'mute/unmute (firefox)',
    182: 'decrease volume level (firefox)',
    183: 'increase volume level (firefox)',
    186: 'semi-colon / ñ',
    187: 'equal sign',
    188: 'comma',
    189: 'dash',
    190: 'period',
    191: 'forward slash / ç',
    192: 'grave accent / ñ / æ',
    193: '?, / or °',
    194: 'numpad period (chrome)',
    219: 'open bracket',
    220: 'back slash',
    221: 'close bracket / å',
    222: 'single quote / ø',
    223: '`',
    224: 'left or right ⌘ key (firefox)',
    225: 'altgr',
    226: '< /git >',
    230: 'GNOME Compose Key',
    231: 'ç',
    233: 'XF86Forward',
    234: 'XF86Back',
    240: 'alphanumeric',
    242: 'hiragana/katakana',
    243: 'half-width/full-width',
    244: 'kanji',
    255: 'toggle touchpad'
};

const inverse = (obj) => {
    const newObj = {}
    for (let key in obj) {
        const val = obj[key]
        newObj[val] = key
    }
    return newObj
}

const inverseKeyCodeTable = inverse(keyCodeTable)

/**
 * Keyboard input controls implementation
 * 
 * Handles keyboard input events and maps them to control actions.
 * Supports composite directions (diagonal movement) and key repeat functionality.
 * 
 * @example
 * ```ts
 * const keyboardControls = new KeyboardControls();
 * keyboardControls.setInputs({
 *   up: {
 *     repeat: true,
 *     bind: Input.Up,
 *     keyDown() {
 *       console.log('Up pressed');
 *     }
 *   }
 * });
 * keyboardControls.start();
 * ```
 */
export class KeyboardControls extends ControlsBase {
    private keyState: {
        [keyName: string]: {
            isDown: boolean,
            count: number
        } | null
    } = {}
    private lastKeyPressed: number | null = null
    private directionState: {
        up: boolean,
        down: boolean,
        left: boolean,
        right: boolean
    } = {
            up: false,
            down: false,
            left: false,
            right: false
        };

    /**
     * Setup keyboard event listeners
     */
    protected setupListeners(): void {
        document.addEventListener('keydown', (e) => { this.onKeyChange(e, true); });
        document.addEventListener('keyup', (e) => { this.onKeyChange(e, false); });
    }

    /**
     * Cleanup keyboard event listeners
     */
    protected cleanup(): void {
        document.removeEventListener('keydown', (e) => { this.onKeyChange(e, true); });
        document.removeEventListener('keyup', (e) => { this.onKeyChange(e, false); });
    }

    /**
     * Process keyboard inputs each step
     */
    protected preStep() {
        if (this.stop) return;

        const direction = this.getDirection();
        if (direction !== 'none') {
            // Trigger only the composite direction
            const directionControl = this.boundKeys[direction];
            if (directionControl) {
                const { keyDown } = directionControl.options;
                if (keyDown) {
                    this.applyInput(direction);
                }
            }
        } else {
            // Process other controls as before
            const boundKeys = Object.keys(this.boundKeys);
            for (let keyName of boundKeys) {
                this.applyInput(keyName);
            }
        }
    }

    /**
     * Apply input for a keyboard key
     * Overrides base implementation to handle key state and repeat logic
     */
    protected applyInput(keyName: string) {
        const keyState = this.keyState[keyName];
        if (!keyState) {
            return;
        }
        const { isDown, count } = keyState;
        if (isDown) {
            const boundKey = this.boundKeys[keyName];
            if (!boundKey) {
                return;
            }
            const { repeat, keyDown } = boundKey.options;
            if ((repeat || count == 0)) {
                let parameters = boundKey.parameters;
                if (typeof parameters === "function") {
                    parameters = parameters();
                }
                if (keyDown) {
                    keyDown(boundKey);
                }
                this.keyState[keyName]!.count++;
            }
        }
    }

    private applyKeyDown(name: string) {
        const code = inverseKeyCodeTable[name]
        const e: any = new Event('keydown')
        e.keyCode = code
        this.onKeyChange(e, true)
    }

    private applyKeyUp(name: string) {
        const code = inverseKeyCodeTable[name]
        const e: any = new Event('keyup')
        e.keyCode = code
        this.onKeyChange(e, false)
    }

    private applyKeyPress(name: string): Promise<void> {
        return new Promise((resolve: any) => {
            this.applyKeyDown(name)
            setTimeout(() => {
                this.applyKeyUp(name)
                resolve()
            }, 200)
        })
    }

    private onKeyChange(e: KeyboardEvent, isDown: boolean) {
        e = (e || window.event) as KeyboardEvent;

        const keyName: string = keyCodeTable[e.keyCode];

        if (keyName && this.boundKeys[keyName]) {
            if (this.keyState[keyName] == null) {
                this.keyState[keyName] = {
                    count: 0,
                    isDown: true
                };
            }
            this.keyState[keyName]!.isDown = isDown;

            // key up, reset press count
            if (!isDown) {
                this.keyState[keyName]!.count = 0
                const { keyUp } = this.boundKeys[keyName].options
                if (keyUp) {
                    keyUp(this.boundKeys[keyName]);
                }
            }

            // keep reference to the last key pressed to avoid duplicates
            this.lastKeyPressed = isDown ? e.keyCode : null;
        }

        if (keyName) {
            this.updateDirectionState(keyName, isDown);
        }
    }

    private updateDirectionState(keyName: string, isDown: boolean) {
        switch (keyName) {
            case 'up':
                this.directionState.up = isDown;
                break;
            case 'down':
                this.directionState.down = isDown;
                break;
            case 'left':
                this.directionState.left = isDown;
                break;
            case 'right':
                this.directionState.right = isDown;
                break;
        }
    }

    private getDirection(): string {
        const { up, down, left, right } = this.directionState;

        if (up && left) return 'up_left';
        if (up && right) return 'up_right';
        if (down && left) return 'down_left';
        if (down && right) return 'down_right';
        if (up) return 'up';
        if (down) return 'down';
        if (left) return 'left';
        if (right) return 'right';

        return 'none';
    }

    /**
     * Apply a control action programmatically
     * Triggers keyboard events to simulate key presses
     * 
     * @param controlName - Name of the control
     * @param isDown - Whether the key is pressed (true) or released (false)
     * @returns Promise that resolves when the action is complete
     * @example
     * ```ts
     * // Press a key
     * await keyboardControls.applyControl('action', true);
     * 
     * // Release a key
     * await keyboardControls.applyControl('action', false);
     * 
     * // Press and release (default)
     * await keyboardControls.applyControl('action');
     * ```
     */
    async applyControl(controlName: string | number, isDown?: boolean | undefined): Promise<void> {
        const control = this._controlsOptions[controlName]
        if (control) {
            const input = Array.isArray(control.bind) ? control.bind[0] : control.bind
            if (isDown === undefined) {
                await this.applyKeyPress(input as string)
            }
            else if (isDown) {
                this.applyKeyDown(input as string)
            }
            else {
                this.applyKeyUp(input as string)
            }
        }
    }

    /**
     * Resume listening to inputs after stopInputs() was called
     * Also resets keyboard state
     */
    listenInputs() {
        super.listenInputs();
        this.keyState = {}
    }

}