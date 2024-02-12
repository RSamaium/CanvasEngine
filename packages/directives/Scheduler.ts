import * as Utils from '../engine/utils'
import Stats from 'stats.js'
import { Directive, registerDirective } from '../engine/directive';
import { Element } from '../engine/reactive';
import { WritableSignal, signal } from '../engine/signal';

export class Scheduler extends Directive {
    private maxFps?: number
    private fps: number = 60
    private deltaTime: number = 0
    public frame: number = 0
    private timestamp: number = 0
    private requestedDelay: number = 0
    private lastTimestamp: number = 0
    private _stop: boolean = false
    private tick: WritableSignal<{
        timestamp: number
        deltaTime: number
        frame: number
        deltaRatio: number
    } | null>
    
    private stats = new Stats()

    onInit(element: Element) { 
        this.tick = element.propObservables?.tick as any
        this.start()
    }

    onDestroy() { }
    onMount(element: Element) { }
    onUpdate(props: any) { }

    nextTick(timestamp: number) {
        this.lastTimestamp = this.lastTimestamp || this.timestamp // first
        this.deltaTime = Utils.preciseNow() - this.timestamp
        this.timestamp = timestamp
        this.stats.begin()
        this.tick.set({
            timestamp: this.timestamp,
            deltaTime: this.deltaTime,
            frame: this.frame,
            deltaRatio: ~~this.deltaTime / ~~Utils.fps2ms(this.fps)
        })
        this.stats.end()
        this.lastTimestamp = this.timestamp
        this.frame++
    }

    private showPanel() {
        this.stats.showPanel(0)
        document.body.appendChild( this.stats.dom );
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
        if (options.maxFps) this.maxFps = options.maxFps
        if (options.fps) this.fps = options.fps
        if (options.delay) this.requestedDelay = options.delay
        this.showPanel()
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
    }
}

registerDirective('tick', Scheduler)