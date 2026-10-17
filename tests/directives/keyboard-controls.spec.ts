import { afterEach, describe, expect, test, vi } from 'vitest';
import { KeyboardControls } from '../../packages/core/src/directives/KeyboardControls';

const DOWN = 40;

const key = (type: 'keydown' | 'keyup') => {
    const event: any = new Event(type);
    event.keyCode = DOWN;
    document.dispatchEvent(event);
};

describe('KeyboardControls', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('calls keyUp while it is running', () => {
        const keyUp = vi.fn();
        const controls = new KeyboardControls();
        controls.setInputs({ down: { bind: 'down', keyUp } });
        controls.start();

        key('keydown');
        key('keyup');

        expect(keyUp).toHaveBeenCalledTimes(1);
        controls.destroy();
    });

    test('stops listening to the keyboard once destroyed', () => {
        const keyUp = vi.fn();
        const controls = new KeyboardControls();
        controls.setInputs({ down: { bind: 'down', keyUp } });
        controls.start();
        controls.destroy();

        key('keydown');
        key('keyup');

        expect(keyUp).not.toHaveBeenCalled();
    });

    test('removes the very listeners it added on the document', () => {
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const controls = new KeyboardControls();
        controls.setInputs({ down: { bind: 'down' } });
        controls.start();
        controls.destroy();

        for (const type of ['keydown', 'keyup']) {
            const added = add.mock.calls.filter(([name]) => name === type).map(([, handler]) => handler);
            const removed = remove.mock.calls.filter(([name]) => name === type).map(([, handler]) => handler);
            expect(added).toHaveLength(1);
            expect(removed).toEqual(added);
        }
    });
});
