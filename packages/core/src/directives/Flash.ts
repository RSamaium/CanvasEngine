import { Container } from 'pixi.js';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { effect, isSignal } from '@signe/reactive';
import { on, isTrigger, Trigger } from '../engine/trigger';
import { useProps } from '../hooks/useProps';
import { SignalOrPrimitive } from '../components/types';
import { animatedSignal, AnimatedSignal } from '../engine/animation';
import { Subscription } from 'rxjs';

export type FlashType = 'alpha' | 'tint' | 'both';

export type FlashProps = {
    /**
     * Trigger that activates the flash animation
     * When the trigger is activated, the flash animation will start
     */
    trigger?: Trigger<any>;
    /**
     * Type of flash effect: 'alpha' (opacity), 'tint' (color), or 'both'
     * @default 'alpha'
     */
    type?: SignalOrPrimitive<FlashType>;
    /**
     * Duration of the flash animation in milliseconds
     * @default 300
     */
    duration?: SignalOrPrimitive<number>;
    /**
     * Number of flash cycles (flash on/off)
     * @default 1
     */
    cycles?: SignalOrPrimitive<number>;
    /**
     * Alpha value when flashing (0 to 1)
     * Only used when type is 'alpha' or 'both'
     * @default 0.3
     */
    alpha?: SignalOrPrimitive<number>;
    /**
     * Tint color when flashing (hex color value)
     * Only used when type is 'tint' or 'both'
     * @default 0xffffff (white)
     */
    tint?: SignalOrPrimitive<number>;
    /**
     * Original alpha value to restore after flash
     * If not provided, uses the current alpha value
     */
    originalAlpha?: number;
    /**
     * Original tint value to restore after flash
     * If not provided, uses the current tint value
     */
    originalTint?: number;
    /**
     * Callback function called when flash starts
     */
    onStart?: () => void;
    /**
     * Callback function called when flash completes
     */
    onComplete?: () => void;
}

/**
 * Flash directive that animates a display object's alpha and/or tint when a trigger is activated.
 * Creates a flash effect by rapidly changing opacity or color.
 * 
 * @example
 * ```typescript
 * // Basic usage with trigger
 * const flashTrigger = trigger();
 * 
 * onMount(element) {
 *   // Element will flash when trigger is activated
 *   element.props.flash = { trigger: flashTrigger };
 * }
 * 
 * // Trigger the flash
 * flashTrigger.start();
 * ```
 */
export class Flash extends Directive {
    private elementRef: Element<Container> | null = null;
    private progressSignal: AnimatedSignal<number> | null = null;
    private flashSubscription: any = null;
    private alphaEffect: Subscription | null = null;
    private tintEffect: Subscription | null = null;
    private originalAlpha: number = 1;
    private originalTint: number = 0xffffff;
    private currentFlashConfig: {
        type: FlashType;
        duration: number;
        cycles: number;
        flashAlpha: number;
        flashTint: number;
    } | null = null;

    /**
     * Initializes the flash directive
     * @param element - The element to attach the flash effect to
     */
    onInit(element: Element<Container>) {
        this.elementRef = element;
    }

    /**
     * Mounts the flash directive and sets up trigger listener
     * @param element - The element being mounted
     */
    onMount(element: Element<Container>) {
        const instance = element.componentInstance;
        if (!instance) return;

        const flashProps = this.flashProps;
        
        // Check if trigger is provided
        if (!flashProps.trigger || !isTrigger(flashProps.trigger)) {
            return;
        }

        // Store original values once at mount time
        // Only set if not already stored (to preserve values from first mount)
        if (this.originalAlpha === 1 && !flashProps.originalAlpha) {
            this.originalAlpha = instance.alpha ?? 1;
        } else if (flashProps.originalAlpha !== undefined) {
            this.originalAlpha = flashProps.originalAlpha;
        }
        
        const currentTint = (instance as any).tint;
        if (this.originalTint === 0xffffff && !flashProps.originalTint) {
            this.originalTint = (isSignal(currentTint) ? currentTint() : currentTint) ?? 0xffffff;
        } else if (flashProps.originalTint !== undefined) {
            this.originalTint = flashProps.originalTint;
        }

        // Listen to trigger activation
        this.flashSubscription = on(flashProps.trigger, async (data) => {
            await this.performFlash(data);
        });
    }

    /**
     * Gets the flash props with default values
     * @returns FlashProps with defaults applied
     */
    get flashProps(): FlashProps {
        const flash = this.elementRef?.props.flash;
        return useProps(flash?.value ?? flash, {
            type: 'alpha',
            duration: 300,
            cycles: 1,
            alpha: 0.3,
            tint: 0xffffff,
        });
    }

