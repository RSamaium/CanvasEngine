import { Container } from 'pixi.js';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { effect } from '@signe/reactive';
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

        // Store original values
        this.originalAlpha = flashProps.originalAlpha ?? instance.alpha ?? 1;
        this.originalTint = flashProps.originalTint ?? (instance as any).tint ?? 0xffffff;

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
        const type = data?.type ?? flashProps.type();
        const duration = data?.duration ?? flashProps.duration();
        const cycles = data?.cycles ?? flashProps.cycles();
        const flashAlpha = data?.alpha ?? flashProps.alpha();
        const flashTint = data?.tint ?? flashProps.tint();

        // Store original values if not already stored
        this.originalAlpha = flashProps.originalAlpha ?? instance.alpha ?? 1;
        this.originalTint = flashProps.originalTint ?? (instance as any).tint ?? 0xffffff;

        // Stop any existing animation and clean up
        if (this.alphaEffect) {
            this.alphaEffect.unsubscribe();
            this.alphaEffect = null;
        }
        if (this.tintEffect) {
            this.tintEffect.unsubscribe();
            this.tintEffect = null;
        }

        // Restore original values before starting new flash
        instance.alpha = this.originalAlpha;
        if ((instance as any).tint !== undefined) {
            (instance as any).tint = this.originalTint;
        }

        // Call onStart callback
        flashProps.onStart?.();

        // Store current flash configuration for use in effect
        this.currentFlashConfig = {
            type,
            duration,
            cycles,
            flashAlpha,
            flashTint,
        };

        // Create or recreate progress signal for flash animation
        if (this.progressSignal) {
            // Reset to 0 immediately without animation
            this.progressSignal.set(0, { duration: 0 });
            // Wait a bit to ensure the reset is complete
            await new Promise(resolve => setTimeout(resolve, 0));
        } else {
            this.progressSignal = animatedSignal(0, {
                duration: duration,
                ease: (t) => t, // Linear ease
            });
        }

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
                if ((instance as any).tint === undefined) return;

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
                
                (instance as any).tint = (r << 16) | (g << 8) | b;
            }).subscription;
        }

        // Start animation and wait for completion
        await this.progressSignal.set(1, {
            duration: duration,
        });

        // Animation completed - clean up and call callbacks
        // Restore original values
        if (instance) {
            instance.alpha = this.originalAlpha;
            if ((instance as any).tint !== undefined) {
                (instance as any).tint = this.originalTint;
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
            if ((instance as any).tint !== undefined) {
                (instance as any).tint = this.originalTint;
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

