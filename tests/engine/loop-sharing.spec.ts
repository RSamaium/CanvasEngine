import { loop, Container, h, signal } from "canvasengine";
import { TestBed } from "../../packages/core/testing";
import { describe, expect, test, vi } from "vitest";

describe("loop sharing", () => {
    test("should call createElementFn only once per item with multiple subscribers", async () => {
        const items = signal([1]);
        let callCount = 0;
        const flow = loop(items, (item) => {
            callCount++;
            return h(Container, { x: item });
        });

        // First subscription
        const sub1 = flow.subscribe();
        // Second subscription
        const sub2 = flow.subscribe();

        // If not shared, callCount will be 2 (one for each subscription)
        // If shared, callCount will be 1
        expect(callCount).toBe(1);

        sub1.unsubscribe();
        sub2.unsubscribe();
    });
});
