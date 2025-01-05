import { cond, Container, h, signal } from "canvasengine";
import { expect, test } from "vitest";
import { TestBed } from "../../packages/core/testing";

test(`Test cond`, async () => {
    const value = cond(
        signal(true),
        () => h(Container)
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
});

test(`Test cond == false`, async () => {
    const value = cond(
        signal(false),
        () => h(Container)
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(0)
});

test(`Use not signal`, async () => {
    const value = cond(
        true,
        () => h(Container)
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
});
