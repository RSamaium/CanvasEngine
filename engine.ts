import Stats from 'stats.js'
import { computed, signal } from './packages/engine/signal';
import { Canvas, Container, cond, h, isPrimitive, loop } from './packages';
import { animate } from "popmotion"



function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

const sprites = signal(Array(1).fill(0).map((_, i) => {
    return {color: getRandomColor(), y: i * 10}
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
    return h('Graphic', {
        ...props,
        // click: () => {
        //     animate({
        //         from: color(), to: '#0000ff',
        //         onUpdate: latest => {
        //             color.set(latest)
        //         }
        //     })

        // },
        draw: (g) => {
            g.clear()
            g.beginFill(color())
            g.drawRect(0, 0, width(), height())
            g.endFill()
        }
    })
}

function MoveableRectangle() {
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

    return Rectangle({ color: getRandomColor(), width: 10, height: 10, y, x, controls })
}

Canvas({
    width: 800,
    height: 600,
    children: [
        Container({
            // flexDirection,
            // justifyContent: 'center',
            width: 800,
            height: 600,
            children: [
                MoveableRectangle()
            ]
        })
    ]
})