import { Container, Point } from 'pixi.js';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { effect } from '@signe/reactive';
import { on, isTrigger, Trigger } from '../engine/trigger';
import { useProps } from '../hooks/useProps';
import { SignalOrPrimitive } from '../components/types';
import { animatedSignal, AnimatedSignal } from '../engine/animation';
import { Subscription } from 'rxjs';

export type ShakeProps = {
    /**
     * Trigger that activates the shake animation
     * When the trigger is activated, the shake animation will start
     */
    trigger?: Trigger<any>;
    /**
     * Intensity of the shake effect (in pixels)
     * @default 10
     */
    intensity?: SignalOrPrimitive<number>;
    /**
     * Duration of the shake animation in milliseconds
     * @default 500
     */
    duration?: SignalOrPrimitive<number>;
    /**
     * Number of shake oscillations during the animation
     * Higher values create more rapid shaking
     * @default 10
     */
    frequency?: SignalOrPrimitive<number>;
    /**
     * Direction of the shake: 'x', 'y', or 'both'
     * @default 'both'
     */
    direction?: SignalOrPrimitive<'x' | 'y' | 'both'>;
    /**
     * Callback function called when shake starts
     */
    onStart?: () => void;
    /**
     * Callback function called when shake completes
     */
    onComplete?: () => void;
}

/**
 * Shake directive that animates a display object's position when a trigger is activated.
 * Creates a shake effect by rapidly oscillating the x and/or y position.
 * 
 * @example
 * ```typescript
 * // Basic usage with trigger
 * const shakeTrigger = trigger();
 * 
 * onMount(element) {
 *   // Element will shake when trigger is activated
 *   element.props.shake = { trigger: shakeTrigger };
 * }
 * 
 * // Trigger the shake
 * shakeTrigger.start();
 * ```
 */
export class Shake extends Directive {
    private elementRef: Element<Container> | null = null;
    private originalPosition: Point = new Point();
    private progressSignal: AnimatedSignal<number> | null = null;
    private shakeSubscription: any = null;
    private positionEffect: Subscription | null = null;
    private currentShakeConfig: {
        intensity: number;
        frequency: number;
        direction: 'x' | 'y' | 'both';
        randomSeed: number;
    } | null = null;

    /**
     * Initializes the shake directive
     * @param element - The element to attach the shake effect to
     */
    onInit(element: Element<Container>) {
        this.elementRef = element;
    }

    /**
     * Mounts the shake directive and sets up trigger listener
     * @param element - The element being mounted
     */
    onMount(element: Element<Container>) {
        const instance = element.componentInstance;
        if (!instance) return;

        const shakeProps = this.shakeProps;
        
        // Check if trigger is provided
        if (!shakeProps.trigger || !isTrigger(shakeProps.trigger)) {
            return;
        }

        // Store original position
        this.originalPosition.set(instance.position.x, instance.position.y);

        // Listen to trigger activation
        this.shakeSubscription = on(shakeProps.trigger, async (data) => {
            await this.performShake(data);
        });
    }

    /**
     * Gets the shake props with default values
     * @returns ShakeProps with defaults applied
     */
    get shakeProps(): ShakeProps {
        const shake = this.elementRef?.props.shake;
        return useProps(shake?.value ?? shake, {
            intensity: 10,
            duration: 500,
            frequency: 10,
            direction: 'both',
        });
    }

