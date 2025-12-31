import { describe, test, expect, vi, beforeEach } from "vitest";
import { FocusContainer, Button, signal } from "canvasengine";
import { TestBed } from "../../packages/core/testing";
import { focusManager } from "../../packages/core/src/engine/FocusManager";

describe("FocusContainer tabindex synchronization", () => {
    test("should set initial focus based on tabindex prop", async () => {
        const button1 = Button({ tabindex: 0, text: 'Button 1' });
        const button2 = Button({ tabindex: 1, text: 'Button 2' });

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex: 1
        }, [button1, button2], { enableLayout: false });

        // Wait for children registration and initial focus application
        await new Promise(resolve => setTimeout(resolve, 50));

        const currentIndex = containerElement.componentInstance.getCurrentIndexSignal()();
        expect(currentIndex).toBe(1);
    });

    test("should update focus when tabindex signal changes", async () => {
        const tabindex = signal(0);
        const button1 = Button({ tabindex: 0, text: 'Button 1' });
        const button2 = Button({ tabindex: 1, text: 'Button 2' });

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex
        }, [button1, button2], { enableLayout: false });

        await new Promise(resolve => setTimeout(resolve, 50));
        expect(containerElement.componentInstance.getCurrentIndexSignal()()).toBe(0);

        // Update external signal
        tabindex.set(1);

        // Wait for effect
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(containerElement.componentInstance.getCurrentIndexSignal()()).toBe(1);
    });

    test("should update tabindex signal when focus changes internally", async () => {
        const tabindex = signal(0);
        const button1 = Button({ tabindex: 0, text: 'Button 1' });
        const button2 = Button({ tabindex: 1, text: 'Button 2' });

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex
        }, [button1, button2], { enableLayout: false });

        await new Promise(resolve => setTimeout(resolve, 50));
        const containerId = containerElement.componentInstance.getContainerId();

        // Navigate internally
        focusManager.navigate(containerId, 'next');

        // Wait for effect
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(tabindex()).toBe(1);
    });
});
