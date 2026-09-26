import { describe, expect, test } from 'vitest'
import { Container, signal } from 'canvasengine'
import { TestBed } from '../../packages/core/testing'

describe('eventMode prop', () => {
    test('event props still enable static hit testing by default', async () => {
        const element = await TestBed.createComponent(Container, { pointerdown: () => {} })

        expect((element.componentInstance as any).eventMode).toBe('static')
    })

    test('an explicit eventMode is not overridden by event props', async () => {
        const element = await TestBed.createComponent(Container, {
            eventMode: 'none',
            pointerdown: () => {},
        })

        expect((element.componentInstance as any).eventMode).toBe('none')
    })

    test('eventMode opts a visual-only element out of hit testing', async () => {
        const element = await TestBed.createComponent(Container, { eventMode: 'none' })

        expect((element.componentInstance as any).eventMode).toBe('none')
    })

    test('eventMode follows a signal', async () => {
        const mode = signal<'none' | 'static'>('none')
        const element = await TestBed.createComponent(Container, {
            eventMode: mode,
            pointerdown: () => {},
        })
        const instance = element.componentInstance as any
        expect(instance.eventMode).toBe('none')

        mode.set('static')
        expect(instance.eventMode).toBe('static')
    })
})
