import 'vitest-webgl-canvas-mock'

const LOAD_FAILURE_SRC = 'LOAD_FAILURE_SRC';
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const virtualConsole = (global.window as any)._virtualConsole;

const shouldIgnoreTestConsoleMessage = (args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(' ');

    return message.includes("Not implemented: HTMLCanvasElement's getContext() method")
        || message.includes('Your browser does not support the Gamepad API')
        || message.includes('PixiJS Deprecation Warning')
        || message.includes('PixiJS Warning');
};

if (virtualConsole?.emit) {
    const originalVirtualConsoleEmit = virtualConsole.emit;

    virtualConsole.emit = function (eventName: string, ...args: unknown[]) {
        if (eventName === 'jsdomError' && shouldIgnoreTestConsoleMessage(args)) {
            return false;
        }
        return originalVirtualConsoleEmit.call(this, eventName, ...args);
    };
}

// mock image loading
Object.defineProperty(global.Image.prototype, 'src', {
    set(src) {
        if (src === LOAD_FAILURE_SRC) {
            setTimeout(() => this.onerror(new Error('mocked error')));
        } else if (src.startsWith('data')) {
            setTimeout(() => this.dispatchEvent(new Event("load")));
        }
    },
});

Object.defineProperty(global.window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    get() {
        setTimeout(() => (this.onloadeddata && this.onloadeddata()))
        return () => { }
    }
})

Object.defineProperty(global.window.HTMLMediaElement.prototype, 'load', {
    configurable: true,
    get() {
        setTimeout(() => (this.onloadeddata && this.onloadeddata()))
        return () => { }
    }
})

window.document.body.innerHTML = `<div id="root"></div>`

console.error = (...args: unknown[]) => {
    if (shouldIgnoreTestConsoleMessage(args)) return;
    originalConsoleError(...args);
}

console.warn = (...args: unknown[]) => {
    if (shouldIgnoreTestConsoleMessage(args)) return;
    originalConsoleWarn(...args);
}
