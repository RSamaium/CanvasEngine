import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GamepadControls } from '../../packages/core/src/directives/GamepadControls';

type Handler = (event: any) => void;

/** Minimal joypad.js double: `on` returns a subscription like the real library. */
const createJoypad = () => {
    const handlers: Record<string, Set<Handler>> = {};
    const unsubscribe = vi.fn();
    const on = vi.fn((name: string, handler: Handler) => {
        (handlers[name] ??= new Set()).add(handler);
        return {
            unsubscribe: () => {
                unsubscribe(name);
                handlers[name].delete(handler);
            },
        };
    });
    const publish = (name: string, detail?: any) => {
        handlers[name]?.forEach((handler) => handler({ detail }));
    };
    return { on, publish, unsubscribe, instances: {} as any };
};

const press = (joypad: ReturnType<typeof createJoypad>, buttonName: string) =>
    joypad.publish('button_press', { buttonName });

const push = (joypad: ReturnType<typeof createJoypad>, directionOfMovement: string) =>
    joypad.publish('axis_move', { directionOfMovement });

describe('GamepadControls', () => {
    let joypad: ReturnType<typeof createJoypad>;

    beforeEach(() => {
        vi.useFakeTimers();
        joypad = createJoypad();
        (window as any).joypad = joypad;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    test('maps a button press to its control', () => {
        const action = vi.fn();
        const controls = new GamepadControls();
        controls.setInputs({ action: { bind: 'space', keyDown: action }, gamepad: { enabled: true } } as any);
        controls.start();

        press(joypad, 'button_0');

        expect(action).toHaveBeenCalledTimes(1);
        controls.destroy();
    });

    test('stops answering to the gamepad once destroyed', () => {
        const action = vi.fn();
        const controls = new GamepadControls();
        controls.setInputs({ action: { bind: 'space', keyDown: action }, gamepad: { enabled: true } } as any);
        controls.start();
        controls.destroy();

        press(joypad, 'button_0');
        push(joypad, 'bottom');

        expect(action).not.toHaveBeenCalled();
    });

    test('unsubscribes every joypad.js subscription it made', () => {
        const controls = new GamepadControls();
        controls.setInputs({ action: { bind: 'space' }, gamepad: { enabled: true } } as any);
        controls.start();
        expect(joypad.on).toHaveBeenCalledTimes(4);

        controls.destroy();

        expect(joypad.unsubscribe.mock.calls.map(([name]) => name).sort()).toEqual(
            ['axis_move', 'button_press', 'connect', 'disconnect'],
        );
    });

    test('does not throw when the Gamepad API is missing (window.joypad = {})', () => {
        (window as any).joypad = {};
        const connected = { set: vi.fn() };
        const controls = new GamepadControls();
        controls.setInputs({ action: { bind: 'space' }, gamepad: { enabled: true, gamepadConnected: connected } } as any);

        expect(() => controls.start()).not.toThrow();
        expect(connected.set).toHaveBeenCalledWith(false);
        expect(() => controls.destroy()).not.toThrow();
    });

    describe('stick', () => {
        const pushFrames = (frames: number, frameMs = 16) => {
            for (let i = 0; i < frames; i++) {
                push(joypad, 'bottom');
                vi.advanceTimersByTime(frameMs);
            }
        };

        test('applies the direction on every frame by default', () => {
            const down = vi.fn();
            const controls = new GamepadControls();
            controls.setInputs({ down: { bind: 'down', keyDown: down }, gamepad: { enabled: true } } as any);
            controls.start();

            pushFrames(10);

            expect(down.mock.calls.length).toBeGreaterThanOrEqual(10);
            controls.destroy();
        });

        test('applies the direction at most once per stepInterval', () => {
            const down = vi.fn();
            const controls = new GamepadControls();
            controls.setInputs({
                down: { bind: 'down', keyDown: down },
                gamepad: { enabled: true, stepInterval: 100 },
            } as any);
            controls.start();

            pushFrames(20); // 320 ms of a pushed stick: steps at 0, 112 and 224 ms

            expect(down).toHaveBeenCalledTimes(3);
            controls.destroy();
        });

        test('accepts an interval per control with a default', () => {
            const down = vi.fn();
            const controls = new GamepadControls();
            controls.setInputs({
                down: { bind: 'down', keyDown: down },
                gamepad: { enabled: true, stepInterval: { default: 200, left: 50 } },
            } as any);
            controls.start();

            pushFrames(20);

            expect(down).toHaveBeenCalledTimes(2);
            controls.destroy();
        });

        test('steps again right away after the stick was released', () => {
            const down = vi.fn();
            const controls = new GamepadControls();
            controls.setInputs({
                down: { bind: 'down', keyDown: down },
                gamepad: { enabled: true, stepInterval: 1000 },
            } as any);
            controls.start();

            pushFrames(1);
            vi.advanceTimersByTime(200); // released: no axis event for a while
            pushFrames(1);

            expect(down).toHaveBeenCalledTimes(2);
            controls.destroy();
        });
    });
});
