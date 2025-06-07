import { beforeEach, describe, expect, test, vi } from 'vitest'
import { signal } from 'canvasengine'
import { NineSliceSprite } from '../../packages/core/src/components/NineSliceSprite'
import { TestBed } from '../../packages/core/testing'

describe('NineSliceSprite Component', () => {
    test('creates nine slice sprite component with basic properties', async () => {
        const nineSliceElement = await TestBed.createComponent(NineSliceSprite, {
            width: 200,
            height: 50,
            x: 100,
            y: 50
        })

        expect(nineSliceElement).toBeDefined()
        expect(typeof nineSliceElement).toBe('object')
        expect((nineSliceElement.componentInstance as any).x).toBe(100)
        expect((nineSliceElement.componentInstance as any).y).toBe(50)
    })

    test('creates nine slice sprite with slice dimensions', async () => {
        const nineSliceElement = await TestBed.createComponent(NineSliceSprite, {
            width: 300,
            height: 200,
            leftWidth: 10,
            rightWidth: 10,
            topHeight: 10,
            bottomHeight: 10
        })

        expect(nineSliceElement).toBeDefined()
        expect((nineSliceElement.componentInstance as any).leftWidth).toBe(10)
        expect((nineSliceElement.componentInstance as any).rightWidth).toBe(10)
        expect((nineSliceElement.componentInstance as any).topHeight).toBe(10)
        expect((nineSliceElement.componentInstance as any).bottomHeight).toBe(10)
    })

    test('handles roundPixels property', async () => {
        const nineSliceElement = await TestBed.createComponent(NineSliceSprite, {
            width: 150,
            height: 75,
            roundPixels: true
        })

        expect(nineSliceElement).toBeDefined()
        expect((nineSliceElement.componentInstance as any).roundPixels).toBe(true)
    })

    test('handles dynamic dimensions with signals', async () => {
        const dynamicWidth = signal(100)
        const dynamicHeight = signal(50)

        const nineSliceElement = await TestBed.createComponent(NineSliceSprite, {
            width: dynamicWidth,
            height: dynamicHeight
        })

        expect(nineSliceElement).toBeDefined()
        expect((nineSliceElement.componentInstance as any).width).toBe(100)
        expect((nineSliceElement.componentInstance as any).height).toBe(50)

        dynamicWidth.set(200)
        dynamicHeight.set(100)

        expect((nineSliceElement.componentInstance as any).width).toBe(200)
        expect((nineSliceElement.componentInstance as any).height).toBe(100)
    })

    test('creates nine slice sprite with all slice properties', async () => {
        const nineSliceElement = await TestBed.createComponent(NineSliceSprite, {
            width: 400,
            height: 300,
            leftWidth: 10,
            rightWidth: 10,
            topHeight: 10,
            bottomHeight: 10,
            roundPixels: false,
            x: 50,
            y: 75
        })

        expect(nineSliceElement).toBeDefined()
        expect((nineSliceElement.componentInstance as any).leftWidth).toBe(10)
        expect((nineSliceElement.componentInstance as any).rightWidth).toBe(10)
        expect((nineSliceElement.componentInstance as any).topHeight).toBe(10)
        expect((nineSliceElement.componentInstance as any).bottomHeight).toBe(10)
        expect((nineSliceElement.componentInstance as any).roundPixels).toBe(false)
    })

    test('handles empty nine slice sprite creation', async () => {
        const nineSliceElement = await TestBed.createComponent(NineSliceSprite, {})
        expect(nineSliceElement).toBeDefined()
    })

    test('handles nine slice sprite without image', async () => {
        const nineSliceElement = await TestBed.createComponent(NineSliceSprite, {
            width: 100,
            height: 50,
            leftWidth: 10,
            rightWidth: 10
        })

        expect(nineSliceElement).toBeDefined()
        // When no texture is provided, PixiJS may return NaN for dimensions
        // Just check that the component was created successfully
        expect((nineSliceElement.componentInstance as any).leftWidth).toBe(10)
        expect((nineSliceElement.componentInstance as any).rightWidth).toBe(10)
    })

    test('handles dynamic slice dimensions', async () => {
        const dynamicLeftWidth = signal(10)
        const dynamicRightWidth = signal(10)

        const nineSliceElement = await TestBed.createComponent(NineSliceSprite, {
            width: 200,
            height: 100,
            leftWidth: dynamicLeftWidth,
            rightWidth: dynamicRightWidth
        })

        expect(nineSliceElement).toBeDefined()
        expect((nineSliceElement.componentInstance as any).leftWidth).toBe(10)
        expect((nineSliceElement.componentInstance as any).rightWidth).toBe(10)

        dynamicLeftWidth.set(20)
        dynamicRightWidth.set(25)

        expect((nineSliceElement.componentInstance as any).leftWidth).toBe(20)
        expect((nineSliceElement.componentInstance as any).rightWidth).toBe(25)
    })
}) 