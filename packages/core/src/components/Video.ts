import { Texture } from "pixi.js";
import { h, mount } from "../engine/signal";
import { useDefineProps } from "../hooks/useProps";
import { Sprite } from "./Sprite";
import { effect, Signal, signal } from "@signe/reactive";

interface VideoProps {
    source: string;
    paused?: boolean;
    loop?: boolean;
    muted?: boolean;
    loader?: {
        onComplete?: (texture: Texture) => void;
        onProgress?: (progress: number) => void;
    };
}

export function Video(props: VideoProps) {
    const eventsMap = {
        audioprocess: null,
        canplay: null,
        canplaythrough: null,
        complete: null,
        durationchange: null,
        emptied: null,
        ended: null,
        loadeddata: null,
        loadedmetadata: null,
        pause: null,
        play: null,
        playing: null,
        progress: null,
        ratechange: null,
        seeked: null,
        seeking: null,
        stalled: null,
        suspend: null,
        timeupdate: null,
        volumechange: null,
        waiting: null
    }

    const video: Signal<HTMLVideoElement | null> = signal(null)
    const defineProps = useDefineProps(props)
    const { play, loop, muted } = defineProps({
        play: {
            type: Boolean,
            default: true
        },
        loop: {
            type: Boolean,
            default: false
        },
        muted: {
            type: Boolean,
            default: false
        }
    })

    effect(() => {
        const _video = video()
        const state = play()
        if (_video && state !== undefined) {
            if (state) {
                _video.play()
            } else {
                _video.pause()
            }
        }
        if (_video && loop()) {
            _video.loop = loop()
        }
        if (_video && muted()) {
            _video.muted = muted()
        }
    })

    mount(() => {
        return () => {
            for (let event in eventsMap) {
                if (eventsMap[event]) {
                    video().removeEventListener(event, eventsMap[event])
                }
            }
        }
    })

    return h(Sprite, {
        ...props,
        image: props.source,
        loader: {
            onComplete: (texture) => {
                const source = texture.source.resource
                video.set(source)
                if (props?.loader?.onComplete) {
                    props.loader.onComplete(texture)
                }
                for (let event in eventsMap) {
                    if (props[event]) {
                        const cb = (ev) => {
                            props[event](ev)
                        }
                        eventsMap[event] = cb
                        source.addEventListener(event, cb)
                    }
                }
            }
        }
    })
}