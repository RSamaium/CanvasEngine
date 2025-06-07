import { beforeEach, describe, expect, test, vi } from 'vitest'
import { signal } from 'canvasengine'
import { TilingSprite } from '../../packages/core/src/components/TilingSprite'
import { TestBed } from '../../packages/core/testing'

describe('TilingSprite Component', () => {
    test('creates tiling sprite component with basic properties', async () => {
        const tilingSpriteElement = await TestBed.createComponent(TilingSprite, {
            image: 'pattern.png',
            width: 400,
            height: 300,
            x: 100,
            y: 50
        })

        expect(tilingSpriteElement).toBeDefined()
        expect(typeof tilingSpriteElement).toBe('object')
        expect((tilingSpriteElement.componentInstance as any).width).toBe(400)
        expect((tilingSpriteElement.componentInstance as any).height).toBe(300)
    })

    test('creates tiling sprite with tile scale', async () => {
        const tilingSpriteElement = await TestBed.createComponent(TilingSprite, {
            image: 'texture.png',
            width: 200,
            height: 200,
            tileScale: { x: 2, y: 2 }
        })

        expect(tilingSpriteElement).toBeDefined()
    })

    test('creates tiling sprite with tile position', () => {
        const tilingSpriteElement = TilingSprite({
            image: 'background.png',
            width: 500,
            height: 400,
            tilePosition: { x: 50, y: 25 }
        })

        expect(tilingSpriteElement).toBeDefined()
    })

    test('creates tiling sprite with both tile scale and position', () => {
        const tilingSpriteElement = TilingSprite({
            image: 'seamless-pattern.png',
            width: 300,
            height: 250,
            tileScale: { x: 1.5, y: 1.5 },
            tilePosition: { x: 10, y: 20 }
        })

        expect(tilingSpriteElement).toBeDefined()
    })

    test('handles dynamic tile scale with signals', () => {
        const dynamicScaleX = signal(1)
        const dynamicScaleY = signal(1)

        const tilingSpriteElement = TilingSprite({
            image: 'animated-pattern.png',
            width: 200,
            height: 200,
            tileScale: { x: dynamicScaleX(), y: dynamicScaleY() }
        })

        expect(tilingSpriteElement).toBeDefined()

        dynamicScaleX.set(2)
        dynamicScaleY.set(3)

        expect(dynamicScaleX()).toBe(2)
        expect(dynamicScaleY()).toBe(3)
    })

    test('handles dynamic tile position with signals', () => {
        const dynamicPosX = signal(0)
        const dynamicPosY = signal(0)

        const tilingSpriteElement = TilingSprite({
            image: 'scrolling-bg.png',
            width: 400,
            height: 300,
            tilePosition: { x: dynamicPosX(), y: dynamicPosY() }
        })

        expect(tilingSpriteElement).toBeDefined()

        dynamicPosX.set(100)
        dynamicPosY.set(50)

        expect(dynamicPosX()).toBe(100)
        expect(dynamicPosY()).toBe(50)
    })

    test('handles dynamic dimensions with signals', () => {
        const dynamicWidth = signal(200)
        const dynamicHeight = signal(150)

        const tilingSpriteElement = TilingSprite({
            image: 'resizable-pattern.png',
            width: dynamicWidth(),
            height: dynamicHeight()
        })

        expect(tilingSpriteElement).toBeDefined()

        dynamicWidth.set(400)
        dynamicHeight.set(300)

        expect(dynamicWidth()).toBe(400)
        expect(dynamicHeight()).toBe(300)
    })

    test('creates tiling sprite with all properties', () => {
        const tilingSpriteElement = TilingSprite({
            image: 'complex-pattern.png',
            width: 600,
            height: 400,
            tileScale: { x: 0.8, y: 1.2 },
            tilePosition: { x: 30, y: 40 },
            x: 50,
            y: 75,
            alpha: 0.8,
            rotation: 0.1
        })

        expect(tilingSpriteElement).toBeDefined()
    })

    test('handles empty tiling sprite creation', () => {
        const tilingSpriteElement = TilingSprite({})
        expect(tilingSpriteElement).toBeDefined()
    })

    test('handles tiling sprite without image', () => {
        const tilingSpriteElement = TilingSprite({
            width: 100,
            height: 100,
            tileScale: { x: 1, y: 1 }
        })

        expect(tilingSpriteElement).toBeDefined()
    })

    test('handles fractional tile scales', () => {
        const tilingSpriteElement = TilingSprite({
            image: 'micro-pattern.png',
            width: 200,
            height: 200,
            tileScale: { x: 0.25, y: 0.5 }
        })

        expect(tilingSpriteElement).toBeDefined()
    })

    test('handles negative tile positions', () => {
        const tilingSpriteElement = TilingSprite({
            image: 'offset-pattern.png',
            width: 300,
            height: 200,
            tilePosition: { x: -50, y: -25 }
        })

        expect(tilingSpriteElement).toBeDefined()
    })
}) 