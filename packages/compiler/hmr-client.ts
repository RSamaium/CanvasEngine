/**
 * Client-side HMR utilities for CanvasEngine .ce components
 * This file provides enhanced hot module replacement functionality
 */

interface ComponentInstance {
  update?: (newComponent: Function) => void;
  forceUpdate?: () => void;
  parent?: ComponentInstance;
  destroy?: () => void;
  _ceHmrId?: string;
}

interface HMRState {
  components: Map<string, Set<ComponentInstance>>;
  updateQueue: Array<() => void>;
  isUpdating: boolean;
}

class CanvasEngineHMR {
  private state: HMRState = {
    components: new Map(),
    updateQueue: [],
    isUpdating: false
  };

  constructor() {
    // Set up global HMR update handler
    if (typeof window !== 'undefined') {
      (window as any).__CANVASENGINE_HMR_UPDATE__ = this.globalUpdateHandler.bind(this);
      (window as any).__CANVASENGINE_HMR__ = this;
    }
  }

  /**
   * Register a component instance for HMR tracking
   */
  registerComponent(hmrId: string, instance: ComponentInstance): void {
    if (!this.state.components.has(hmrId)) {
      this.state.components.set(hmrId, new Set());
    }
    
    const instances = this.state.components.get(hmrId)!;
    instances.add(instance);
    
    // Store HMR ID on the instance for cleanup
    instance._ceHmrId = hmrId;
    
    console.log(`[CanvasEngine HMR] Registered component instance: ${hmrId}`);
  }

  /**
   * Unregister a component instance
   */
  unregisterComponent(instance: ComponentInstance): void {
    if (instance._ceHmrId) {
      const instances = this.state.components.get(instance._ceHmrId);
      if (instances) {
        instances.delete(instance);
        if (instances.size === 0) {
          this.state.components.delete(instance._ceHmrId);
        }
      }
    }
  }

  /**
   * Global update handler called by the HMR system
   */
  private globalUpdateHandler(hmrId: string, newComponent: Function): void {
    this.queueUpdate(() => {
      this.updateComponentInstances(hmrId, newComponent);
    });
  }

  /**
   * Queue an update to be processed
   */
  private queueUpdate(updateFn: () => void): void {
    this.state.updateQueue.push(updateFn);
    
    if (!this.state.isUpdating) {
      this.processUpdateQueue();
    }
  }

  /**
   * Process all queued updates
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.state.isUpdating) return;
    
    this.state.isUpdating = true;
    
    try {
      while (this.state.updateQueue.length > 0) {
        const update = this.state.updateQueue.shift();
        if (update) {
          await new Promise(resolve => {
            update();
            // Allow a frame to pass for rendering
            requestAnimationFrame(resolve);
          });
        }
      }
    } finally {
      this.state.isUpdating = false;
    }
  }

  /**
   * Update all instances of a specific component
   */
  private updateComponentInstances(hmrId: string, newComponent: Function): void {
    const instances = this.state.components.get(hmrId);
    
    if (!instances || instances.size === 0) {
      console.warn(`[CanvasEngine HMR] No instances found for component: ${hmrId}`);
      return;
    }

    let updateCount = 0;
    
    instances.forEach(instance => {
      try {
        if (this.updateInstance(instance, newComponent)) {
          updateCount++;
        }
      } catch (error) {
        console.error(`[CanvasEngine HMR] Error updating instance for ${hmrId}:`, error);
      }
    });

    if (updateCount > 0) {
      console.log(`[CanvasEngine HMR] Successfully updated ${updateCount} instance(s) of component: ${hmrId}`);
      
      // Trigger any global update listeners
      this.notifyGlobalListeners(hmrId, newComponent);
    }
  }

  /**
   * Update a single component instance
   */
  private updateInstance(instance: ComponentInstance, newComponent: Function): boolean {
    // Strategy 1: Direct update method
    if (typeof instance.update === 'function') {
      instance.update(newComponent);
      return true;
    }

    // Strategy 2: Force update on parent
    if (instance.parent && typeof instance.parent.forceUpdate === 'function') {
      instance.parent.forceUpdate();
      return true;
    }

    // Strategy 3: Try to find and update PixiJS container/display object
    if (this.updatePixiInstance(instance)) {
      return true;
    }

    console.warn('[CanvasEngine HMR] Could not find suitable update method for instance');
    return false;
  }

  /**
   * Try to update a PixiJS instance
   */
  private updatePixiInstance(instance: any): boolean {
    // Check if this looks like a PixiJS display object
    if (instance && typeof instance.addChild === 'function' && typeof instance.removeChild === 'function') {
      // Force a re-render by marking as dirty
      if (instance.texture) {
        instance.texture.update();
      }
      
      // If it has a parent container, force parent update
      if (instance.parent && typeof instance.parent.sortChildren === 'function') {
        instance.parent.sortChildren();
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Notify any global HMR listeners
   */
  private notifyGlobalListeners(hmrId: string, newComponent: Function): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('canvasengine:hmr-update', {
        detail: { hmrId, newComponent }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Clean up HMR state
   */
  cleanup(): void {
    this.state.components.clear();
    this.state.updateQueue.length = 0;
    this.state.isUpdating = false;
  }

  /**
   * Get current HMR statistics
   */
  getStats() {
    return {
      componentCount: this.state.components.size,
      totalInstances: Array.from(this.state.components.values())
        .reduce((total, instances) => total + instances.size, 0),
      queuedUpdates: this.state.updateQueue.length,
      isUpdating: this.state.isUpdating
    };
  }
}

// Create and export the global HMR instance
export const canvasEngineHMR = new CanvasEngineHMR();

// Export utility functions
export function registerComponentForHMR(hmrId: string, instance: ComponentInstance): void {
  canvasEngineHMR.registerComponent(hmrId, instance);
}

export function unregisterComponentFromHMR(instance: ComponentInstance): void {
  canvasEngineHMR.unregisterComponent(instance);
}

// Auto-setup in browser environment
if (typeof window !== 'undefined') {
  console.log('[CanvasEngine HMR] Client initialized');
}