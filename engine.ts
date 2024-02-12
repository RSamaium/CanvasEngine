import Stats from 'stats.js'
import { computed, signal } from './packages/engine/signal';
import { Canvas, Container, cond, h, isPrimitive, loop } from './packages';
import { animate } from "popmotion"


const x = signal(100);
const sprites = signal([
    { x: 100, y: 100 },
    { x: 200, y: 100 },
])
const bool = signal(true)
const color = signal('#00ff00')

const useProps = (props): any => {
    const obj = {}
    for (let key in props) {
        const value = props[key]
        obj[key] = isPrimitive(value) ? signal(value) : value
    }
    return obj
}

function Rectangle(props) {
    const { color } = useProps(props)
    return h('Graphic', {
        color,
        click: () => {
            animate({
                from: color(), to: '#0000ff',
                onUpdate: latest => {
                    color.set(latest)
                }
            })

        },
        draw: (g) => {
            g.clear()
            g.beginFill(color())
            g.drawRect(0, 0, 100, 100)
            g.endFill()
        }
    })
}

Canvas({
    width: 600,
    height: 300,
    children: [
        Container({
            flexDirection: 'row',
            children: [
                Rectangle({ color }),
                Rectangle({ color: '#ff0000' })
            ]
        })
    ]
})