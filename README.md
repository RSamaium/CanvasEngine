# CanvasEngine - A reactive HTML5 Canvas management library built on top of PixiJS

![CanvasEngine](logo.png)

CanvasEngine is a reactive HTML5 Canvas management library built on top of PixiJS. It provides a component-oriented approach to canvas rendering, similar to modern frontend frameworks.

Features:
- Reactive components
- Use flex in Canvas !
- Easy Animation system 
- Keyboard, Gamepad et Virtual Joystick
- Tiled Map Editor integration
- Particle Emitter
- Audio System

## Note: Performance Comparison with Pixi React

CanvasEngine offers significant performance advantages over Pixi React. While Pixi React relies on React's detection cycles in addition to Pixi's traversal, which can be resource-intensive, CanvasEngine takes a more granular approach. It only updates the specific elements that have changed, resulting in more efficient rendering and better overall performance.

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
<Container flexDirection="column" width="500px">
    <Sprite 
        image="/assets/logo.png" 
        anchor="0.5" 
        rotation
        scale
        @pointerenter={onEnter} 
        @pointerleave={onLeave}
    />
    <Text text size="70" fontFamily="Helvetica" x="90" y="-30" />
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

