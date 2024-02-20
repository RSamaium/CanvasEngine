import { SpritesheetOptions, TextureOptions, AnimationFrames, FrameOptions, TransformOptions } from './types/Spritesheet'
import { Container, Sprite as PixiSprite, Rectangle, Texture } from 'pixi.js'
import { DisplayObject } from './DisplayObject'
import { arrayEquals, isFunction } from '../engine/utils'
import { createComponent, registerComponent } from '../engine/reactive'
import { Signal } from '../engine/signal'
import { Subscription } from 'rxjs'

const log = console.log

type Image = { image: string }

type TextureOptionsMerging = TextureOptions & {
    spriteWidth: number
    spriteHeight: number
    sound?: string
} & Image & TransformOptions

type FrameOptionsMerging = TextureOptionsMerging & FrameOptions
type SpritesheetOptionsMerging = TextureOptionsMerging & SpritesheetOptions
type TransformOptionsAsArray = Pick<TransformOptions, 'anchor' | 'scale' | 'skew' | 'pivot'>

type AnimationDataFrames = {
    sprites: FrameOptionsMerging[],
    frames: Texture[][],
    name: string,
    animations: AnimationFrames,
    params: any[],
    data: TextureOptionsMerging
}

export class CanvasSprite extends DisplayObject(PixiSprite) {
    public hitbox: { w: number, h: number }
    public applyTransform: (
        frame: FrameOptionsMerging,
        data: TextureOptionsMerging,
        spritesheet: SpritesheetOptionsMerging
    ) => Partial<FrameOptionsMerging>
    private spritesheet: SpritesheetOptionsMerging
    private currentAnimation: AnimationDataFrames | null = null
    private time: number = 0
    private frameIndex: number = 0
    private animations: Map<string, AnimationDataFrames> = new Map()
    private subscriptionTick: Subscription
    onFinish: () => void

    private createTextures(options: Required<TextureOptionsMerging>): Texture[][] {
        const { width, height, framesHeight, framesWidth, image, offset } = options
        const { baseTexture } = Texture.from(image)
        const spriteWidth = options.spriteWidth
        const spriteHeight = options.spriteHeight
        const frames: Texture[][] = []
        const offsetX = (offset && offset.x) || 0
        const offsetY = (offset && offset.y) || 0
        for (let i = 0; i < framesHeight; i++) {
            frames[i] = []
            for (let j = 0; j < framesWidth; j++) {
                const rectX = j * spriteWidth + offsetX
                const rectY = i * spriteHeight + offsetY
                if (rectY > height) {
                    throw log(`Warning, there is a problem with the height of the "${this.id}" spritesheet. When cutting into frames, the frame exceeds the height of the image.`)
                }
                if (rectX > width) {
                    throw log(`Warning, there is a problem with the width of the "${this.id}" spritesheet. When cutting into frames, the frame exceeds the width of the image.`)
                }
                frames[i].push(
                    new Texture(baseTexture, new Rectangle(rectX, rectY, spriteWidth, spriteHeight))
                )
            }
        }
        return frames
    }

    private createAnimations() {
        const { textures } = this.spritesheet
        if (!textures) {
            return
        }
        for (let animationName in textures) {
            const props: (keyof TextureOptionsMerging)[] = ['width', 'height', 'framesHeight', 'framesWidth', 'rectWidth', 'rectHeight', 'offset', 'image', 'sound']
            const parentObj = props
                .reduce((prev, val) => ({ ...prev, [val]: this.spritesheet[val] }), {})
            const optionsTextures: TextureOptionsMerging = {
                ...parentObj,
                ...textures[animationName]
            } as any
            const { rectWidth, width = 0, framesWidth = 1, rectHeight, height = 0, framesHeight = 1 } = optionsTextures
            optionsTextures.spriteWidth = rectWidth ? rectWidth : width / framesWidth
            optionsTextures.spriteHeight = rectHeight ? rectHeight : height / framesHeight
            this.animations.set(animationName, {
                frames: this.createTextures(optionsTextures as Required<TextureOptionsMerging>),
                name: animationName,
                animations: textures[animationName].animations,
                params: [],
                data: optionsTextures,
                sprites: []
            })
        }
    }

    onMount(params) {
        super.onMount(params)
        const { props } = params
        const tick: Signal = props.context.tick
        const sheet = props.sheet
        if (sheet?.onFinish) {
            this.onFinish = sheet.onFinish
        }
        if (sheet?.playing) {
            this.play(sheet.playing)
        }
        this.subscriptionTick = tick.observable.subscribe((value) => {
            this.update(value)
        })
    }

    onUpdate(props) {
        super.onUpdate(props)
        const sheet = props.sheet
        if (props.sheet?.definition) {
            this.spritesheet = props.sheet.definition
            this.createAnimations()
        }
        else if (props.image) {
            if (props.rectangle === undefined) {
                this.texture = Texture.from(props.image)
            }
            else {
                const { x, y, width, height } = props.rectangle
                this.texture = new Texture(Texture.from(props.image).baseTexture, new Rectangle(x, y, width, height))
            }
        }
    }

