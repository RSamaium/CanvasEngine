import { beforeEach, describe, expect, test, vi } from 'vitest'
import { signal } from 'canvasengine'
import { ParticlesEmitter } from '../../packages/core/src/components/ParticleEmitter'
import { TestBed } from '../../packages/core/testing'

describe('ParticleEmitter Component', () => {
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            alpha: {
                start: 1,
                end: 0
            },
            scale: {
                start: 0.5,
                end: 1
            },
            color: {
                start: "#ffffff",
                end: "#000000"
            },
            speed: {
                start: 100,
                end: 50
            },
            lifetime: {
                min: 0.5,
                max: 2.0
            },
            frequency: 0.1,
            emitterLifetime: -1,
            maxParticles: 100,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: false,
            spawnType: "circle",
            spawnCircle: {
                x: 0,
                y: 0,
                r: 10
            },
            behaviors: []
        }
    })

    test('creates particle emitter component with basic config', async () => {
        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: mockConfig
        })

        expect(emitterElement).toBeDefined()
        expect(typeof emitterElement).toBe('object')
    })

    test('creates particle emitter with simple config', async () => {
        const simpleConfig = {
            alpha: { start: 1, end: 0 },
            lifetime: { min: 1, max: 2 },
            frequency: 0.2,
            behaviors: []
        }

        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: simpleConfig
        })

        expect(emitterElement).toBeDefined()
    })

    test('creates particle emitter with position properties', async () => {
        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: mockConfig
        })

        expect(emitterElement).toBeDefined()
        expect((emitterElement.componentInstance as any).x).toBeDefined()
        expect((emitterElement.componentInstance as any).y).toBeDefined()
    })

    test('handles particle emitter with color animation', async () => {
        const colorConfig = {
            ...mockConfig,
            color: {
                start: "#ff0000",
                end: "#0000ff"
            }
        }

        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: colorConfig
        })

        expect(emitterElement).toBeDefined()
    })

    test('handles particle emitter with scale animation', async () => {
        const scaleConfig = {
            ...mockConfig,
            scale: {
                start: 0.1,
                end: 2.0
            }
        }

        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: scaleConfig
        })

        expect(emitterElement).toBeDefined()
    })

    test('handles particle emitter with speed configuration', async () => {
        const speedConfig = {
            ...mockConfig,
            speed: {
                start: 200,
                end: 0
            },
            acceleration: {
                x: 0,
                y: 100
            }
        }

        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: speedConfig
        })

        expect(emitterElement).toBeDefined()
    })

    test('handles particle emitter with spawn shapes', async () => {
        const rectSpawnConfig = {
            ...mockConfig,
            spawnType: "rect",
            spawnRect: {
                x: -50,
                y: -25,
                w: 100,
                h: 50
            }
        }

        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: rectSpawnConfig
        })

        expect(emitterElement).toBeDefined()
    })

    test('handles particle emitter with lifetime settings', async () => {
        const lifetimeConfig = {
            ...mockConfig,
            lifetime: {
                min: 0.5,
                max: 3.0
            },
            emitterLifetime: 10
        }

        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: lifetimeConfig
        })

        expect(emitterElement).toBeDefined()
    })

    test('handles particle emitter with max particles limit', async () => {
        const limitedConfig = {
            ...mockConfig,
            maxParticles: 50,
            frequency: 0.05
        }

        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: limitedConfig
        })

        expect(emitterElement).toBeDefined()
    })

    test('handles dynamic config updates', async () => {
        const dynamicFrequency = signal(0.1)
        
        const configWithSignal = {
            ...mockConfig,
            frequency: dynamicFrequency()
        }

        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: configWithSignal
        })

        expect(emitterElement).toBeDefined()

        dynamicFrequency.set(0.2)
        expect(dynamicFrequency()).toBe(0.2)
    })

    test('handles empty particle emitter creation', async () => {
        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {})
        expect(emitterElement).toBeDefined()
    })

    test('component instance has correct methods', async () => {
        const emitterElement = await TestBed.createComponent(ParticlesEmitter, {
            config: mockConfig
        })

        const instance = emitterElement.componentInstance
        expect(instance).toBeDefined()
        expect(typeof instance.onMount).toBe('function')
        expect(typeof instance.onUpdate).toBe('function')
        expect(typeof instance.onDestroy).toBe('function')
    })
}) 