import { describe, expect, test, vi, beforeEach } from 'vitest'
import { GlobalAssetLoader } from '../../packages/core/src/utils/GlobalAssetLoader'

describe('GlobalAssetLoader', () => {
  let loader: GlobalAssetLoader

  beforeEach(() => {
    loader = new GlobalAssetLoader()
  })

  describe('registerAsset', () => {
    test('registers a new asset and returns a unique ID', () => {
      const assetId = loader.registerAsset('path/to/image.png')
      
      expect(assetId).toBeDefined()
      expect(typeof assetId).toBe('string')
      expect(assetId).toContain('asset_')
      expect(assetId).toContain('path/to/image.png')
    })

    test('registers multiple assets with unique IDs', () => {
      const id1 = loader.registerAsset('image1.png')
      const id2 = loader.registerAsset('image2.png')
      
      expect(id1).not.toBe(id2)
      expect(loader.getAssetCount()).toBe(2)
    })

    test('resets completion state when registering new asset', () => {
      const id1 = loader.registerAsset('image1.png')
      loader.completeAsset(id1)
      
      expect(loader.getGlobalProgress()).toBe(1)
      
      const id2 = loader.registerAsset('image2.png')
      expect(loader.getGlobalProgress()).toBeLessThan(1)
    })
  })

  describe('updateProgress', () => {
    test('updates progress for a registered asset', () => {
      const assetId = loader.registerAsset('image.png')
      
      loader.updateProgress(assetId, 0.5)
      expect(loader.getGlobalProgress()).toBe(0.5)
    })

    test('clamps progress to 0-1 range', () => {
      const assetId = loader.registerAsset('image.png')
      
      loader.updateProgress(assetId, -0.5)
      expect(loader.getGlobalProgress()).toBe(0)
      
      loader.updateProgress(assetId, 1.5)
      expect(loader.getGlobalProgress()).toBe(1)
    })

    test('warns when updating progress for non-existent asset', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      loader.updateProgress('non-existent-id', 0.5)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Asset non-existent-id not found')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('completeAsset', () => {
    test('marks asset as completed', () => {
      const assetId = loader.registerAsset('image.png')
      
      loader.completeAsset(assetId)
      
      expect(loader.getCompletedCount()).toBe(1)
      expect(loader.getGlobalProgress()).toBe(1)
    })

    test('warns when completing non-existent asset', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      loader.completeAsset('non-existent-id')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Asset non-existent-id not found')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('removeAsset', () => {
    test('removes asset from tracking', () => {
      const assetId = loader.registerAsset('image.png')
      
      expect(loader.getAssetCount()).toBe(1)
      
      loader.removeAsset(assetId)
      
      expect(loader.getAssetCount()).toBe(0)
    })

    test('updates global progress after removal', () => {
      const id1 = loader.registerAsset('image1.png')
      const id2 = loader.registerAsset('image2.png')
      
      loader.updateProgress(id1, 0.5)
      loader.updateProgress(id2, 0.5)
      
      expect(loader.getGlobalProgress()).toBe(0.5)
      
      loader.removeAsset(id1)
      
      expect(loader.getGlobalProgress()).toBe(0.5) // Only id2 remains at 50%
    })
  })

  describe('onProgress', () => {
    test('registers progress callback', () => {
      const callback = vi.fn()
      
      const unsubscribe = loader.onProgress(callback)
      
      expect(callback).toHaveBeenCalledWith(1) // Initial call with current progress (no assets = 100%)
      expect(typeof unsubscribe).toBe('function')
    })

    test('calls callback when progress updates', () => {
      const callback = vi.fn()
      loader.onProgress(callback)
      
      callback.mockClear()
      
      const assetId = loader.registerAsset('image.png')
      expect(callback).toHaveBeenCalledWith(0) // New asset starts at 0
      
      callback.mockClear()
      
      loader.updateProgress(assetId, 0.5)
      expect(callback).toHaveBeenCalledWith(0.5)
    })

    test('unsubscribe removes callback', () => {
      const callback = vi.fn()
      const unsubscribe = loader.onProgress(callback)
      
      callback.mockClear()
      unsubscribe()
      
      loader.registerAsset('image.png')
      expect(callback).not.toHaveBeenCalled()
    })

    test('handles multiple progress callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      loader.onProgress(callback1)
      loader.onProgress(callback2)
      
      callback1.mockClear()
      callback2.mockClear()
      
      const assetId = loader.registerAsset('image.png')
      
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    test('handles errors in progress callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const normalCallback = vi.fn()
      
      loader.onProgress(errorCallback)
      loader.onProgress(normalCallback)
      
      const assetId = loader.registerAsset('image.png')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in onProgress callback:',
        expect.any(Error)
      )
      // Normal callback should still be called
      expect(normalCallback).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('onComplete', () => {
    test('registers complete callback', () => {
      const callback = vi.fn()
      
      const unsubscribe = loader.onComplete(callback)
      
      expect(typeof unsubscribe).toBe('function')
    })

    test('calls callback when all assets are complete', () => {
      const callback = vi.fn()
      loader.onComplete(callback)
      
      const id1 = loader.registerAsset('image1.png')
      const id2 = loader.registerAsset('image2.png')
      
      expect(callback).not.toHaveBeenCalled()
      
      loader.completeAsset(id1)
      expect(callback).not.toHaveBeenCalled() // Still one asset pending
      
      loader.completeAsset(id2)
      expect(callback).toHaveBeenCalledTimes(1) // All assets complete
    })

    test('calls callback immediately if already complete', () => {
      const callback = vi.fn()
      
      const id1 = loader.registerAsset('image1.png')
      loader.completeAsset(id1)
      
      loader.onComplete(callback)
      
      expect(callback).toHaveBeenCalledTimes(1)
    })

    test('unsubscribe removes callback', () => {
      const callback = vi.fn()
      const unsubscribe = loader.onComplete(callback)
      
      unsubscribe()
      
      const assetId = loader.registerAsset('image.png')
      loader.completeAsset(assetId)
      
      expect(callback).not.toHaveBeenCalled()
    })

    test('handles multiple complete callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      loader.onComplete(callback1)
      loader.onComplete(callback2)
      
      const assetId = loader.registerAsset('image.png')
      loader.completeAsset(assetId)
      
      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    test('handles errors in complete callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      loader.onComplete(errorCallback)
      
      const assetId = loader.registerAsset('image.png')
      loader.completeAsset(assetId)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in onComplete callback:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('getGlobalProgress', () => {
    test('returns 1 when no assets are registered', () => {
      expect(loader.getGlobalProgress()).toBe(1)
    })

    test('returns 0 when asset is registered but not started', () => {
      loader.registerAsset('image.png')
      expect(loader.getGlobalProgress()).toBe(0)
    })

    test('calculates average progress across all assets', () => {
      const id1 = loader.registerAsset('image1.png')
      const id2 = loader.registerAsset('image2.png')
      
      loader.updateProgress(id1, 0.5)
      loader.updateProgress(id2, 0.75)
      
      expect(loader.getGlobalProgress()).toBe(0.625) // (0.5 + 0.75) / 2
    })

    test('returns 1 when all assets are complete', () => {
      const id1 = loader.registerAsset('image1.png')
      const id2 = loader.registerAsset('image2.png')
      
      loader.completeAsset(id1)
      loader.completeAsset(id2)
      
      expect(loader.getGlobalProgress()).toBe(1)
    })
  })

  describe('getAssetCount', () => {
    test('returns 0 initially', () => {
      expect(loader.getAssetCount()).toBe(0)
    })

    test('returns correct count after registering assets', () => {
      loader.registerAsset('image1.png')
      expect(loader.getAssetCount()).toBe(1)
      
      loader.registerAsset('image2.png')
      expect(loader.getAssetCount()).toBe(2)
    })

    test('decreases count after removing assets', () => {
      const id1 = loader.registerAsset('image1.png')
      const id2 = loader.registerAsset('image2.png')
      
      expect(loader.getAssetCount()).toBe(2)
      
      loader.removeAsset(id1)
      expect(loader.getAssetCount()).toBe(1)
    })
  })

  describe('getCompletedCount', () => {
    test('returns 0 initially', () => {
      expect(loader.getCompletedCount()).toBe(0)
    })

    test('returns correct count of completed assets', () => {
      const id1 = loader.registerAsset('image1.png')
      const id2 = loader.registerAsset('image2.png')
      
      expect(loader.getCompletedCount()).toBe(0)
      
      loader.completeAsset(id1)
      expect(loader.getCompletedCount()).toBe(1)
      
      loader.completeAsset(id2)
      expect(loader.getCompletedCount()).toBe(2)
    })
  })

  describe('reset', () => {
    test('clears all assets and callbacks', () => {
      const progressCallback = vi.fn()
      const completeCallback = vi.fn()
      
      loader.onProgress(progressCallback)
      loader.onComplete(completeCallback)
      
      const id1 = loader.registerAsset('image1.png')
      loader.updateProgress(id1, 0.5)
      
      expect(loader.getAssetCount()).toBe(1)
      
      // Clear previous calls
      progressCallback.mockClear()
      completeCallback.mockClear()
      
      loader.reset()
      
      expect(loader.getAssetCount()).toBe(0)
      expect(loader.getGlobalProgress()).toBe(1)
      
      // Callbacks should be cleared - new asset registration shouldn't trigger them
      const id2 = loader.registerAsset('image2.png')
      // The initial call from onProgress registration happens, but after reset
      // new registrations shouldn't trigger the old callbacks
      expect(progressCallback).not.toHaveBeenCalled()
    })
  })
})