    /**
     * Performs the flash animation using animatedSignal
     * @param data - Optional data passed from the trigger that can override default options
     */
    private async performFlash(data?: any): Promise<void> {
        if (!this.elementRef?.componentInstance) return;

        const instance = this.elementRef.componentInstance;
        const flashProps = this.flashProps;
        
        // Use data from trigger to override defaults if provided
        const type = data?.type ?? (typeof flashProps.type === 'function' ? flashProps.type() : flashProps.type);
        const duration = data?.duration ?? (typeof flashProps.duration === 'function' ? flashProps.duration() : flashProps.duration);
        const cycles = data?.cycles ?? (typeof flashProps.cycles === 'function' ? flashProps.cycles() : flashProps.cycles);
        const flashAlpha = data?.alpha ?? (typeof flashProps.alpha === 'function' ? flashProps.alpha() : flashProps.alpha);
        const flashTint = data?.tint ?? (typeof flashProps.tint === 'function' ? flashProps.tint() : flashProps.tint);

        // Clean up effects BEFORE stopping animation
        // This prevents effects from continuing to update values
        if (this.alphaEffect) {
            this.alphaEffect.unsubscribe();
            this.alphaEffect = null;
        }
        if (this.tintEffect) {
            this.tintEffect.unsubscribe();
            this.tintEffect = null;
        }

        // DO NOT update original values here if a flash is in progress
        // Only restore to the already-stored original values to avoid overwriting
        // with intermediate animation values when multiple flashes trigger quickly

        // Always restore to original values immediately after stopping effects
        // This ensures that if a new flash starts before the previous one completes,
        // we restore to the true original values, not the intermediate animation values
        instance.alpha = this.originalAlpha;
        const currentInstanceTint = (instance as any).tint;
        if (currentInstanceTint !== undefined) {
            // Ensure originalTint is a primitive value, not a signal
            const tintValue = typeof this.originalTint === 'number' ? this.originalTint : 0xffffff;
            // Handle both signal and primitive tint
            if (isSignal(currentInstanceTint)) {
                currentInstanceTint.set(tintValue);
            } else {
                (instance as any).tint = tintValue;
            }
        }

        // Call onStart callback early, before async operations
        flashProps.onStart?.();

        // Stop any existing animation after cleanup and callback
        if (this.progressSignal) {
            // Stop the animation immediately and wait for completion
            await this.progressSignal.set(0, { duration: 0 });
        }

        // Store current flash configuration for use in effect
        const flashConfig = {
            type,
            duration,
            cycles,
            flashAlpha,
            flashTint,
        };
        this.currentFlashConfig = flashConfig;

        // Create or recreate progress signal for flash animation
        // Note: We already stopped the previous animation above, so we can reuse the signal
        if (!this.progressSignal) {
            this.progressSignal = animatedSignal(0, {
                duration: duration,
                ease: (t) => t, // Linear ease
            });
        }
        // Signal is already reset to 0 above if it existed, no need to reset again

        // Store references to the effects we're creating to verify they're still active later
        const expectedAlphaEffect = type === 'alpha' || type === 'both';
        const expectedTintEffect = type === 'tint' || type === 'both';

        // Create effect to update alpha based on progress
        if (type === 'alpha' || type === 'both') {
            this.alphaEffect = effect(() => {
                if (!instance || !this.progressSignal || !this.currentFlashConfig) return;

                const progress = this.progressSignal();
                const config = this.currentFlashConfig;
                
                // Calculate flash value based on cycles
                // Each cycle goes from 0 to 1, so we use modulo to repeat
                const cycleProgress = (progress * config.cycles) % 1;
                
                // Create flash effect: fade to flashAlpha then back to original
                // For each cycle, we flash twice (on/off)
                const flashPhase = cycleProgress < 0.5 
                    ? cycleProgress * 2  // Fade to flashAlpha (0 to 1)
                    : 1 - ((cycleProgress - 0.5) * 2); // Fade back to original (1 to 0)
                
                // Interpolate between original and flash alpha
                const currentAlpha = this.originalAlpha + (config.flashAlpha - this.originalAlpha) * flashPhase;
                instance.alpha = currentAlpha;
            }).subscription;
        }

        // Create effect to update tint based on progress
        if (type === 'tint' || type === 'both') {
            this.tintEffect = effect(() => {
                if (!instance || !this.progressSignal || !this.currentFlashConfig) return;
                
                // Get current tint value - handle both signal and primitive
                const currentTint = (instance as any).tint;
                if (currentTint === undefined) return;
                
                // Check if tint is a signal
                const tintIsSignal = isSignal(currentTint);
                
                const progress = this.progressSignal();
                const config = this.currentFlashConfig;
                
                // Calculate flash value based on cycles
                const cycleProgress = (progress * config.cycles) % 1;
                
                // Create flash effect: change to flashTint then back to original
                const flashPhase = cycleProgress < 0.5 
                    ? cycleProgress * 2  // Change to flashTint (0 to 1)
                    : 1 - ((cycleProgress - 0.5) * 2); // Change back to original (1 to 0)
                
                // Interpolate between original and flash tint
                // Simple linear interpolation for RGB values
                const r1 = (this.originalTint >> 16) & 0xff;
                const g1 = (this.originalTint >> 8) & 0xff;
                const b1 = this.originalTint & 0xff;
                
                const r2 = (config.flashTint >> 16) & 0xff;
                const g2 = (config.flashTint >> 8) & 0xff;
                const b2 = config.flashTint & 0xff;
                
                const r = Math.round(r1 + (r2 - r1) * flashPhase);
                const g = Math.round(g1 + (g2 - g1) * flashPhase);
                const b = Math.round(b1 + (b2 - b1) * flashPhase);
                
                const newTintValue = (r << 16) | (g << 8) | b;
                
                // Handle both signal and primitive tint
                if (tintIsSignal) {
                    currentTint.set(newTintValue);
                } else {
                    (instance as any).tint = newTintValue;
                }
            }).subscription;
        }

        // Start animation and wait for completion
        await this.progressSignal.set(1, {
            duration: duration,
        });

        // Animation completed - clean up and call callbacks
        // Only restore and clean up if this flash is still the active one
        // If currentFlashConfig has changed, it means a new flash has started
        const isStillActive = this.currentFlashConfig === flashConfig;

        if (isStillActive && instance) {
            // Restore original values
            instance.alpha = this.originalAlpha;
            const currentTint = (instance as any).tint;
            if (currentTint !== undefined) {
                // Ensure originalTint is a primitive value, not a signal
                const tintValue = typeof this.originalTint === 'number' ? this.originalTint : 0xffffff;
                // Handle both signal and primitive tint
                if (isSignal(currentTint)) {
                    currentTint.set(tintValue);
                } else {
                    (instance as any).tint = tintValue;
                }
            }
            
            // Clean up effects
            if (this.alphaEffect) {
                this.alphaEffect.unsubscribe();
                this.alphaEffect = null;
            }
            if (this.tintEffect) {
                this.tintEffect.unsubscribe();
                this.tintEffect = null;
            }
            
            // Clear flash config
            this.currentFlashConfig = null;
        }
        
        // Call onComplete callback
        flashProps.onComplete?.();
    }

