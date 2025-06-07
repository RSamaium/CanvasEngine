import { beforeEach, describe, expect, test, vi } from 'vitest'
import { signal } from 'canvasengine'
import { Mesh } from '../../packages/core/src/components/Mesh'
import { TestBed } from '../../packages/core/testing'

describe('Mesh Component', () => {
    let mockGeometry;
    let mockShader;

    beforeEach(() => {
        // Mock basic geometry and shader objects
        mockGeometry = {
            vertices: new Float32Array([0, 0, 1, 0, 0, 1]),
            indices: new Uint16Array([0, 1, 2]),
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn()
        }
        
        mockShader = {
            vertex: 'vertex shader code',
            fragment: 'fragment shader code'
        }
    })

    test('creates mesh component with basic properties', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {
            x: 100,
            y: 50
        })

        expect(meshElement).toBeDefined()
        expect(typeof meshElement).toBe('object')
        expect((meshElement.componentInstance as any).x).toBe(100)
        expect((meshElement.componentInstance as any).y).toBe(50)
    })

    test('creates mesh component with geometry', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {
            geometry: mockGeometry,
            x: 100,
            y: 50
        })

        expect(meshElement).toBeDefined()
        expect((meshElement.componentInstance as any).geometry).toBe(mockGeometry)
    })

    test('creates mesh component with shader', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {
            shader: mockShader,
            x: 100,
            y: 50
        })

        expect(meshElement).toBeDefined()
        expect((meshElement.componentInstance as any).shader).toStrictEqual(mockShader)
    })

    test('creates mesh component with texture property', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {
            x: 100,
            y: 50,
            tint: 0xffffff
        })

        expect(meshElement).toBeDefined()
    })

    test('creates mesh component with basic properties', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {
            x: 100,
            y: 50,
            width: 64,
            height: 64
        })

        expect(meshElement).toBeDefined()
    })

    test('handles tint property', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {
            tint: 0xff0000
        })

        expect(meshElement).toBeDefined()
        expect((meshElement.componentInstance as any).tint).toBe(0xff0000)
    })

    test('handles dynamic tint with signal', async () => {
        const dynamicTint = signal(0xff0000)
        
        const meshElement = await TestBed.createComponent(Mesh, {
            tint: dynamicTint
        })

        expect(meshElement).toBeDefined()
        expect((meshElement.componentInstance as any).tint).toBe(0xff0000)
        
        dynamicTint.set(0x00ff00)
        expect((meshElement.componentInstance as any).tint).toBe(0x00ff00)
    })

    test('handles roundPixels property', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {
            roundPixels: true
        })

        expect(meshElement).toBeDefined()
        expect((meshElement.componentInstance as any).roundPixels).toBe(true)
    })

    test('handles dynamic roundPixels with signal', async () => {
        const dynamicRoundPixels = signal(false)
        
        const meshElement = await TestBed.createComponent(Mesh, {
            roundPixels: dynamicRoundPixels
        })

        expect(meshElement).toBeDefined()
        expect((meshElement.componentInstance as any).roundPixels).toBe(false)
        
        dynamicRoundPixels.set(true)
        expect((meshElement.componentInstance as any).roundPixels).toBe(true)
    })

    test('creates mesh with multiple properties', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {
            geometry: mockGeometry,
            shader: mockShader,
            tint: 0xff0000,
            roundPixels: true,
            x: 100,
            y: 50,
            width: 200,
            height: 150
        })

        expect(meshElement).toBeDefined()
        expect((meshElement.componentInstance as any).geometry).toBe(mockGeometry)
        expect((meshElement.componentInstance as any).shader).toStrictEqual(mockShader)
        expect((meshElement.componentInstance as any).tint).toBe(0xff0000)
        expect((meshElement.componentInstance as any).roundPixels).toBe(true)
    })

    test('handles empty mesh creation', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {})
        expect(meshElement).toBeDefined()
    })

    test('handles dynamic geometry updates', async () => {
        const dynamicGeometry = signal(mockGeometry)
        
        const meshElement = await TestBed.createComponent(Mesh, {
            geometry: dynamicGeometry
        })

        expect(meshElement).toBeDefined()
        expect((meshElement.componentInstance as any).geometry).toBe(mockGeometry)
        
        const newGeometry = {
            vertices: new Float32Array([0, 0, 2, 0, 0, 2]),
            indices: new Uint16Array([0, 1, 2]),
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn()
        }
        
        dynamicGeometry.set(newGeometry)
        expect((meshElement.componentInstance as any).geometry).toBe(newGeometry)
    })

    test('component instance has correct methods', async () => {
        const meshElement = await TestBed.createComponent(Mesh, {})

        const instance = meshElement.componentInstance
        expect(instance).toBeDefined()
        expect(typeof instance.onMount).toBe('function')
        expect(typeof instance.onUpdate).toBe('function')
        expect(typeof instance.onDestroy).toBe('function')
        expect(typeof instance.onInit).toBe('function')
    })
}) 