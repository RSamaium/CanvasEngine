interface Example {
    title: string;
    description: string;
    files: Record<string, string>;
}

const examples: Example[] = [{
    title: 'Hello World',
    description: 'A simple example of how to use CanvasEngine',
    files: {
        "app.ce": `
<Canvas 
    backgroundColor="#fff" 
    width="100%" 
    height="100%" 
    antialias="true"
    >
    <Container
        width="100%" 
        height="100%" 
        justifyContent="center"
        alignItems="center">
        <HelloWorld text="CanvasEngine" color="black" />
    </Container>
</Canvas>

<script>
    import HelloWorld from "./hello.ce";
</script>
        `,
        "hello.ce": `<Text text="Hello World" size={70} fontFamily="Helvetica" x={50} y={40} />`,
    },
}, {
    title: 'Tiled Map',
    description: 'Example of using a Tiled map in CanvasEngine',
    files: {
        "app.ce": `
<Canvas>
    <TiledMap 
        map={map} 
        createLayersPerTilesZ={true} 
        basePath="/map" 
        objectLayer={(layer) => <Rect width={32} height={32} color="red" />} 
    />
</Canvas>

<script>
    import { TiledMap } from '@canvasengine/presets'
    import { signal } from 'canvasengine'
    
    let map = signal(null)
    
    fetch('/map/simplemap.tmx')
        .then((res) => res.text())
        .then((text) => {
            map.set(text)
        })
</script>
        `,
    },
}, {
    title: 'Drag and Drop',
    description: 'Example of using drag and drop in CanvasEngine',
    files: {
        "app.ce": `
<Canvas>
    <Container>
        <Rect width={100} height={100} color="red" drag />
    </Container>
</Canvas>

<script>
const drag = {
  direction: 'all', // 'all', 'x', or 'y'
  start() {
    console.log("Drag started");
  },
  move(event) {
    console.log("Dragging", event.global.x, event.global.y);
  },
  end() {
    console.log("Drag ended");
  }
};
</script>

        `,
    },
},
{
    title: 'Sprite Animation',
    description: 'Example of using sprite animation in CanvasEngine',
    files: {
        "app.ce": `
<Canvas>
    <Container>
        <Sprite 
            sheet={{
                definition,
                playing: "default"
            }}
        />
    </Container>
</Canvas>

<script>
const definition = {
    id: "explosion",
    image: "./exp.png",
    width: 1024,
    height: 1024,
    framesWidth: 4,
    framesHeight: 4,
    textures: {
        default: {
             animations: () => [
                [ 
                    { time: 0, frameX: 0, frameY: 0 },
                    { time: 10, frameX: 1, frameY: 0 },
                    { time: 20, frameX: 2, frameY: 0 },
                    { time: 30, frameX: 3, frameY: 0 },
                    { time: 40, frameX: 0, frameY: 1 },
                    { time: 50, frameX: 1, frameY: 1 },
                    { time: 60, frameX: 2, frameY: 1 },     
                    { time: 70, frameX: 3, frameY: 1 },
                    { time: 80, frameX: 0, frameY: 2 },
                    { time: 90, frameX: 1, frameY: 2 },
                    { time: 100, frameX: 2, frameY: 2 },
                    { time: 110, frameX: 3, frameY: 2 },
                    { time: 120, frameX: 0, frameY: 3 },
                    { time: 130, frameX: 1, frameY: 3 },
                    { time: 140, frameX: 2, frameY: 3 },
                    { time: 150, frameX: 3, frameY: 3 },
                ]
             ]
        }
    }
}

</script>

        `,
    },
},
{
    title: 'Reactivity',
    description: 'Example of using reactivity in CanvasEngine',
    files: {
        "app.ce": `
<Canvas>
    <Container flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%">
        <Text text="Click Me" color="white" size={50} click />
        <Text text={counter} color="white" size={70} />
        <Text text={double} color="white" size={70} />
    </Container>
</Canvas>

<script>
import { signal, computed, effect } from 'canvasengine'

const counter = signal(0)
const double = computed(() => counter() * 2)

effect(() => {
    console.log(counter())
})

const click = () => {
    counter.update(c => c + 1)
}
</script>

        `,
    },
},

{
    title: 'Sprite Animation',
    description: 'Example of using sprite animation in CanvasEngine',
    files: {
        "app.ce": `
<Canvas>
    <Container>
        <Sprite 
            sheet={{
                definition,
                playing: "default"
            }}
        />
    </Container>
</Canvas>

<script>
import { spritesheet } from "./spritesheet.js"

const definition = {
    id: "hero",
    image: "./hero.png",
    width: 96,
    height: 128,
    ...spritesheet(4, 4)
}

</script>

        `,
        "spritesheet.js": `
export const spritesheet = (framesWidth, framesHeight, frameStand = 1) => {

    if (framesWidth <= frameStand) {
        frameStand = framesWidth - 1
    }

    const frameY = direction => {
        const gap = Math.max(4 - framesHeight, 0)
        return {
            'down': 0,
            'left': Math.max(0, 1 - gap),
            'right': Math.max(0, 2 - gap),
            'up': Math.max(0, 3 - gap)
        }[direction]
    }

    const stand = (direction) => [{ time: 0, frameX: frameStand, frameY: frameY(direction) }]
    const walk = direction => {
        const array: any = []
        const durationFrame = 10
        for (let i = 0; i < framesWidth; i++) {
            array.push({ time: i * durationFrame, frameX: i, frameY: frameY(direction) })
        }
        array.push({ time: array[array.length - 1].time + durationFrame })
        return array
    }

    return {
        textures: {
            'stand': {
                animations: ({direction}) => [stand(direction)]
            },
            'walk': {
                animations: ({direction}) => [walk(direction)]
            }
        },
        framesHeight,
        framesWidth
    }
}
        `
    },
}
];

export default examples;