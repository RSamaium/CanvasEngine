import Stats from 'stats.js'
import { Canvas, Container, cond, createComponent, isPrimitive, loop, h, computed, signal, effect, Graphics, mount } from './packages';
import { animate } from "popmotion"



function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const sprites = signal(Array(10).fill(0).map((_, i) => {
    return { color: getRandomColor(), y: i * 10 }
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
            g.drawRect(0, 0, width(), height())
            g.endFill()
        }
    })
}

function MoveableRectangle(props) {
    const x = signal(0)
    const y = signal(0)
    const double = computed(() => x() * 2)

    // mount((element) => {
    //     console.log(element)
    //     return () => {
    //         console.log('unmount')
    //     }
    // })

    // effect(() => {
    //     console.log('mount', double())

    //     return () => {
    //         console.log('stop')
    //     }
    // })

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

    return Rectangle({ color: getRandomColor(), width: 100, height: 100, y, x, controls })
}

function RectangeSprite(props) {
    return h(Rectangle, {
        width: 10,
        height: 10,
        color: getRandomColor(),
        x: props.x,
        y: props.y,
        key: props.index
    })
}




h(Canvas, {
    width: 800,
    height: 600
},
    h(Rectangle, {
        color, width: 100, height: 100, x: 100, y: 100, click: () => {
            sprites().shift()
            bool.update(bool => !bool)
        }
    }),
    loop(sprites, (sprite, index) => h(RectangeSprite, {
        index,
        ...sprite
    })),
    cond(bool, () => h(MoveableRectangle, { x: 100, y: 100 })),
)