import { effect } from '@signe/reactive';
import { Howl } from 'howler';
import { Container } from 'pixi.js';
import { Subscription } from 'rxjs';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { calculateDistance, error } from '../engine/utils';

const EVENTS = ['load', 'loaderror', 'playerror', 'play', 'end', 'pause', 'stop', 'mute', 'volume', 'rate', 'seek', 'fade', 'unlock']

export class Sound extends Directive {
    private sound: Howl
    private eventsFn: ((...args: any[]) => void)[] = []
    private maxVolume: number = 1
    private maxDistance: number = 100
    private tickSubscription?: Subscription 

    onInit(element: Element<Container>) { }

    onMount(element: Element<Container>) {
        const { props } = element
        const tick = props.context.tick
        const { src, autoplay, loop, volume, spatial } = props.sound
        this.sound = new Howl({
            src,
            autoplay,
            loop,
            volume
        })
        for (let event of EVENTS) {
            if (!props.sound[event]) continue
            const fn = props.sound[event]
            this.eventsFn.push(fn)
            this.sound.on(event, fn);
        }

        if (spatial) {
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
                this.sound.volume(volume)
            }).subscription
        }
    }

    onUpdate(props: any) {
        const { volume, loop, mute, seek, playing, rate, spatial } = props
        if (volume != undefined) this.sound.volume(volume)
        if (loop != undefined) this.sound.loop(loop)
        if (mute != undefined) this.sound.mute(mute)
        if (seek != undefined) this.sound.seek(seek)
        if (playing != undefined) {
            if (playing) this.sound.play()
            else this.sound.pause()
        }
        if (spatial) {
            this.maxVolume = spatial.maxVolume ?? this.maxVolume
            this.maxDistance = spatial.maxDistance ?? this.maxDistance
        }
        if (rate != undefined) this.sound.rate(rate)
    }

    onDestroy() {
        this.sound.stop()
        this.tickSubscription?.unsubscribe()
        for (let event of EVENTS) {
            if (this.eventsFn[event]) {
                this.sound.off(event, this.eventsFn[event]);
            }
        }
    }
}

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