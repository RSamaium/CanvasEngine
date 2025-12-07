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
    title: 'With loop and condition syntax',
    description: 'Example of using loop and condition syntax in CanvasEngine',
    files: {
        "app.ce": `
<Canvas>
    <Container>
        @if (show) {
            <Container>
                @for ((color,index) of colors) {
                    <!-- we use @ in "@index" because index is not a signal -->
                    <Rect width={100} height={100} color={color} x={@index * 100} />
                }
            </Container>
        }
        <Container x={100} y={100} click>
            <Rect width={100} height={100} color="red" />
            <Text text="Click me" />
        </Container>
    </Container>
</Canvas>

<script>
import { signal, computed, effect } from 'canvasengine'

const colors = signal(['red', 'green', 'blue'])
const show = signal(true)

const click = () => {
    show.update(show => !show)
}
</script>

        `,
    },
},
 {
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

// {
//     title: 'Joystick',
//     description: 'Example of using joystick in CanvasEngine',
//     files: {
//         "app.ce": `
// <Canvas>
//     <Container>
//         <Joystick />
//     </Container>
// </Canvas>

// <script>
// import { Joystick } from '@canvasengine/presets'
// </script>
//         `,
//     },
// },
{
    title: 'Sprite Animation and controls',
    description: 'Example of using sprite animation and controls in CanvasEngine. Use the arrow keys to move the sprite.',
    files: {
        "app.ce": `
<Canvas>
    <Container>
        <Sprite 
            x
            y
            sheet={{
                definition,
                playing: animationPlaying,
                params: {
                    direction
                }
            }}
            controls
        />
    </Container>
</Canvas>

<script>
import { spritesheet } from "./spritesheet.js"
import { signal } from 'canvasengine'

const x = signal(0)
const y = signal(0)
const direction = signal("down")
const speed = signal(3)
const animationPlaying = signal("stand")

const keyUp = () => {
    animationPlaying.set("stand")
}

const controls = signal({
    down: {
      repeat: true,
      bind: "down",
      keyDown() {
        y.update(y => y + speed());
        direction.set("down");
        animationPlaying.set("walk")
      },
      keyUp
    },
    up: {
      repeat: true,
      bind: 'up',
      keyDown() {
        y.update(y => y - speed());
        direction.set("up");
        animationPlaying.set("walk")
      },
      keyUp
    },
    left: {
      repeat: true,
      bind: "left",
      keyDown() {
        x.update(x => x - speed());
        direction.set("left");
        animationPlaying.set("walk")
      },
      keyUp
    },
    right: {
      repeat: true,
      bind: "right",
      keyDown() {
        x.update(x => x + speed());
        direction.set("right");
        animationPlaying.set("walk")
      },
      keyUp
    }
});

const definition = {
    id: "hero",
    image: "./hero.png",
    width: 96,
    height: 128,
    ...spritesheet(3, 4)
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
        const array = []
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
},
{
    title: 'Tiled Map',
    description: 'Example of using a Tiled map in CanvasEngine',
    files: {
        "app.ce": `
<Canvas>
    <TiledMap 
        map={map} 
        createLayersPerTilesZ={true} 
        basePath="/" 
        objectLayer={(layer) => <Rect width={32} height={32} color="red" />} 
    />
</Canvas>

<script>
    import { TiledMap } from '@canvasengine/presets'
    import { signal } from 'canvasengine'
    
    let map = signal(null)
    
    fetch('/simplemap.tmx')
        .then((res) => res.text())
        .then((text) => {
            map.set(text)
        })
</script>
        `,
    },
},
{
    title: 'DOM with form',
    description: 'Example of using a Tiled map in CanvasEngine',
    files: {
        "app.ce": `
<Canvas backgroundColor="white">
  <DOMContainer x={100} y={100}>
      <form submit={click}>
        <input name="username" type="text" value={text} />
        <button>Submit</button>
        <p>{text}</p>
      </form>
  </DOMContainer>
</Canvas>

<script>
import { signal } from "canvasengine";

const text = signal("Hello");
const click = (event, formData) => {
  console.log(formData)
}
</script>


        `,
    },
},
{
    title: 'Animated signal',
    description: 'Example of using an animated signal in CanvasEngine. Click the rect to move it.',
    files: {
        "app.ce": `
<Canvas backgroundColor="white">
  <Container>
    <Rect width={100} height={100} color="red" x click />
  </Container>
</Canvas>

<script>
import { animatedSignal, Easing } from "canvasengine";

let direction = "left"

const x = animatedSignal(0, {
    duration: 1000
})

const click = () => {
    if (direction === "left") {
        x.update(x => x + 500)
        direction = "right"
    } else {
        x.update(x => x - 500)
        direction = "left"
    }
}
</script>


        `,
    },
},
{
    title: 'Joystick',
    description: 'Example of using a joystick in CanvasEngine. Use the joystick to move the rect.',
    files: {
        "app.ce": `
<Canvas backgroundColor="white">
  <Container>
    <Joystick x={100} y={100} onChange={onChange} />
    <Container x={300} flexDirection="column" top={50} gap={10}>
        <Text text={angleStr} />
        <Text text={directionStr} />
        <Text text={powerStr} />
    </Container>
  </Container>
</Canvas>

<script>
import { signal, computed } from 'canvasengine'
import { Joystick } from '@canvasengine/presets'

const angle = signal(0)
const direction = signal("up")
const power = signal(0)
const angleStr = computed(() => \`Angle: \${angle()}\`)
const directionStr = computed(() => \`Direction: \${direction()}\`)
const powerStr = computed(() => \`Power: \${power()}\`)

const onChange = (event) => {
    angle.set(event.angle)
    direction.set(event.direction)
    power.set(event.power)
}
</script>


        `,
    },
},
{
    title: 'Flash Effect',
    description: 'Example of using flash effects in CanvasEngine. Click the rectangles to see different flash types.',
    files: {
        "app.ce": `
<Canvas backgroundColor="#2c3e50">
    <Container flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%" gap={30}>
        <Text text="Click the rectangles to flash them!" color="white" size={24} />
        
        <Container flexDirection="row" gap={30}>
            <Container flexDirection="column" alignItems="center" gap={10}>
                <Text text="Alpha Flash" color="#ecf0f1" size={14} />
                <Rect 
                    color="#e74c3c" 
                    width={80} 
                    height={80} 
                    borderRadius={8} 
                    flash={alphaFlashConfig}
                    click={() => alphaFlashTrigger.start()}
                />
            </Container>
            
            <Container flexDirection="column" alignItems="center" gap={10}>
                <Text text="Tint Flash" color="#ecf0f1" size={14} />
                <Rect 
                    color="#3498db" 
                    width={80} 
                    height={80} 
                    borderRadius={8} 
                    flash={tintFlashConfig}
                    click={() => tintFlashTrigger.start()}
                />
            </Container>
            
            <Container flexDirection="column" alignItems="center" gap={10}>
                <Text text="Both Flash" color="#ecf0f1" size={14} />
                <Rect 
                    color="#2ecc71" 
                    width={80} 
                    height={80} 
                    borderRadius={8} 
                    flash={bothFlashConfig}
                    click={() => bothFlashTrigger.start()}
                />
            </Container>
            
            <Container flexDirection="column" alignItems="center" gap={10}>
                <Text text="Multi Cycle" color="#ecf0f1" size={14} />
                <Rect 
                    color="#f39c12" 
                    width={80} 
                    height={80} 
                    borderRadius={8} 
                    flash={multiCycleFlashConfig}
                    click={() => multiCycleFlashTrigger.start()}
                />
            </Container>
        </Container>
    </Container>
</Canvas>

<script>
import { trigger } from 'canvasengine';

// Alpha flash - changes opacity
const alphaFlashTrigger = trigger();
const alphaFlashConfig = {
    trigger: alphaFlashTrigger,
    type: 'alpha',
    alpha: 0.2,
    duration: 300
};

// Tint flash - changes color
const tintFlashTrigger = trigger();
const tintFlashConfig = {
    trigger: tintFlashTrigger,
    type: 'tint',
    tint: 0xff0000,  // Red flash
    duration: 300
};

// Both flash - changes opacity and color
const bothFlashTrigger = trigger();
const bothFlashConfig = {
    trigger: bothFlashTrigger,
    type: 'both',
    alpha: 0.5,
    tint: 0x00ff00,  // Green flash
    duration: 400
};

// Multi-cycle flash - flashes multiple times
const multiCycleFlashTrigger = trigger();
const multiCycleFlashConfig = {
    trigger: multiCycleFlashTrigger,
    type: 'alpha',
    cycles: 3,
    duration: 600
};
</script>

        `,
    },
},
{
    title: 'Shake Effect',
    description: 'Example of using shake effects in CanvasEngine. Click the rectangles to see different shake configurations.',
    files: {
        "app.ce": `
<Canvas backgroundColor="#2c3e50">
    <Container flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%" gap={30}>
        <Text text="Click the rectangles to shake them!" color="white" size={24} />
        
        <Container flexDirection="row" gap={30}>
            <Container flexDirection="column" alignItems="center" gap={10}>
                <Text text="Basic Shake" color="#ecf0f1" size={14} />
                <Rect 
                    color="#e74c3c" 
                    width={100} 
                    height={100} 
                    borderRadius={8} 
                    shake={basicShakeConfig}
                    click={() => basicShakeTrigger.start()}
                />
            </Container>
            
            <Container flexDirection="column" alignItems="center" gap={10}>
                <Text text="Horizontal" color="#ecf0f1" size={14} />
                <Rect 
                    color="#3498db" 
                    width={100} 
                    height={100} 
                    borderRadius={8} 
                    shake={horizontalShakeConfig}
                    click={() => horizontalShakeTrigger.start()}
                />
            </Container>
            
            <Container flexDirection="column" alignItems="center" gap={10}>
                <Text text="Vertical" color="#ecf0f1" size={14} />
                <Rect 
                    color="#2ecc71" 
                    width={100} 
                    height={100} 
                    borderRadius={8} 
                    shake={verticalShakeConfig}
                    click={() => verticalShakeTrigger.start()}
                />
            </Container>
            
            <Container flexDirection="column" alignItems="center" gap={10}>
                <Text text="Intense Shake" color="#ecf0f1" size={14} />
                <Rect 
                    color="#f39c12" 
                    width={100} 
                    height={100} 
                    borderRadius={8} 
                    shake={intenseShakeConfig}
                    click={() => intenseShakeTrigger.start()}
                />
            </Container>
        </Container>
    </Container>
</Canvas>

<script>
import { trigger } from 'canvasengine';

// Basic shake - shakes in both directions
const basicShakeTrigger = trigger();
const basicShakeConfig = {
    trigger: basicShakeTrigger,
    intensity: 15,
    duration: 500,
    frequency: 10,
    direction: 'both'
};

// Horizontal shake - only shakes on X axis
const horizontalShakeTrigger = trigger();
const horizontalShakeConfig = {
    trigger: horizontalShakeTrigger,
    intensity: 15,
    duration: 500,
    frequency: 10,
    direction: 'x'
};

// Vertical shake - only shakes on Y axis
const verticalShakeTrigger = trigger();
const verticalShakeConfig = {
    trigger: verticalShakeTrigger,
    intensity: 15,
    duration: 500,
    frequency: 10,
    direction: 'y'
};

// Intense shake - higher intensity and frequency
const intenseShakeTrigger = trigger();
const intenseShakeConfig = {
    trigger: intenseShakeTrigger,
    intensity: 25,
    duration: 400,
    frequency: 15,
    direction: 'both'
};
</script>

        `,
    },
},
];

export default examples;