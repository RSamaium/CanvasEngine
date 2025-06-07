import { effect } from '@signe/reactive';
import { Howl } from 'howler';
import { Container } from 'pixi.js';
import { Subscription } from 'rxjs';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { calculateDistance, error } from '../engine/utils';

const EVENTS = ['load', 'loaderror', 'playerror', 'play', 'end', 'pause', 'stop', 'mute', 'volume', 'rate', 'seek', 'fade', 'unlock']

/**
 * Sound directive for playing audio with support for spatial audio and multiple sound sources
 * 
 * This directive manages audio playback using Howler.js library. It supports:
 * - Single or multiple sound sources
 * - Spatial audio with distance-based volume calculation
 * - All standard audio controls (play, pause, volume, etc.)
 * - Event handling for audio lifecycle
 * 
 */
export class Sound extends Directive {
    private sounds: Howl[] = []
    private eventsFn: ((...args: any[]) => void)[] = []
    private maxVolume: number = 1
    private maxDistance: number = 100
    private tickSubscription?: Subscription 

    onInit(element: Element<Container>) { }

    onMount(element: Element<Container>) {
        const { props } = element
        const tick = props.context.tick
        const propsSound = props.sound.value ?? props.sound

        // Check if src is null or undefined
        if (!propsSound.src) {
            return
        }

        const { src, autoplay, loop, volume, spatial } = propsSound
        
        // Handle multiple sources
        const sources = Array.isArray(src) ? src : [src]

        // Create Howl instances for each source
        for (const source of sources) {
            if (!source) continue // Skip null/undefined sources
            
            const sound = new Howl({
                src: source,
                autoplay,
                loop,
                volume
            })
 
            // Add event listeners for each sound
            for (let event of EVENTS) {
                if (!propsSound[event]) continue
                const fn = propsSound[event]
                this.eventsFn.push(fn)
                sound.on(event, fn);
            }
            
            this.sounds.push(sound)
        }

        // Setup spatial audio if enabled
        if (spatial && this.sounds.length > 0) {
            const { soundListenerPosition } = props.context
            if (!soundListenerPosition) {
                throw new error('SoundListenerPosition directive is required for spatial sound in component parent')
            }
            const { x: listenerX, y: listenerY } = soundListenerPosition
            this.tickSubscription = effect(() => {
                tick()
                const { x, y } = element.componentInstance
                const distance = calculateDistance(x, y, listenerX(), listenerY());
                const volume = Math.max(this.maxVolume - (distance / this.maxDistance), 0)
                
                // Apply volume to all sounds
                this.sounds.forEach(sound => sound.volume(volume))
            }).subscription
        }

        this.onUpdate(propsSound)
    }

    onUpdate(props: any) {
        const soundProps = props.value ?? props
        const { volume, loop, mute, seek, playing, rate, spatial } = soundProps
        // Apply updates to all sounds
        this.sounds.forEach(sound => {
            if (volume !== undefined) sound.volume(volume)
            if (loop !== undefined) sound.loop(loop)
            if (mute !== undefined) sound.mute(mute)
            if (seek !== undefined) sound.seek(seek)
            if (playing !== undefined) {
                if (playing) sound.play()
                else sound.pause()
            }
            if (rate !== undefined) sound.rate(rate)
        })
        
        // Update spatial audio settings
        if (spatial) {
            this.maxVolume = spatial.maxVolume ?? this.maxVolume
            this.maxDistance = spatial.maxDistance ?? this.maxDistance
        }
    }

    onDestroy() {
        // Stop and clean up all sounds
        this.sounds.forEach(sound => {
            sound.stop()
            
            // Remove event listeners
            for (let event of EVENTS) {
                const eventFn = this.eventsFn.find(fn => fn === this.eventsFn[event])
                if (eventFn) {
                    sound.off(event, eventFn);
                }
            }
        })
        
        this.sounds = []
        this.eventsFn = []
        this.tickSubscription?.unsubscribe()
    }
}

/**
 * SoundListenerPosition directive for spatial audio
 * 
 * This directive provides the listener position for spatial audio calculations.
 * It should be placed on a parent component that contains spatial sound sources.
 * 
 * @example
 * ```tsx
 * <Player soundListenerPosition={{ x: playerX, y: playerY }}>
 *   <Enemy sound={{ src: 'growl.mp3', spatial: { maxDistance: 100 } }} />
 * </Player>
 * ```
 */
class SoundListenerPosition extends Directive {
    onMount(element: Element<any>) {
        element.props.context.soundListenerPosition = element.propObservables?.soundListenerPosition
    }
    onInit(element: Element<any>) { }
    onUpdate(props: any) { }
    onDestroy() { }
}

registerDirective('sound', Sound)
registerDirective('soundListenerPosition', SoundListenerPosition)