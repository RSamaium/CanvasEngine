import { Container, h, mount, signal } from "canvasengine";
import { describe, expect, test, vi } from "vitest";
import { TestBed } from "../../packages/core/testing";

describe('Dependencies Prop', () => {
    test('component mounts immediately with defined signal dependency', async () => {
        const mockMount = vi.fn();
        const dep = signal('defined value');

        function MyComponent() {
            mount((element) => {
                mockMount(element);
            });
            return h(Container);
        }

        await TestBed.createComponent(MyComponent, { dependencies: [dep] });

        expect(mockMount).toHaveBeenCalledTimes(1);
    });

    test('component does not mount with undefined signal dependency', async () => {
        const mockMount = vi.fn();
        const dep = signal<string | undefined>(undefined);

        function MyComponent() {
            mount((element) => {
                mockMount(element);
            });
            return h(Container);
        }

        await TestBed.createComponent(MyComponent, { dependencies: [dep] });

        // Should not have mounted because dependency is undefined
        expect(mockMount).toHaveBeenCalledTimes(0);
    });

    test('component mounts when signal dependency becomes defined', async () => {
        const mockMount = vi.fn();
        const dep = signal<string | undefined>(undefined);

        function MyComponent() {
            mount((element) => {
                mockMount(element);
            });
            return h(Container);
        }

        await TestBed.createComponent(MyComponent, { dependencies: [dep] });

        // Should not have mounted yet
        expect(mockMount).toHaveBeenCalledTimes(0);

        // Set the dependency to a defined value
        dep.set('now defined');
        await new Promise(resolve => setTimeout(resolve, 10));

        // Should now be mounted
        expect(mockMount).toHaveBeenCalledTimes(1);
    });

    test('component mounts with resolved promise dependency', async () => {
        const mockMount = vi.fn();
        const dep = Promise.resolve('resolved value');

        function MyComponent() {
            mount((element) => {
                mockMount(element);
            });
            return h(Container);
        }

        await TestBed.createComponent(MyComponent, { dependencies: [dep] });

        // Wait for async checkDependencies to complete
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mockMount).toHaveBeenCalledTimes(1);
    });

    test('component does not mount when promise resolves to undefined', async () => {
        const mockMount = vi.fn();
        const dep = Promise.resolve(undefined);

        function MyComponent() {
            mount((element) => {
                mockMount(element);
            });
            return h(Container);
        }

        await TestBed.createComponent(MyComponent, { dependencies: [dep] });

        expect(mockMount).toHaveBeenCalledTimes(0);
    });

    test('component mounts when all mixed dependencies are ready', async () => {
        const mockMount = vi.fn();
        const signalDep = signal('signal value');
        const promiseDep = Promise.resolve('promise value');

        function MyComponent() {
            mount((element) => {
                mockMount(element);
            });
            return h(Container);
        }

        await TestBed.createComponent(MyComponent, { dependencies: [signalDep, promiseDep] });

        // Wait for async checkDependencies to complete
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mockMount).toHaveBeenCalledTimes(1);
    });

    test('component does not mount when one of many dependencies is undefined', async () => {
        const mockMount = vi.fn();
        const definedSignal = signal('defined');
        const undefinedSignal = signal<string | undefined>(undefined);

        function MyComponent() {
            mount((element) => {
                mockMount(element);
            });
            return h(Container);
        }

        await TestBed.createComponent(MyComponent, { dependencies: [definedSignal, undefinedSignal] });

        // Should not have mounted because one dependency is undefined
        expect(mockMount).toHaveBeenCalledTimes(0);

        // Set the undefined signal to a value
        undefinedSignal.set('now defined');
        await new Promise(resolve => setTimeout(resolve, 10));

        // Should now be mounted
        expect(mockMount).toHaveBeenCalledTimes(1);
    });

    test('component without dependencies prop mounts normally', async () => {
        const mockMount = vi.fn();

        function MyComponent() {
            mount((element) => {
                mockMount(element);
            });
            return h(Container);
        }

        await TestBed.createComponent(MyComponent, {});

        expect(mockMount).toHaveBeenCalledTimes(1);
    });
});
