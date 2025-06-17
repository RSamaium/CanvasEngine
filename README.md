# CanvasEngine - A reactive HTML5 Canvas management library built on top of PixiJS and Vite

![CanvasEngine](docs/public/logo.png)

CanvasEngine is a reactive HTML5 Canvas management library built on top of PixiJS and Vite. It provides a component-oriented approach to canvas rendering, similar to modern frontend frameworks.

Features:
- Reactive components
- Use flex in Canvas !
- Easy Animation system 
- Keyboard, Gamepad et Virtual Joystick
- Tiled Map Editor integration
- Particle Emitter
- Audio System

## Installation

```bash
npx degit RSamaium/CanvasEngine/starter my-project
cd my-project
npm install
npm run dev # and go to localhost:5173
```

## Documentation

https://canvasengine.net

## Example:

```html
<Container flexDirection="row" width={500}>
    <Sprite 
        image="/assets/logo.png" 
        anchor={0.5}
        rotation
        scale
        @pointerenter={onEnter} 
        @pointerleave={onLeave}
    />
    <Text text size={70} fontFamily="Helvetica" x={90} y={-30} />
</Container>

<script>
import { signal, tick, animatedSignal, Easing } from "canvasengine";

const { text } = defineProps();
const rotation = signal(0);
const scale = animatedSignal(1, {
    duration: 300,
    ease: Easing.easeInOut,
});

tick(() => {
    rotation.update(rotation => rotation + 0.01);
});

const onEnter = () => {
    scale.set(1.5);
};

const onLeave = () => {
    scale.set(1);
};
</script>
```

## Contributing

Before, install `pnpm` and run the following command:

```bash
git clone https://github.com/RSamaium/CanvasEngine.git
cd CanvasEngine
pnpm install
pnpm run dev # to build the libraries
```

To run the sample project:

```bash
pnpm run dev:sample
```

### Build Documentation/Website

```
cd docs
pnpm install
pnpm run dev
```

### Release

```bash
pnpm run release
```

> Choose the version you want to release

Push the release branch to the remote repository

```bash
git push origin v2
```