    /**
     * Updates the flash directive when props change
     * @param props - Updated props
     */
    onUpdate(props: any) {
        // Re-mount if props change significantly
        if (props.type && props.type === 'reset') {
            this.onDestroy();
            if (this.elementRef) {
                this.onMount(this.elementRef);
            }
        }
    }

    /**
     * Cleans up the flash directive
     */
    onDestroy() {
        // Stop any running animation by resetting progress
        if (this.progressSignal) {
            this.progressSignal.set(0, { duration: 0 });
            this.progressSignal = null;
        }

        // Clean up effects
        if (this.alphaEffect) {
            this.alphaEffect.unsubscribe();
            this.alphaEffect = null;
        }
        if (this.tintEffect) {
            this.tintEffect.unsubscribe();
            this.tintEffect = null;
        }

        // Clear flash config
        this.currentFlashConfig = null;

        // Restore original values
        if (this.elementRef?.componentInstance) {
            const instance = this.elementRef.componentInstance;
            instance.alpha = this.originalAlpha;
            const currentTint = (instance as any).tint;
            if (currentTint !== undefined) {
                // Ensure originalTint is a primitive value, not a signal
                const tintValue = typeof this.originalTint === 'number' ? this.originalTint : 0xffffff;
                // Handle both signal and primitive tint
                if (isSignal(currentTint)) {
                    currentTint.set(tintValue);
                } else {
                    (instance as any).tint = tintValue;
                }
            }
        }

        // Clean up subscription
        if (this.flashSubscription) {
            this.flashSubscription = null;
        }

        this.elementRef = null;
    }
}

registerDirective('flash', Flash);

