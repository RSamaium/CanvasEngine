import { BehaviorSubject, Observable, combineLatest, map, switchMap, tap } from 'rxjs';
import { autoDetectRenderer, Container, Graphics } from 'pixi.js';
import Stats from 'stats.js'

class CanvasEngine {
    constructor() {
        this.components = {};
    }

    registerComponent(name, component) {
        this.components[name] = component;
    }

    /**
 * Creates a virtual DOM element or a representation thereof.
 *
 * @param {string} tag - The tag name of the element to create.
 * @param {Object} props - An object containing properties for the element. Each property can either be a value
 *                         or an array where the first element is a function that returns a value based on input
 *                         parameters, and the second element is an array of BehaviorSubjects.
 * @returns {Object} An object representing the created element, including tag name and properties.
 */
    /**
     * Creates a virtual DOM element or a representation thereof, with properties that can be dynamically updated based on BehaviorSubjects.
     *
     * @param {string} tag - The tag name of the element to create.
     * @param {Object} props - An object containing properties for the element. Each property can either be a direct value
     *                         or an array where the first element is a function that returns a value based on input parameters,
     *                         and the second element is an array of BehaviorSubjects. The property is updated dynamically
     *                         using the combineLatest RxJS operator to wait for all BehaviorSubjects to emit.
     * @returns {Object} An object representing the created element, including tag name and dynamic properties.
     */
    h(tag, props) {
        const instance = new this.components[tag]();
        const element = { tag, props: {}, componentInstance: instance, reactive: null };

        const reactiveAllProps = []

        // Iterate over each property in the props object
        Object.entries(props).forEach(([key, value]) => {
            if (Array.isArray(value) && value[0] instanceof Function && Array.isArray(value[1])) {
                // Extract the function and BehaviorSubjects array
                const [fn, subjects] = value;

                // Use combineLatest to wait for all BehaviorSubjects to emit before updating the property
                reactiveAllProps.push(
                    combineLatest(subjects.map(subject => subject.asObservable()))
                        .pipe(
                            map((latestValues) => {
                                element.props[key] = fn(...latestValues);
                            })
                        )
                )
            } else {
                element.props[key] = value;
            }
        });

        instance.onInit?.(element.props);

        element.reactive = combineLatest(reactiveAllProps).subscribe((propsChanged) => {
            instance.onUpdate?.(element.props);
        })

        instance.onUpdate?.(element.props);

        if (props.children) {
            props.children.forEach((child) => {
                if (child instanceof Observable) {
                    child.subscribe(({ destroyed, value: comp }) => {
                        if (destroyed) {
                            this.destroyElement(comp)
                            return
                        }
                        if (Array.isArray(comp)) {
                            comp.forEach(c => {
                                if (c.inCache) {
                                    return
                                }
                                this.insertElement(instance, c)
                            })
                            return
                        }
                        this.insertElement(instance, comp)
                    })
                }
                else
                    this.insertElement(instance, child)
            }
            );
        }

        // Return the created element representation
        return element;
    }

    destroyElement(element) {
        if (!element) {
            return
        }
        element.reactive?.unsubscribe()
        element.componentInstance.onDestroy?.(element.parent)
    }

    insertElement(parent, element) {
        element.parent = parent
        element.componentInstance.onInsert?.(parent)
    }

    /**
     * Observes a BehaviorSubject containing an array of items and dynamically creates child elements for each item.
     * 
     * @param {BehaviorSubject<Array>} itemsSubject - A BehaviorSubject that emits an array of items.
     * @param {Function} createElementFn - A function that takes an item and returns an element representation.
     * @returns {Observable} An observable that emits the list of created child elements.
     */
    loop(itemsSubject, createElementFn) {
        const cacheKeys = {}
        return itemsSubject.pipe(
            map(items => ({
                destroyed: false,
                value: items.map((item, index) => {
                    const key = item.key || index
                    if (cacheKeys[key]) {
                        return {
                            inCache: true,
                        }
                    }
                    cacheKeys[key] = true
                    return createElementFn(item)
                })
            })),
        ).asObservable()
    }

    cond(createElementFn, condition, props) {
        let element = null
        return combineLatest(props.map(subject => subject.asObservable()))
            .pipe(
                map((latestValues) => {
                    if (condition(latestValues)) {
                        const _el = createElementFn()
                        element = _el
                        return {
                            destroyed: false,
                            value: _el

                        }
                    }
                    else {
                        return {
                            destroyed: true,
                            value: element
                        }
                    }
                })
            )
    }

    render(element) {
        if (element.componentInstance.onInsert) {
            element.componentInstance.onInsert()
        }
    }
}


// Example usage
const x = new BehaviorSubject(0);
const y = new BehaviorSubject(2);
const bool = new BehaviorSubject(true);



let sprites = new BehaviorSubject([]);
const val = Array(1).fill(0).map((_, i) => {
    return { x, y: new BehaviorSubject(i * 10) }
})
sprites.next(val)

const renderer = autoDetectRenderer()
const pixiApp = new Container()

document.body.appendChild(renderer.view)

class MyContainer {
    onInit() {
        this.container = new Container();
    }

    onUpdate(props) {
        
        // this.container.x = props.x;
        // this.container.y = props.y;
    }

    onInsert() {
        pixiApp.addChild(this.container);
    }
}


class Rectangle {
    onInit(props) {
        this.graphic = new Graphics();
        this.graphic.beginFill(0xff0000);
        this.graphic.drawRect(0, 0, 10, 10);
        this.graphic.endFill();
        if (props.click) {
            this.graphic.eventMode = 'static';
            this.graphic.on('click', props.click)
        }
    }

    onUpdate(props) {
        this.graphic.x = props.x;
        this.graphic.y = props.y;
    }

    onInsert(parent) {
        parent.container.addChild(this.graphic);
    }

    onDestroy(parent) {
        parent.container.removeChild(this.graphic);
    }
}

const engine = new CanvasEngine();;

engine.registerComponent('Rectangle', Rectangle);
engine.registerComponent('Container', MyContainer);

const click = () => {
    // add new sprite
    sprites.next([...sprites.value, { x, y: new BehaviorSubject(200), key: Math.random() }])
}

const Game = engine.h('Container', {
    children: [
        engine.loop(sprites, (sprite) => {
            return engine.h('Rectangle', {
                x: [(x) => x, [sprite.x]],
                y: [(y) => y, [sprite.y]],
                key: Math.random(),
            })
        }),
        engine.h('Rectangle', {
            x: 100,
            y: 100,
            click
        })
        /*engine.cond(() => {
            return engine.h('Rectangle', {
                x: [(x) => x, [x]],
                y: [(y) => y, [y]],
                click
            })
        }, ([bool]) => bool, [bool]),
        engine.cond(() => {
            return engine.h('Rectangle', {
                x: 100,
                y: 100,
                click
            })
        }, ([bool]) => !bool, [bool])*/
    ]
});

engine.render(Game);

const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom);

setInterval(() => {
    stats.begin()
    x.next(x.value + 1);
    renderer.render(pixiApp)
    stats.end()
}, 1000)