    /**
     * Performs the shake animation using animatedSignal
     * @param data - Optional data passed from the trigger that can override default options
     */
    private async performShake(data?: any): Promise<void> {
        if (!this.elementRef?.componentInstance) return;

        const instance = this.elementRef.componentInstance;
        const shakeProps = this.shakeProps;
        
        // Use data from trigger to override defaults if provided
        const intensity = data?.intensity ?? shakeProps.intensity();
        const duration = data?.duration ?? shakeProps.duration();
        const frequency = data?.frequency ?? shakeProps.frequency();
        const direction = data?.direction ?? shakeProps.direction();

        // Stop any existing animation and clean up
        if (this.positionEffect) {
            this.positionEffect.unsubscribe();
            this.positionEffect = null;
        }

        // Reset position to original before starting new shake
        this.originalPosition.set(instance.position.x, instance.position.y);
        instance.position.x = this.originalPosition.x;
        instance.position.y = this.originalPosition.y;

        // Call onStart callback
        shakeProps.onStart?.();

        // Store current shake configuration for use in effect
        this.currentShakeConfig = {
            intensity,
            frequency,
            direction,
            randomSeed: Math.random() * 1000, // Fixed random seed for this shake
        };

        // Create or recreate progress signal for shake animation
        // We recreate it to ensure a fresh animation state
        if (this.progressSignal) {
            // Reset to 0 immediately without animation
            this.progressSignal.set(0, { duration: 0 });
            // Wait a bit to ensure the reset is complete
            await new Promise(resolve => setTimeout(resolve, 0));
        } else {
            this.progressSignal = animatedSignal(0, {
                duration: duration,
                ease: (t) => t, // Linear ease, we'll handle oscillation in effect
            });
        }

        const shakeX = direction === 'y' ? false : true;
        const shakeY = direction === 'x' ? false : true;

        // Create effect to update position based on progress
        this.positionEffect = effect(() => {
            if (!instance || !this.progressSignal || !this.currentShakeConfig) return;

            const progress = this.progressSignal();
            const config = this.currentShakeConfig;
            
            // Calculate decay factor (shake intensity decreases over time)
            const decay = 1 - progress;
            
            // Generate oscillation based on progress and frequency
            // progress goes from 0 to 1, so we multiply by frequency to get oscillations
            const time = progress * config.frequency;
            const oscillation = Math.sin(time * Math.PI * 2);
            
            // Apply shake with decay and consistent random variation
            // Use the stored random seed for consistency during this shake
            const randomValue = (Math.sin(config.randomSeed + progress * 10) * 0.25 + 1); // Between 0.75 and 1.25
            const offsetX = shakeX ? oscillation * config.intensity * decay * randomValue : 0;
            const offsetY = shakeY ? oscillation * config.intensity * decay * randomValue : 0;

            // Update position
            instance.position.x = this.originalPosition.x + offsetX;
            instance.position.y = this.originalPosition.y + offsetY;
        }).subscription;

        // Start animation and wait for completion
        // Note: animatedSignal.set() replaces onComplete with resolve, so we call onComplete after await
        await this.progressSignal.set(1, {
            duration: duration,
        });

        // Animation completed - clean up and call callbacks
        // Reset to original position
        if (instance) {
            instance.position.x = this.originalPosition.x;
            instance.position.y = this.originalPosition.y;
        }
        
        // Clean up position effect
        if (this.positionEffect) {
            this.positionEffect.unsubscribe();
            this.positionEffect = null;
        }
        
        // Clear shake config
        this.currentShakeConfig = null;
        
        // Call onComplete callback
        shakeProps.onComplete?.();
    }

    /**
     * Updates the shake directive when props change
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
     * Cleans up the shake directive
     */
    onDestroy() {
        // Stop any running animation by resetting progress
        if (this.progressSignal) {
            this.progressSignal.set(0, { duration: 0 });
            this.progressSignal = null;
        }

        // Clean up position effect
        if (this.positionEffect) {
            this.positionEffect.unsubscribe();
            this.positionEffect = null;
        }

        // Clear shake config
        this.currentShakeConfig = null;

        // Reset position to original
        if (this.elementRef?.componentInstance) {
            const instance = this.elementRef.componentInstance;
            instance.position.x = this.originalPosition.x;
            instance.position.y = this.originalPosition.y;
        }

        // Clean up subscription
        if (this.shakeSubscription) {
            this.shakeSubscription = null;
        }

        this.elementRef = null;
    }
}

registerDirective('shake', Shake);

