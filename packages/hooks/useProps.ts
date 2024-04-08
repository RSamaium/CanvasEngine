import { isPrimitive } from "../engine/reactive"
import { isSignal, signal } from "../engine/signal"

export const useProps = (props): any => {
    if (isSignal(props)) {
        return props()
    }
    const obj = {}
    for (let key in props) {
        const value = props[key]
        obj[key] = isPrimitive(value) ? signal(value) : value
    }
    return obj
}
