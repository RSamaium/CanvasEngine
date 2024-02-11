import Stats from 'stats.js'
import { computed, signal } from './packages/engine/signal';
import { cond, h, loop, render } from './packages';

const x = signal(100);
const sprites = signal([
    { x: 100, y: 100 },
    { x: 200, y: 100 },
])
const bool = signal(true)




// const Game = engine.h('Container', {
//     children: [
//         engine.loop(sprites, (sprite) => {
//             return engine.h('Rectangle', {
//                 x: [(x) => x, [sprite.x]],
//                 y: [(y) => y, [sprite.y]],
//                 key: Math.random()
//             })
//         }),
//         engine.h('Rectangle', {
//             x: 100,
//             y: 100,
//             click
//         })
//         /*engine.cond(() => {
//             return engine.h('Rectangle', {
//                 x: [(x) => x, [x]],
//                 y: [(y) => y, [y]],
//                 click
//             })
//         }, ([bool]) => bool, [bool]),
//         engine.cond(() => {
//             return engine.h('Rectangle', {
//                 x: 100,
//                 y: 100,
//                 click
//             })
//         }, ([bool]) => !bool, [bool])*/
//     ]
// });


render(
    h('Canvas', {
        children: [
            cond(bool, () => {
                return h('Graphic', {
                    color: 0xFF0000,
                })
            }),
        ]
    })
)

setInterval(() => {
    //sprites()[0].x++
}, 2000)