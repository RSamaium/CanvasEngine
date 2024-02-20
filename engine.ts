import Stats from 'stats.js'
import { Canvas, Text, Container, cond, createComponent, isPrimitive, loop, h, computed, signal, effect, Graphics, mount, Scene, Sprite, ParticlesEmitter, Viewport, TiledMap } from './packages';
import { animate } from "popmotion"



function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const RMSpritesheet = (framesWidth: number, framesHeight: number, frameStand: number = 1) => {

    if (framesWidth <= frameStand) {
        frameStand = framesWidth - 1
    }

    const stand = (direction: number) => [{ time: 0, frameX: frameStand, frameY: 0 }]
    const walk = direction => {
        const array: any = []
        const durationFrame = 10
        for (let i = 0; i < framesWidth; i++) {
            array.push({ time: i * durationFrame, frameX: i, frameY: 0 })
        }
        array.push({ time: array[array.length - 1].time + durationFrame })
        return array
    }

    return {
        textures: {
            'stand': {
                animations: direction => [stand(direction)]
            },
            'walk': {
                animations: direction => [walk(direction)]
            }
        },
        framesHeight,
        framesWidth
    }
}


const randomRange = (min, max) => Math.random() * (max - min) + min

const sprites = signal(Array(2).fill(0).map((_, i) => {
    return { color: getRandomColor(), x: randomRange(0, 32 * 20), y: randomRange(0, 32 * 20) }
}))

const bool = signal(true)
const color = signal('#00ff00')
const flexDirection = signal('row')
const tick = signal(null)

const useProps = (props): any => {
    const obj = {}
    for (let key in props) {
        const value = props[key]
        obj[key] = isPrimitive(value) ? signal(value) : value
    }
    return obj
}


function Rectangle(props) {
    const { color, width, height } = useProps(props)
    return h(Graphics, {
        ...props,
        draw: (g) => {
            g.clear()
            g.beginFill(color())
            g.drawRect(0, 0, width?.() ?? 10, height?.() ?? 10)
            g.endFill()
        }
    }, ...(props.children ?? []))
}

const x = signal(0)
const y = signal(0)

const controls = signal({
    'down': {
        repeat: true,
        bind: 'down',
        trigger() {
            y.update(y => y + 3)
        }
    },
    'up': {
        repeat: true,
        bind: 'up',
        trigger() {
            y.update(y => y - 3)
        }
    },
    'left': {
        repeat: true,
        bind: 'left',
        trigger() {
            x.update(x => x - 3)
        }
    },
    'right': {
        repeat: true,
        bind: 'right',
        trigger() {
            x.update(x => x + 3)
        }
    }
})

function MoveableSprite(props) {
    return Sprite({ image: 'hero.png', y, x, zIndex: y, controls, viewportFollow: props.viewportFollow })
}

function RectangeSprite(props) {
    return h(Rectangle, {
        width: 10,
        height: 10,
        color: getRandomColor(),
        x: props.x,
        y: props.y,
        key: props.index
    }, props.children)
}

const to = () => {
    const array: any = []
    let k = 0
    const durationFrame = 5
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            array.push({ time: k * durationFrame, frameX: j, frameY: i })
            k++
        }
    }
    // This last beat allows the last frame to be played, otherwise the animation ends abruptly at the last frame. This can be considered as the total animation time.
    array.push({ time: k * durationFrame })
    return array
}

const spritesheet = {
    id: 'shield',
    image: './animation.png',
    framesWidth: 5,
    framesHeight: 4,
    width: 960,
    height: 768,
    opacity: 1,
    anchor: [0.5],
    textures: {
        default: {
            animations: [to()]
        }
    }
}

const config = {
    "lifetime": {
        "min": 4,
        "max": 4
    },
    "ease": [
        {
            "s": 0,
            "cp": 0.379,
            "e": 0.548
        },
        {
            "s": 0.548,
            "cp": 0.717,
            "e": 0.676
        },
        {
            "s": 0.676,
            "cp": 0.635,
            "e": 1
        }
    ],
    "frequency": 0.004,
    "emitterLifetime": 0,
    "maxParticles": 10000,
    "addAtBack": false,
    "pos": {
        "x": 0,
        "y": 0
    },
    "behaviors": [
        {
            "type": "alpha",
            "config": {
                "alpha": {
                    "list": [
                        {
                            "time": 0,
                            "value": 0.73
                        },
                        {
                            "time": 1,
                            "value": 0.46
                        }
                    ]
                }
            }
        },
        {
            "type": "moveSpeedStatic",
            "config": {
                "min": 200,
                "max": 200
            }
        },
        {
            "type": "scale",
            "config": {
                "scale": {
                    "list": [
                        {
                            "time": 0,
                            "value": 0.15
                        },
                        {
                            "time": 1,
                            "value": 0.2
                        }
                    ]
                },
                "minMult": 0.5
            }
        },
        {
            "type": "rotation",
            "config": {
                "accel": 0,
                "minSpeed": 0,
                "maxSpeed": 200,
                "minStart": 50,
                "maxStart": 70
            }
        },
        {
            "type": "textureRandom",
            "config": {
                "textures": [
                    "Snow100.png"
                ]
            }
        },
        {
            "type": "spawnShape",
            "config": {
                "type": "rect",
                "data": {
                    "x": -500,
                    "y": -300,
                    "w": 900,
                    "h": 20
                }
            }
        }
    ]
}

const fontSize = signal(36)
const text = signal('Hello World')
let player = false

h(Canvas, {
    width: 800,
    height: 600,
},
    /*h(Sprite, {
        sheet: {
            definition: spritesheet,
            playing: 'default',
            onFinish: () => {
                console.log('finish')
            }
        },
        x: 200,
        y: 200
    }),*/
    h(Viewport, {
        clamp: {
            direction: 'all'
        },
        screenWidth: 800,
        screenHeight: 600,
        worldWidth: 40 * 32,
        worlHeight: 40 * 32,
    },
        h(TiledMap, {
            map: './maps/map.tmx',
            objectLayer: (layer) => {
                return h(Container, {
                    sortableChildren: true,
                    viewportCull: true,
                    soundListenerPosition: {
                        x,
                        y
                    }
                }, loop(sprites, (obj) => {
                    if (!player) {
                        player = true
                        return h(MoveableSprite)
                    }
                    return h(Sprite, {
                        sheet: {
                            /* definition: {
                                 ...RMSpritesheet(3, 4, 1),
                                 image: './hero.png',
                                 width: 96,
                                 height: 128,
                             },
                             playing: 'walk',*/

                        },
                        x: obj.x,
                        y: obj.y,
                        zIndex: obj.y,
                        image: './hero.png',
                        rectangle: {
                            width: 32,
                            height: 32,
                            x: 0,
                            y: 0
                        },
                        sound: {
                            src: './theme.ogg',
                            spatial: {
                                maxVolume: 1,
                                maxDistance: 32 * 10
                            },
                            autoplay: true
                        }
                    })
                }))
            }
        }),
    )

    /*h(Rectangle, {
        color, width: 100, height: 100, x: 100, y: 100, click: () => {
            sprites().shift()
            bool.update(bool => !bool)
        }
    }),
   
    ,*/
    //cond(bool, () => lazy)
    /*h(Container, {}, loop(sprites, (sprite, index) =>
        h(Rectangle, {
            color: getRandomColor(),
            x: 0,
            y: sprite.y
        },

            h(Container, {}, loop(signal([1]), (sprite, index) => {
                return h(Rectangle, {
                    color: getRandomColor(),
                    x: 100,
                    y: 100
                })
            }))

        )
    ))*/
)