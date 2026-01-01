import { beforeEach, describe, expect, test } from 'vitest'
import { DOMContainer, Sprite } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

describe('reactive DOM routing', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>'
    })

    test('routes Sprite to DOMSprite under DOMContainer', async () => {
        const containerElement = await TestBed.createComponent(DOMContainer, {}, [
            Sprite({ width: 10, height: 10 })
        ])

        expect(containerElement.props.children?.[0]?.tag).toBe('DOMSprite')
    })
})
