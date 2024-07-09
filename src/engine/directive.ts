import { Element } from "./reactive"

export const directives: { [key: string]: any } = {}

export abstract class Directive {
    abstract onDestroy();
    abstract onInit(element:  Element<any>);
    abstract onMount(element: Element<any>);
    abstract onUpdate(props: any);
}

export function registerDirective(name: string, directive: any) {
    directives[name] = directive
}

export function applyDirective(element: Element, directiveName: string) {
    if (!directives[directiveName]) {
        return null
    }
    const directive = new directives[directiveName]()
    directive.onInit?.(element)
    return directive
}