import { Element } from "../engine/reactive";
import { ComponentInstance } from "../components/DisplayObject";

export function useRef(element: Element<ComponentInstance>, ref: string): Element<ComponentInstance> | null {
    const { props } = element;
    if (props.ref == ref) {
        return element;
    }
    // Recursive search for the component with the given id
    if (props.children) {
        for (const child of props.children) {
            const result = useRef(child, ref);
            if (result) {
                return result;
            }
        }
    }

    // If not found, return undefined
    return null;
}