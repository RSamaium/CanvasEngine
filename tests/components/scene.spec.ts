import { describe, expect, test } from 'vitest'
import { Scene } from '../../packages/core/src/components/Scene'

describe('Scene Component', () => {
    test('creates scene component', () => {
        const sceneElement = Scene({})

        expect(sceneElement).toBeDefined()
        expect(typeof sceneElement).toBe('object')
    })

    test('creates scene component with properties', () => {
        const sceneElement = Scene({
            x: 100,
            y: 50,
            width: 800,
            height: 600
        })

        expect(sceneElement).toBeDefined()
    })

    test('creates scene component with children', () => {
        const sceneElement = Scene({
            children: []
        })

        expect(sceneElement).toBeDefined()
    })

    test('creates scene component with all properties', () => {
        const sceneElement = Scene({
            x: 0,
            y: 0,
            width: 1024,
            height: 768,
            alpha: 1,
            visible: true,
            children: []
        })

        expect(sceneElement).toBeDefined()
    })

    test('scene component is essentially a container', () => {
        const sceneElement = Scene({})
        
        // Scene is just a wrapper around Container
        expect(sceneElement).toBeDefined()
        expect(typeof sceneElement).toBe('object')
    })
}) 