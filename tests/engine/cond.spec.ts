import { cond, Container, h, signal, Text } from "canvasengine";
import { expect, test, vi } from "vitest";
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

test(`Test cond with else - condition true`, async () => {
    const value = cond(
        signal(true),
        () => h(Text, { text: 'If case' }),
        () => h(Text, { text: 'Else case' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('If case')
});

test(`Test cond with else - condition false`, async () => {
    const value = cond(
        signal(false),
        () => h(Text, { text: 'If case' }),
        () => h(Text, { text: 'Else case' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Else case')
});

test(`Test cond with else - static boolean true`, async () => {
    const value = cond(
        true,
        () => h(Text, { text: 'If case' }),
        () => h(Text, { text: 'Else case' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('If case')
});

test(`Test cond with else - static boolean false`, async () => {
    const value = cond(
        false,
        () => h(Text, { text: 'If case' }),
        () => h(Text, { text: 'Else case' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Else case')
});

test(`Test cond with else if - first condition true`, async () => {
    const value = cond(
        signal(true),
        () => h(Text, { text: 'If case' }),
        [signal(false), () => h(Text, { text: 'Else if case' })],
        () => h(Text, { text: 'Else case' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('If case')
});

test(`Test cond with else if - second condition true`, async () => {
    const value = cond(
        signal(false),
        () => h(Text, { text: 'If case' }),
        [signal(true), () => h(Text, { text: 'Else if case' })],
        () => h(Text, { text: 'Else case' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Else if case')
});

test(`Test cond with else if - no condition true, use else`, async () => {
    const value = cond(
        signal(false),
        () => h(Text, { text: 'If case' }),
        [signal(false), () => h(Text, { text: 'Else if case' })],
        () => h(Text, { text: 'Else case' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Else case')
});

test(`Test cond with multiple else if conditions`, async () => {
    const score = signal(85)
    const value = cond(
        () => score() >= 90,
        () => h(Text, { text: 'A+' }),
        [() => score() >= 80, () => h(Text, { text: 'A' })],
        [() => score() >= 70, () => h(Text, { text: 'B' })],
        [() => score() >= 60, () => h(Text, { text: 'C' })],
        () => h(Text, { text: 'F' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('A')
});

test(`Test cond with multiple else if - no match, use else`, async () => {
    const score = signal(45)
    const value = cond(
        () => score() >= 90,
        () => h(Text, { text: 'A+' }),
        [() => score() >= 80, () => h(Text, { text: 'A' })],
        [() => score() >= 70, () => h(Text, { text: 'B' })],
        [() => score() >= 60, () => h(Text, { text: 'C' })],
        () => h(Text, { text: 'F' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('F')
});

test(`Test cond reactivity - condition changes`, async () => {
    const isVisible = signal(true)
    const value = cond(
        isVisible,
        () => h(Text, { text: 'Visible' }),
        () => h(Text, { text: 'Hidden' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    
    // Initially visible
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Visible')
    
    // Change to hidden
    isVisible.set(false)
    await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Hidden')
    
    // Change back to visible
    isVisible.set(true)
    await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Visible')
});

test(`Test cond reactivity with else if - conditions change`, async () => {
    const status = signal('loading')
    const value = cond(
        () => status() === 'loading',
        () => h(Text, { text: 'Loading...' }),
        [() => status() === 'error', () => h(Text, { text: 'Error!' })],
        [() => status() === 'success', () => h(Text, { text: 'Success!' })],
        () => h(Text, { text: 'Unknown' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    
    // Initially loading
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Loading...')
    
    // Change to error
    status.set('error')
    await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Error!')
    
    // Change to success
    status.set('success')
    await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Success!')
    
    // Change to unknown status
    status.set('unknown')
    await new Promise(resolve => setTimeout(resolve, 10)) // Wait for reactivity
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Unknown')
});

test(`Test cond with static boolean conditions`, async () => {
    const value = cond(
        false,
        () => h(Text, { text: 'If case' }),
        [false, () => h(Text, { text: 'Else if 1' })],
        [true, () => h(Text, { text: 'Else if 2' })],
        [false, () => h(Text, { text: 'Else if 3' })],
        () => h(Text, { text: 'Else case' })
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(1)
    expect((container.componentInstance.children[0] as any).text).toBe('Else if 2')
});

test(`Test cond without else - no condition matches`, async () => {
    const value = cond(
        signal(false),
        () => h(Text, { text: 'If case' }),
        [signal(false), () => h(Text, { text: 'Else if case' })]
    )
    const container = await TestBed.createComponent(Container, {}, value)
    expect(container.componentInstance.children.length).toBe(0)
});

test(`Test cond preserves declared order when mounted after a following sibling`, async () => {
    const showScene = signal(false)
    const value = [
        cond(
            showScene,
            () => h(Container, { x: 1 })
        ),
        h(Container, { x: 2 })
    ]

    const container = await TestBed.createComponent(Container, {}, value)

    expect(container.componentInstance.children.map((child: any) => child.x)).toEqual([2])

    showScene.set(true)

    await vi.waitFor(() => {
        expect(container.componentInstance.children.map((child: any) => child.x)).toEqual([1, 2])
    })
});
