import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Sprite, signal, Canvas, mount } from 'canvasengine'
import { Texture } from 'pixi.js'
import { TestBed } from '../../packages/core/testing'
import { CanvasSprite } from '../../packages/core/src/components/Sprite'
import { GlobalAssetLoader } from '../../packages/core/src/utils/GlobalAssetLoader'

describe('Sprite Component', () => {
    test('creates sprite component with basic properties', async () => {
        const spriteElement = await TestBed.createComponent(Sprite, {
            x: 100,
            y: 50,
            width: 64,
            height: 64
        })

        expect(spriteElement).toBeDefined()
        expect(typeof spriteElement).toBe('object')
        expect((spriteElement.componentInstance as any).x).toBe(100)
        expect((spriteElement.componentInstance as any).y).toBe(50)
    })

    test('creates sprite component with rectangle', async () => {
        const spriteElement = await TestBed.createComponent(Sprite, {
            rectangle: {
                x: 0,
                y: 0,
                width: 32,
                height: 32
            }
        })

        expect(spriteElement).toBeDefined()
    })

    test('creates sprite component with basic sheet', async () => {
        const spriteElement = await TestBed.createComponent(Sprite, {
            sheet: {
                definition: {
                    width: 256,
                    height: 256,
                    spriteWidth: 64,
                    spriteHeight: 64,
                    textures: {}
                }
            }
        })

        expect(spriteElement).toBeDefined()
    })

    test('handles scale mode property', async () => {
        const spriteElement = await TestBed.createComponent(Sprite, {
            scaleMode: 0,
            width: 32,
            height: 32
        })

        expect(spriteElement).toBeDefined()
    })

    test('handles dynamic properties with signals', async () => {
        const dynamicX = signal(0)
        const dynamicY = signal(0)

        const spriteElement = await TestBed.createComponent(Sprite, {
            x: dynamicX,
            y: dynamicY,
            width: 64,
            height: 64
        })

        expect(spriteElement).toBeDefined()
        expect((spriteElement.componentInstance as any).x).toBe(0)
        expect((spriteElement.componentInstance as any).y).toBe(0)

        dynamicX.set(100)
        dynamicY.set(200)

        expect((spriteElement.componentInstance as any).x).toBe(100)
        expect((spriteElement.componentInstance as any).y).toBe(200)
    })

    test('handles sprite without context', () => {
        expect(() => {
            TestBed.createComponent(Sprite, {
                width: 32,
                height: 32
            })
        }).not.toThrow()
    })

    test('handles loader callbacks', async () => {
        const onProgress = vi.fn()
        const onComplete = vi.fn()

        const spriteElement = await TestBed.createComponent(Sprite, {
            width: 64,
            height: 64,
            loader: {
                onProgress: onProgress,
                onComplete: onComplete
            }
        })

        expect(spriteElement).toBeDefined()
        expect(onProgress).toBeDefined()
        expect(onComplete).toBeDefined()
    })

    test('handles basic spritesheet parameters', async () => {
        const onFinish = vi.fn()

        const spriteElement = await TestBed.createComponent(Sprite, {
            sheet: {
                definition: {
                    width: 128,
                    height: 128,
                    spriteWidth: 32,
                    spriteHeight: 32,
                    textures: {}
                },
                onFinish: onFinish
            }
        })

        expect(spriteElement).toBeDefined()
        expect(onFinish).toBeDefined()
    })

    test('component instance has correct methods', async () => {
        const spriteElement = await TestBed.createComponent(Sprite, {
            width: 32,
            height: 32
        })

        const instance = spriteElement.componentInstance as any
        expect(instance).toBeDefined()
        expect(typeof instance.onMount).toBe('function')
        expect(typeof instance.onUpdate).toBe('function')
        expect(typeof instance.onDestroy).toBe('function')
        expect(typeof instance.play).toBe('function')
        expect(typeof instance.stop).toBe('function')
        expect(typeof instance.has).toBe('function')
        expect(typeof instance.get).toBe('function')
        expect(typeof instance.isPlaying).toBe('function')
    })

    test('aligns the sprite with the hitbox bounds inside the frame', () => {
        const sprite = new CanvasSprite()
        sprite.hitbox = { w: 32, h: 48 }

        ;(sprite as any).spritesheet = {}
        ;(sprite as any).currentAnimationContainer = { children: [{}] }
        ;(sprite as any).currentAnimation = {
            frames: [[Texture.EMPTY]],
            sprites: [{ time: 0, frameX: 0, frameY: 0 }],
            name: 'stand',
            animations: [],
            params: [],
            data: {
                spriteWidth: 64,
                spriteHeight: 128,
                image: 'hero.png',
                spriteRealSize: { width: 32, height: 96 }
            }
        }

        sprite.update({ deltaRatio: 1 })

        expect(sprite.anchor.x).toBeCloseTo(0.25)
        expect(sprite.anchor.y).toBeCloseTo(0.5)
    })

    test('keeps sprite and hitbox bottoms aligned when spriteRealSize is not provided', () => {
        const sprite = new CanvasSprite()
        sprite.hitbox = { w: 32, h: 48 }

        ;(sprite as any).applyHitboxAnchor(64, 128)

        expect(sprite.anchor.x).toBeCloseTo(0.25)
        expect(sprite.anchor.y).toBeCloseTo(0.625)
    })

    test('does not offset a sprite when the hitbox matches the frame size', () => {
        const sprite = new CanvasSprite()
        sprite.hitbox = { w: 32, h: 32 }

        ;(sprite as any).applyHitboxAnchor(32, 32)

        expect(sprite.anchor.x).toBeCloseTo(0)
        expect(sprite.anchor.y).toBeCloseTo(0)
    })

    describe('Global Asset Loader Integration', () => {
        test('globalLoader is available in context', async () => {
            const canvasElement = await TestBed.createComponent(Sprite, {
                width: 32,
                height: 32
            })

            // Access the canvas element's context
            const canvasParent = canvasElement.parent
            expect(canvasParent).toBeDefined()
            
            const globalLoader = canvasParent?.props?.context?.globalLoader
            expect(globalLoader).toBeDefined()
            expect(globalLoader).toBeInstanceOf(GlobalAssetLoader)
        })

        test('sprite can access globalLoader from context', async () => {
            const spriteElement = await TestBed.createComponent(Sprite, {
                width: 32,
                height: 32
            })

            const instance = spriteElement.componentInstance as any
            expect(instance).toBeDefined()
            
            // The globalLoader should be accessible from the sprite's context
            const canvasParent = spriteElement.parent
            const globalLoader = canvasParent?.props?.context?.globalLoader
            expect(globalLoader).toBeDefined()
        })
    })
}) 
