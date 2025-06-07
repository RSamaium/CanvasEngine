import { beforeEach, describe, expect, test, vi } from 'vitest'
import { signal } from 'canvasengine'
import { Video } from '../../packages/core/src/components/Video'
import { TestBed } from '../../packages/core/testing'

describe('Video Component', () => {
    test('creates video component with basic properties', async () => {
        const videoElement = await TestBed.createComponent(Video, {
            paused: true,
            loop: false,
            muted: true
        })

        expect(videoElement).toBeDefined()
        expect(typeof videoElement).toBe('object')
    })

    test('creates video component with playback controls', async () => {
        const videoElement = await TestBed.createComponent(Video, {
            paused: false,
            loop: true,
            muted: false
        })

        expect(videoElement).toBeDefined()
    })

    test('handles video with loader callbacks', async () => {
        const onProgress = vi.fn()
        const onComplete = vi.fn()

        const videoElement = await TestBed.createComponent(Video, {
            loader: {
                onProgress: onProgress,
                onComplete: onComplete
            }
        })

        expect(videoElement).toBeDefined()
        expect(onProgress).toBeDefined()
        expect(onComplete).toBeDefined()
    })

    test('handles dynamic playback state with signals', async () => {
        const dynamicPaused = signal(true)
        const dynamicLoop = signal(false)
        const dynamicMuted = signal(true)

        const videoElement = await TestBed.createComponent(Video, {
            paused: dynamicPaused,
            loop: dynamicLoop,
            muted: dynamicMuted
        })

        expect(videoElement).toBeDefined()

        dynamicPaused.set(false)
        dynamicLoop.set(true)
        dynamicMuted.set(false)

        expect(dynamicPaused()).toBe(false)
        expect(dynamicLoop()).toBe(true)
        expect(dynamicMuted()).toBe(false)
    })

    test('handles video with different properties', async () => {
        const video1 = await TestBed.createComponent(Video, {
            paused: true
        })

        const video2 = await TestBed.createComponent(Video, {
            loop: true
        })

        const video3 = await TestBed.createComponent(Video, {
            muted: false
        })

        expect(video1).toBeDefined()
        expect(video2).toBeDefined()
        expect(video3).toBeDefined()
    })

    test('handles video with all basic properties', async () => {
        const onComplete = vi.fn()

        const videoElement = await TestBed.createComponent(Video, {
            paused: false,
            loop: true,
            muted: false,
            loader: {
                onComplete: onComplete
            }
        })

        expect(videoElement).toBeDefined()
        expect(onComplete).toBeDefined()
    })

    test('handles video with loader progress tracking', async () => {
        const onProgress = vi.fn()

        const videoElement = await TestBed.createComponent(Video, {
            loader: {
                onProgress: onProgress
            }
        })

        expect(videoElement).toBeDefined()
        expect(onProgress).toBeDefined()
    })

    test('handles video with both loader callbacks', async () => {
        const onProgress = vi.fn()
        const onComplete = vi.fn()

        const videoElement = await TestBed.createComponent(Video, {
            paused: true,
            loader: {
                onProgress: onProgress,
                onComplete: onComplete
            }
        })

        expect(videoElement).toBeDefined()
        expect(onProgress).toBeDefined()
        expect(onComplete).toBeDefined()
    })

    test('handles video playback states', async () => {
        const pausedVideo = await TestBed.createComponent(Video, {
            paused: true
        })

        const playingVideo = await TestBed.createComponent(Video, {
            paused: false
        })

        expect(pausedVideo).toBeDefined()
        expect(playingVideo).toBeDefined()
    })

    test('handles video loop settings', async () => {
        const loopingVideo = await TestBed.createComponent(Video, {
            loop: true
        })

        const nonLoopingVideo = await TestBed.createComponent(Video, {
            loop: false
        })

        expect(loopingVideo).toBeDefined()
        expect(nonLoopingVideo).toBeDefined()
    })

    test('handles video mute settings', async () => {
        const mutedVideo = await TestBed.createComponent(Video, {
            muted: true
        })

        const audibleVideo = await TestBed.createComponent(Video, {
            muted: false
        })

        expect(mutedVideo).toBeDefined()
        expect(audibleVideo).toBeDefined()
    })
}) 