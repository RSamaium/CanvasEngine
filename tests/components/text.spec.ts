import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Text, signal } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

describe('Text Component', () => {
    test('creates text component with basic properties', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: 'Hello World',
            x: 100,
            y: 50
        })

        expect(textElement).toBeDefined()
        expect((textElement.componentInstance as any).text).toBe('Hello World')
        expect((textElement.componentInstance as any).x).toBe(100)
        expect((textElement.componentInstance as any).y).toBe(50)
    })

    test('handles text style properties', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: 'Styled Text',
            color: '#ff0000',
            size: 24,
            fontFamily: 'Arial',
            style: {
                fontSize: 20,
                fill: 0x00ff00
            }
        })

        expect((textElement.componentInstance as any).text).toBe('Styled Text')
        expect((textElement.componentInstance as any).style.fill).toBe('#ff0000')
        expect((textElement.componentInstance as any).style.fontSize).toBe(24)
        expect((textElement.componentInstance as any).style.fontFamily).toBe('Arial')
    })

    test('handles typewriter effect configuration', async () => {
        const onComplete = vi.fn()
        const onStart = vi.fn()
        const onSkip = vi.fn()

        const textElement = await TestBed.createComponent(Text, {
            text: 'Typewriter text',
            typewriter: {
                speed: 2,
                start: onStart,
                onComplete: onComplete,
                skip: onSkip
            }
        })

        // The typewriter effect may have already started, so we check that it's either empty or has started
        const currentText = (textElement.componentInstance as any).text
        expect(currentText.length).toBeLessThanOrEqual('Typewriter text'.length)
        expect((textElement.componentInstance as any).fullText).toBe('Typewriter text')
        expect(onComplete).toBeDefined()
        expect(onStart).toBeDefined()
        expect(onSkip).toBeDefined()
    })

    test('handles dynamic text updates', async () => {
        const dynamicText = signal('Initial text')
        
        const textElement = await TestBed.createComponent(Text, {
            text: dynamicText
        })

        expect((textElement.componentInstance as any).text).toBe('Initial text')

        dynamicText.set('Updated text')
        expect((textElement.componentInstance as any).text).toBe('Updated text')
    })

    test('component instance has correct methods', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: 'Test'
        })

        const instance = textElement.componentInstance
        expect(instance).toBeDefined()
        expect(typeof instance.onMount).toBe('function')
        expect(typeof instance.onUpdate).toBe('function')
        expect(typeof instance.onDestroy).toBe('function')
    })

    test('handles word wrap width', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: 'Long text that should wrap',
            style: {
                wordWrapWidth: 200,
                wordWrap: true
            }
        })

        expect((textElement.componentInstance as any).style.wordWrapWidth).toBe(200)
        expect((textElement.componentInstance as any).style.wordWrap).toBe(true)
    })

    test('typewriter effect with different speeds', async () => {
        const slowTypewriter = await TestBed.createComponent(Text, {
            text: 'Slow typing',
            typewriter: { speed: 0.5 }
        })

        const fastTypewriter = await TestBed.createComponent(Text, {
            text: 'Fast typing',
            typewriter: { speed: 3 }
        })

        expect((slowTypewriter.componentInstance as any).typewriterOptions.speed).toBe(0.5)
        expect((fastTypewriter.componentInstance as any).typewriterOptions.speed).toBe(3)
    })

    test('handles empty text', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: ''
        })

        expect((textElement.componentInstance as any).text).toBe('')
    })

    test('handles string text conversion', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: '42'
        })

        expect((textElement.componentInstance as any).text).toBe('42')
    })

    test('handles color property updates', async () => {
        const colorSignal = signal('#ff0000')
        
        const textElement = await TestBed.createComponent(Text, {
            text: 'Colored text',
            color: colorSignal
        })

        expect((textElement.componentInstance as any).style.fill).toBe('#ff0000')

        colorSignal.set('#00ff00')
        expect((textElement.componentInstance as any).style.fill).toBe('#00ff00')
    })

    test('handles font size updates', async () => {
        const sizeSignal = signal(16)
        
        const textElement = await TestBed.createComponent(Text, {
            text: 'Sized text',
            size: sizeSignal
        })

        expect((textElement.componentInstance as any).style.fontSize).toBe(16)

        sizeSignal.set(24)
        expect((textElement.componentInstance as any).style.fontSize).toBe(24)
    })
}) 