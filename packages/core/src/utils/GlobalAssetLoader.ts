/**
 * Global Asset Loader
 * 
 * Tracks the loading progress of all assets (images, spritesheets, etc.) across all sprites in a component tree.
 * This allows components to know when all assets are loaded, useful for displaying loaders or progress bars.
 * 
 * @example
 * ```typescript
 * const loader = new GlobalAssetLoader();
 * 
 * loader.onProgress((progress) => {
 *   console.log(`Loading: ${(progress * 100).toFixed(0)}%`);
 * });
 * 
 * loader.onComplete(() => {
 *   console.log('All assets loaded!');
 * });
 * 
 * // Register assets as they start loading
 * const assetId = loader.registerAsset('path/to/image.png');
 * 
 * // Update progress
 * loader.updateProgress(assetId, 0.5);
 * 
 * // Mark as complete
 * loader.completeAsset(assetId);
 * ```
 */
export class GlobalAssetLoader {
  private assets: Map<string, { progress: number; completed: boolean }> = new Map();
  private onProgressCallbacks: Set<(progress: number) => void> = new Set();
  private onCompleteCallbacks: Set<() => void> = new Set();
  private assetCounter: number = 0;
  private isComplete: boolean = false;

  /**
   * Registers a new asset to track
   * 
   * @param assetPath - The path or identifier of the asset being loaded
   * @returns A unique ID for this asset that should be used for progress updates
   * 
   * @example
   * ```typescript
   * const assetId = loader.registerAsset('path/to/image.png');
   * ```
   */
  registerAsset(assetPath: string): string {
    const assetId = `asset_${this.assetCounter++}_${assetPath}`;
    this.assets.set(assetId, { progress: 0, completed: false });
    this.isComplete = false;
    this.updateGlobalProgress();
    return assetId;
  }

  /**
   * Updates the progress of a specific asset
   * 
   * @param assetId - The ID returned by registerAsset
   * @param progress - Progress value between 0 and 1
   * 
   * @example
   * ```typescript
   * loader.updateProgress(assetId, 0.5); // 50% loaded
   * ```
   */
  updateProgress(assetId: string, progress: number): void {
    const asset = this.assets.get(assetId);
    if (!asset) {
      console.warn(`Asset ${assetId} not found in tracker`);
      return;
    }
    
    asset.progress = Math.max(0, Math.min(1, progress));
    this.updateGlobalProgress();
  }

  /**
   * Marks an asset as completely loaded
   * 
   * @param assetId - The ID returned by registerAsset
   * 
   * @example
   * ```typescript
   * loader.completeAsset(assetId);
   * ```
   */
  completeAsset(assetId: string): void {
    const asset = this.assets.get(assetId);
    if (!asset) {
      console.warn(`Asset ${assetId} not found in tracker`);
      return;
    }
    
    asset.progress = 1;
    asset.completed = true;
    this.updateGlobalProgress();
    this.checkCompletion();
  }

  /**
   * Removes an asset from tracking (useful for cleanup)
   * 
   * @param assetId - The ID returned by registerAsset
   */
  removeAsset(assetId: string): void {
    this.assets.delete(assetId);
    this.updateGlobalProgress();
  }

  /**
   * Registers a callback that will be called whenever the global progress changes
   * 
   * @param callback - Function that receives the global progress (0-1)
   * @returns A function to unregister the callback
   * 
   * @example
   * ```typescript
   * const unsubscribe = loader.onProgress((progress) => {
   *   console.log(`Loading: ${(progress * 100).toFixed(0)}%`);
   * });
   * 
   * // Later, to unsubscribe:
   * unsubscribe();
   * ```
   */
  onProgress(callback: (progress: number) => void): () => void {
    this.onProgressCallbacks.add(callback);
    
    // Immediately call with current progress (wrap in try-catch for safety)
    try {
      callback(this.getGlobalProgress());
    } catch (error) {
      console.error('Error in onProgress callback:', error);
    }
    
    return () => {
      this.onProgressCallbacks.delete(callback);
    };
  }

  /**
   * Registers a callback that will be called when all assets are loaded
   * 
   * @param callback - Function to call when all assets are complete
   * @returns A function to unregister the callback
   * 
   * @example
   * ```typescript
   * const unsubscribe = loader.onComplete(() => {
   *   console.log('All assets loaded!');
   * });
   * 
   * // Later, to unsubscribe:
   * unsubscribe();
   * ```
   */
  onComplete(callback: () => void): () => void {
    this.onCompleteCallbacks.add(callback);
    
    // If already complete, call immediately
    if (this.isComplete) {
      callback();
    }
    
    return () => {
      this.onCompleteCallbacks.delete(callback);
    };
  }

  /**
   * Gets the current global progress (0-1)
   * 
   * @returns Progress value between 0 and 1
   */
  getGlobalProgress(): number {
    if (this.assets.size === 0) {
      return 1; // No assets means everything is "loaded"
    }
    
    let totalProgress = 0;
    for (const asset of this.assets.values()) {
      totalProgress += asset.progress;
    }
    
    return totalProgress / this.assets.size;
  }

  /**
   * Gets the number of assets currently being tracked
   * 
   * @returns Number of registered assets
   */
  getAssetCount(): number {
    return this.assets.size;
  }

  /**
   * Gets the number of completed assets
   * 
   * @returns Number of completed assets
   */
  getCompletedCount(): number {
    let count = 0;
    for (const asset of this.assets.values()) {
      if (asset.completed) count++;
    }
    return count;
  }

  /**
   * Checks if all assets are loaded and triggers onComplete callbacks
   */
  private checkCompletion(): void {
    if (this.isComplete) return;
    
    const allCompleted = Array.from(this.assets.values()).every(asset => asset.completed);
    
    if (allCompleted && this.assets.size > 0) {
      this.isComplete = true;
      this.onCompleteCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in onComplete callback:', error);
        }
      });
    }
  }

  /**
   * Updates global progress and notifies all progress callbacks
   */
  private updateGlobalProgress(): void {
    const progress = this.getGlobalProgress();
    // Create a copy of callbacks to avoid issues if callbacks modify the set
    const callbacks = Array.from(this.onProgressCallbacks);
    callbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in onProgress callback:', error);
      }
    });
  }

  /**
   * Resets the loader, clearing all assets and callbacks
   */
  reset(): void {
    this.assets.clear();
    this.onProgressCallbacks.clear();
    this.onCompleteCallbacks.clear();
    this.assetCounter = 0;
    this.isComplete = false;
  }
}