    onDestroy(): void {
        super.onDestroy()
        this.subscriptionTick.unsubscribe()
    }

    has(name: string): boolean {
        return this.animations.has(name)
    }

    get(name: string): AnimationDataFrames {
        return this.animations.get(name) as AnimationDataFrames
    }

    isPlaying(name?: string): boolean {
        if (!name) return !!this.currentAnimation
        if (this.currentAnimation == null) return false
        return this.currentAnimation.name == name
    }

    stop() {
        this.currentAnimation = null
        this.destroy()
    }

    play(name: string, params: any[] = []) {
        const animParams = this.currentAnimation?.params

        if (this.isPlaying(name) && arrayEquals(params, animParams || [])) return

        const animation = this.get(name)

        if (!animation) {
            throw new Error(`Impossible to play the ${name} animation because it doesn't exist on the ${this.id} spritesheet`)
        }

        this.removeChildren()
        animation.sprites = []
        this.currentAnimation = animation
        this.currentAnimation.params = params
        this.time = 0
        this.frameIndex = 0
        let animations: any = animation.animations;
        animations = isFunction(animations) ? (animations as Function)(...params) : animations

        this.currentAnimation.container = new Container()

        for (let container of (animations as FrameOptionsMerging[][])) {
            const sprite = new PixiSprite()
            for (let frame of container) {
                this.currentAnimation.sprites.push(frame)
            }
            this.currentAnimation.container.addChild(sprite)
        }

        const sound = this.currentAnimation.data.sound

        if (sound) {
            //RpgSound.get(sound).play()
        }

        // this.addChild(this.currentAnimation.container)
        // Updates immediately to avoid flickering
        this.update({
            deltaRatio: 1
        })
    }


    update({ deltaRatio }) {
        if (!this.isPlaying() || !this.currentAnimation) return

        const { frames, container, sprites, data } = this.currentAnimation
        let frame = sprites[this.frameIndex]
        const nextFrame = sprites[this.frameIndex + 1]

        for (let _sprite of container.children) {
            const sprite = _sprite as PixiSprite

            if (!frame || frame.frameY == undefined || frame.frameX == undefined) {
                continue
            }

            this.texture = frames[frame.frameY][frame.frameX]

            const getVal = <T extends keyof TransformOptions>(prop: T): TransformOptions[T] | undefined => {
                return frame[prop] ?? data[prop] ?? this.spritesheet[prop]
            }


            const applyTransform = <T extends keyof TransformOptionsAsArray>(prop: T): void => {
                const val = getVal<T>(prop)
                if (val) {
                    sprite[prop as string].set(...val!)
                }
            }

            function applyTransformValue<T extends keyof TransformOptions>(prop: T);
            function applyTransformValue<T extends keyof TransformOptions>(prop: string, alias: T);
            function applyTransformValue<T extends keyof TransformOptions>(prop: T, alias?: T): void {
                const optionProp = alias || prop
                const val = getVal<T>(optionProp)
                if (val !== undefined) {
                    sprite[prop as string] = val
                }
            }

            if (this.applyTransform) {
                frame = {
                    ...frame,
                    ...this.applyTransform(frame, data, this.spritesheet)
                }

            }

            const realSize = getVal<'spriteRealSize'>('spriteRealSize')
            const heightOfSprite = typeof realSize == 'number' ? realSize : realSize?.height
            const widthOfSprite = typeof realSize == 'number' ? realSize : realSize?.width

            const applyAnchorBySize = () => {
                if (heightOfSprite && this.hitbox) {
                    const { spriteWidth, spriteHeight } = data
                    const w = ((spriteWidth - this.hitbox.w) / 2) / spriteWidth
                    const gap = (spriteHeight - heightOfSprite) / 2
                    const h = (spriteHeight - this.hitbox.h - gap) / spriteHeight
                    sprite.anchor.set(w, h)
                }
            }

            if (frame.sound) {
                //RpgSound.get(frame.sound).play()
            }

            applyAnchorBySize()

            applyTransform('anchor')
            applyTransform('scale')
            applyTransform('skew')
            applyTransform('pivot')

            applyTransformValue('alpha', 'opacity')
            applyTransformValue('x')
            applyTransformValue('y')
            applyTransformValue('angle')
            applyTransformValue('rotation')
            applyTransformValue('visible')
        }

        if (!nextFrame) {
            this.time = 0
            this.frameIndex = 0
            if (this.onFinish) this.onFinish()
            return
        }

        this.time += deltaRatio

        if (this.time >= nextFrame.time) {
            this.frameIndex++
        }
    }
}

export interface CanvasSprite extends PixiSprite { }

registerComponent('Sprite', CanvasSprite)

export function Sprite(props) {
    return createComponent('Sprite', props)
}