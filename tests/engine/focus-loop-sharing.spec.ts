import { loop, FocusContainer, Button, signal } from "canvasengine";
import { TestBed } from "../../packages/core/testing";
import { describe, expect, test, vi } from "vitest";
import { focusManager } from "../../packages/core/src/engine/FocusManager";

describe("focus navigation with loop", () => {
    test("should call onFocusChange when items are in a loop", async () => {
        const items = signal([{ id: 0 }, { id: 1 }]);
        const onFocusChange = vi.fn();

        const containerElement = await TestBed.createComponent(FocusContainer, {
            tabindex: 0,
            onFocusChange
        }, [
            loop(items, (item) => Button({ tabindex: item.id, text: `Button ${item.id}` }))
        ]);

        // Wait for children to be registered
        await new Promise(resolve => setTimeout(resolve, 50));

        const instance = containerElement.componentInstance as any;
        const containerId = instance.getContainerId();

        // Check if elements are registered
        const element0 = focusManager.getElement(containerId, 0);
        expect(element0).toBeDefined();

        // Change focus
        focusManager.setIndex(containerId, 0);

        expect(onFocusChange).toHaveBeenCalled();
        expect(onFocusChange).toHaveBeenCalledWith(0, expect.anything());
    });
});
