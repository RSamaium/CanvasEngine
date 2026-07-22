import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Container, Text, h, signal } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

describe('Text Component', () => {
    beforeEach(() => {
        vi.stubGlobal('OffscreenCanvas', class {
            width: number
            height: number

            constructor(width: number, height: number) {
                this.width = width
                this.height = height
            }

            getContext(type: string) {
                if (type !== '2d') return null
                return {
                    font: '',
                    measureText: (text: string) => ({ width: text.length * 10 })
                }
            }
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

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

    test('keeps layout text at its authored scale by default', async () => {
        const parent = await TestBed.createComponent(Container, {
            display: 'flex',
            width: 100,
            height: 20,
        }, [
            h(Text, {
                width: '100%',
                height: 10,
                text: 'This label is intentionally wider than its box',
                size: 20,
            }),
        ])
        const text = parent.props.children?.[0]?.componentInstance as any

        parent.props.context.app().render()

        expect(text.layout.style.objectFit).toBe('none')
        expect(text.layout.computedPixiLayout.scaleX).toBe(1)
        expect(text.layout.computedPixiLayout.scaleY).toBe(1)
    })

    test('allows text scale-down when explicitly requested', async () => {
        const parent = await TestBed.createComponent(Container, {
            display: 'flex',
            width: 100,
            height: 20,
        }, [
            h(Text, {
                width: '100%',
                height: 10,
                text: 'This label is intentionally wider than its box',
                size: 20,
                objectFit: 'scale-down',
            }),
        ])
        const text = parent.props.children?.[0]?.componentInstance as any

        parent.props.context.app().render()

        expect(text.layout.style.objectFit).toBe('scale-down')
        expect(text.layout.computedPixiLayout.scaleX).toBeLessThan(1)
        expect(text.layout.computedPixiLayout.scaleY).toBeLessThan(1)
    })

    test('uses Pretext measurement for wrapped text layout dimensions', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: 'one two three four five six seven eight nine ten',
            style: {
                wordWrapWidth: 70,
                wordWrap: true,
                fontSize: 20,
                fontFamily: 'Arial',
                lineHeight: 30
            }
        })

        const instance = textElement.componentInstance as any

        expect(instance.style.wordWrap).toBe(true)
        expect(instance._wordWrapWidth).toBe(70)
        expect(instance.displayWidth()).toBe(70)
        expect(instance.displayHeight()).toBeGreaterThan(30)
        expect(instance.getWidth()).toBe(70)
        expect(instance.getHeight()).toBe(instance.displayHeight())
    })

    test('does not use Pretext for unwrapped text', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: 'Single line text',
            style: {
                fontSize: 20,
                fontFamily: 'Arial'
            }
        })

        const instance = textElement.componentInstance as any

        expect(instance._wordWrapWidth).toBe(0)
        expect(instance.displayWidth()).toBe(instance.getWidth())
    })

    test('recomputes wrapped layout dimensions when wrap width changes', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: 'one two three four five six seven eight nine ten',
            style: {
                wordWrapWidth: 70,
                wordWrap: true,
                fontSize: 20,
                lineHeight: 30
            }
        })

        const instance = textElement.componentInstance as any
        const initialHeight = instance.displayHeight()

        instance.onUpdate({
            style: {
                wordWrapWidth: 140,
                wordWrap: true,
                fontSize: 20,
                lineHeight: 30
            }
        })

        expect(instance.displayWidth()).toBe(140)
        expect(instance.displayHeight()).toBeLessThan(initialHeight)
    })

    test('recomputes wrapped layout dimensions when text changes', async () => {
        const dynamicText = signal('short')

        const textElement = await TestBed.createComponent(Text, {
            text: dynamicText,
            style: {
                wordWrapWidth: 70,
                wordWrap: true,
                fontSize: 20,
                lineHeight: 30
            }
        })

        const instance = textElement.componentInstance as any
        const initialHeight = instance.displayHeight()
        dynamicText.set('one two three four five six seven eight nine ten')

        expect(instance.displayHeight()).toBeGreaterThan(initialHeight)
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

    test('handles typewriter sound configuration', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: 'Text with sound',
            typewriter: {
                speed: 1,
                sound: {
                    src: '/assets/typewriter.mp3',
                    volume: 0.5,
                    rate: 1.0
                }
            }
        })

        const instance = textElement.componentInstance as any
        expect(instance.typewriterOptions.sound).toBeDefined()
        expect(instance.typewriterOptions.sound.src).toBe('/assets/typewriter.mp3')
        expect(instance.typewriterOptions.sound.volume).toBe(0.5)
        expect(instance.typewriterOptions.sound.rate).toBe(1.0)
        expect(instance.typewriterSound).toBeDefined()
        expect(instance.soundDuration).toBe(0) // Initially 0 until sound loads
    })

    test('handles typewriter without sound configuration', async () => {
        const textElement = await TestBed.createComponent(Text, {
            text: 'Text without sound',
            typewriter: {
                speed: 1
            }
        })

        const instance = textElement.componentInstance as any
        expect(instance.typewriterOptions.sound).toBeUndefined()
        expect(instance.typewriterSound).toBeUndefined()
    })
}) 
