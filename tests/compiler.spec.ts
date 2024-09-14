import pkg from 'peggy';
import fs from 'fs';
import { beforeAll, describe, test, expect } from 'vitest';

const { generate } = pkg;
let parser: any;

beforeAll(() => {
    const grammar = fs.readFileSync("src/compiler/grammar.pegjs", "utf8");
    parser = generate(grammar); 
});

describe('Compiler', () => {
    test('should compile simple component', () => {
        const input = `<Canvas />`;
        const output = parser.parse(input);
        expect(output).toBe(`h('Canvas')`);
    });

    test('should compile component with dynamic attribute', () => {
        const input = `<Canvas [width]="x" />`;
        const output = parser.parse(input);
        expect(output).toBe(`h('Canvas', { width: computed(() => x) })`);
    });

    test('should compile component with computed dynamic attribute', () => {
        const input = `<Canvas [width]="x * 2" />`;
        const output = parser.parse(input);
        expect(output).toBe(`h('Canvas', { width: computed(() => x * 2) })`);
    });

    test('should compile component with multiple computed dynamic attributes', () => {
        const input = `<Canvas [width]="x * 2 * y" />`;
        const output = parser.parse(input);
        expect(output).toBe(`h('Canvas', { width: computed(() => x * 2 * y) })`);
    });

    test('should compile component with static numeric attribute', () => {
        const input = `<Canvas width="10" />`;
        const output = parser.parse(input);
        expect(output).toBe(`h('Canvas', { width: 10 })`);
    });

    test('should compile component with static string attribute', () => {
        const input = `<Canvas width="val" />`;
        const output = parser.parse(input);
        expect(output).toBe(`h('Canvas', { width: 'val' })`);
    });

    test('should compile component with children', () => {
        const input = `
            <Canvas>
                <Sprite />
                <Text />
            </Canvas>
        `;
        const output = parser.parse(input);
        expect(output.replace(/\s+/g, '')).toBe(`h('Canvas',null,[h('Sprite'),h('Text')])`.replace(/\s+/g, ''));
    });

    test('should compile component with event handler', () => {
        const input = `<Sprite (click)="onClick()" />`;
        const output = parser.parse(input);
        expect(output).toBe(`h('Sprite', { click: () => { onClick() } })`);
    });

    // test('should compile component with inline event handler', () => {
    //     const input = `<Sprite (click)="() => console.log('click')" />`;
    //     const output = parser.parse(input);
    //     expect(output).toBe(`h('Sprite', { click: () => console.log('click') })`);
    // });

    // test('should compile interpolation', () => { 
    //     const input = `{{ val }}`;
    //     const output = parser.parse(input);
    //     expect(output).toBe(`h('Text', { text: val })`);
    // });

    test('should compile loop', () => {
        const input = `
            <Canvas>
                @for (sprite of sprites) {
                    <Sprite />
                }
            </Canvas>
        `;
        const output = parser.parse(input);
        expect(output.replace(/\s+/g, '')).toBe(`h('Canvas',null,[loop(sprites,(sprite)=>h('Sprite'))])`.replace(/\s+/g, ''));
    });

    test('should compile condition', () => {
        const input = `
            @if (sprite.visible) {
                <Sprite />
            }
        `;
        const output = parser.parse(input);
        expect(output).toBe(`cond(sprite.visible, () => h('Sprite'))`);
    });
});  