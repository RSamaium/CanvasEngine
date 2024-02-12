import Stats from 'stats.js'
import { computed, signal } from './packages/engine/signal';
import { cond, h, loop, render } from './packages';
import { animate } from "popmotion"


const x = signal(100);
const sprites = signal([
    { x: 100, y: 100 },
    { x: 200, y: 100 },
])
const bool = signal(true)
const color = signal('#00ff00')



function Rectangle({ color, x }) {
    return h('Graphic', {
        color,
        x,
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

render(
    h('Canvas', {
        children: [
            Rectangle({ color, x })
        ]
    })
)
