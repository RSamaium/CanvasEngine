import { WritableSignal } from '@signe/reactive';
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import * as Utils from '../engine/utils';

export interface Tick {
    timestamp: number
    deltaTime: number
    frame: number
    deltaRatio: number
}

export class Scheduler extends Directive {
    private maxFps?: number
    private fps: number = 60
    private deltaTime: number = 0
    public frame: number = 0
    private timestamp: number = 0
    private requestedDelay: number = 0
    private lastTimestamp: number = 0
    private _stop: boolean = false
    private running: boolean = false
    private tick: WritableSignal<Tick | null>
    
    onInit(element: Element) { 
        this.tick = element.propObservables?.tick as any
    }

    onDestroy() {
        this.stop()
    }
    onMount(element: Element) { }
    onUpdate(props: any) { }

    nextTick(timestamp: number) {
        const now = (typeof timestamp === "number" && timestamp > 0)
            ? timestamp
            : Utils.preciseNow()
        if (this.lastTimestamp === 0) {
            this.lastTimestamp = now
            this.deltaTime = 0
        } else {
            this.deltaTime = now - this.lastTimestamp
            this.lastTimestamp = now
        }
        this.timestamp = now
        this.tick.set({
            timestamp: this.timestamp,
            deltaTime: this.deltaTime,
            frame: this.frame,
            deltaRatio: ~~this.deltaTime / ~~Utils.fps2ms(this.fps)
        })
        this.lastTimestamp = this.timestamp
        this.frame++
    }
    /**
     * start the schedule
     * @return {Scheduler} returns this scheduler instance
     */
    start(options: {
        maxFps?: number
        fps?: number,
        delay?: number
    } = {}) {
        if (this.running) return this
        this._stop = false
        this.running = true
        if (options.maxFps) this.maxFps = options.maxFps
        if (options.fps) this.fps = options.fps
        if (options.delay) this.requestedDelay = options.delay
        const requestAnimationFrame = (fn: (timestamp: number) => void) => {
            if (Utils.isBrowser()) {
                window.requestAnimationFrame(fn.bind(this))
            }
            else {
                setTimeout(() => {
                    this.requestedDelay = 0
                    fn(Utils.preciseNow())
                }, Utils.fps2ms(this.fps) + this.requestedDelay)
            }
        }

        if (!this.maxFps) {
            const loop = (timestamp: number) => {
                if (this._stop) return
                requestAnimationFrame(loop)
                this.nextTick(timestamp)
            }
            requestAnimationFrame(loop)
        }
        else {
            const msInterval = Utils.fps2ms(this.maxFps)
            let now = Utils.preciseNow()
            let then = Utils.preciseNow()
            const loop = (timestamp: number) => {
                if (this._stop) return
                requestAnimationFrame(loop)
                now = Utils.preciseNow()
                const elapsed = now - then
                if (elapsed > msInterval) {
                    then = now - (elapsed % msInterval)
                    this.nextTick(timestamp)
                }
            }
            requestAnimationFrame(loop)
        }

        return this;
    }

    stop() {
        this._stop = true
        this.running = false
    }
}

registerDirective('tick', Scheduler)
