import { beforeEach, describe, expect, test } from 'vitest'
import { DOMContainer, DOMSprite, signal } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

const normalizePosition = (value: string) => value.replace(/-0px/g, '0px')

describe('DOMSprite Component', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>'
    })

    test('renders DOMSprite as img element with frame positioning', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                element: 'img',
                image: 'sprite.png',
                rectangle: {
                    x: 2,
                    y: 3,
                    width: 20,
                    height: 30
                }
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLImageElement

        expect(spriteElement.tagName.toLowerCase()).toBe('img')
        expect(spriteElement.style.width).toBe('20px')
        expect(spriteElement.style.height).toBe('30px')
        expect(spriteElement.style.objectFit).toBe('none')
        expect(spriteElement.style.objectPosition).toBe('-2px -3px')
    })

    
    test('contains frame within explicit size using objectFit', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                objectFit: 'contain',
                width: 100,
                height: 50,
                rectangle: {
                    x: 0,
                    y: 0,
                    width: 20,
                    height: 20
                }
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteWrapper = wrapperDiv.children[0] as HTMLElement
        const spriteInner = spriteWrapper.children[0] as HTMLElement

        expect(spriteWrapper.style.width).toBe('100px')
        expect(spriteWrapper.style.height).toBe('50px')
        expect(spriteInner.style.transform).toContain('scale(2.5)')
    })

    test('applies transform and anchor props to DOMSprite', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                x: 10.4,
                y: 20.6,
                roundPixels: true,
                scale: [2, 3],
                angle: 90,
                skew: { x: Math.PI / 4, y: 0 },
                anchor: { x: 0.5, y: 0.5 }
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLElement

        expect(spriteElement.style.transform).toContain('translate3d(10px, 21px, 0)')
        expect(spriteElement.style.transform).toContain('rotate(90deg)')
        expect(spriteElement.style.transform).toContain('skew(45deg, 0deg)')
        expect(spriteElement.style.transform).toContain('scale(2, 3)')
        expect(spriteElement.style.transformOrigin).toBe('50% 50%')
    })

    test('angle overrides rotation when both are provided', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                angle: 45,
                rotation: Math.PI
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLElement

        expect(spriteElement.style.transform).toContain('rotate(45deg)')
    })

    test('pivot overrides anchor for transform origin', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                pivot: { x: 10, y: 20 },
                anchor: { x: 0.5, y: 0.5 }
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLElement

        expect(spriteElement.style.transformOrigin).toBe('10px 20px')
    })

    test('clamps frameIndex when loop is false', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                loop: false,
                frameIndex: -1,
                frames: [
                    { x: 0, y: 0, width: 10, height: 10 },
                    { x: 10, y: 0, width: 10, height: 10 }
                ]
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLElement

        expect(normalizePosition(spriteElement.style.backgroundPosition)).toBe('0px 0px')
    })

    test('wraps frameIndex when loop is true', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                loop: true,
                frameIndex: -1,
                frames: [
                    { x: 0, y: 0, width: 10, height: 10 },
                    { x: 10, y: 0, width: 10, height: 10 }
                ]
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLElement

        expect(normalizePosition(spriteElement.style.backgroundPosition)).toBe('-10px 0px')
    })

    test('respects explicit width and height over frame size', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                width: 100,
                height: 200,
                rectangle: {
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 20
                }
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLElement

        expect(spriteElement.style.width).toBe('100px')
        expect(spriteElement.style.height).toBe('200px')
    })

    test('advances frames when advance is called', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                fps: 1,
                playing: true,
                loop: true,
                frames: [
                    { x: 0, y: 0, width: 10, height: 10 },
                    { x: 10, y: 0, width: 10, height: 10 }
                ]
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLElement
        const spriteNode = containerElement.props.children?.[0]
        const spriteInstance = spriteNode?.componentInstance as any

        expect(normalizePosition(spriteElement.style.backgroundPosition)).toBe('0px 0px')

        spriteInstance.advance(1000)
        expect(normalizePosition(spriteElement.style.backgroundPosition)).toBe('-10px 0px')
    })

    test('applies visibility, alpha, cursor, zIndex, and tint props', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                visible: false,
                alpha: 0.5,
                cursor: 'pointer',
                zIndex: 5,
                tint: 0xff0000
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLElement

        expect(spriteElement.style.display).toBe('none')
        expect(spriteElement.style.opacity).toBe('0.5')
        expect(spriteElement.style.cursor).toBe('pointer')
        expect(spriteElement.style.zIndex).toBe('5')
        expect(spriteElement.style.filter).toContain('ff0000')
    })

    test('updates visibility and tint when signals change', async () => {
        const visible = signal(true)
        const tint = signal(0x00ff00)

        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            DOMSprite({
                visible,
                tint
            })
        ], { enableLayout: false })

        const wrapperDiv = (containerElement.componentInstance as any).element as HTMLElement
        const spriteElement = wrapperDiv.children[0] as HTMLElement

        expect(spriteElement.style.display).toBe('')
        expect(spriteElement.style.filter).toContain('00ff00')

        visible.set(false)
        tint.set(0xff00ff)
        await Promise.resolve()

        expect(spriteElement.style.display).toBe('none')
        expect(spriteElement.style.filter).toContain('ff00ff')
    })
})
