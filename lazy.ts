import { Graphics, h } from "./packages";

export function Component() {
    return h(Graphics, {
        draw: (g) => {
            g.clear()
            g.beginFill(0xff0000)
            g.drawRect(0, 0, 100, 100)
            g.endFill()
        }
    })
} 