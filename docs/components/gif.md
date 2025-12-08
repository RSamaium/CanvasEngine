# Gif Component

The `Gif` component allows you to display and control animated GIF images in your PixiJS application. It inherits directly from PixiJS `GifSprite`.

## Requirements

This component requires the `@pixi/gif` plugin to be installed:

```bash
npm install @pixi/gif
```

The plugin must be installed and configured with PixiJS so that `GifSprite` is available from the `pixi.js` import.

## Basic GIF:

```html
<Gif 
    src="./path/to/animation.gif" 
    x={100} 
    y={100} 
/>
```

## GIF with Controls:

```html
<Gif 
    src="./path/to/animation.gif"
    x={100}
    y={100}
    animationSpeed={1.5}
    loop={true}
    autoPlay={true}
    onComplete={() => console.log('Animation finished')}
    onFrameChange={(frame) => console.log('Frame:', frame)}
/>
```

## Reactive Control with Signals:

```html
<script>
import { signal } from 'canvasengine';

const isPlaying = signal(false);
const targetFrame = signal(0);
const speed = signal(1);

const play = () => isPlaying.set(true);
const stop = () => isPlaying.set(false);
const goToFrame = (frame) => {
    targetFrame.set(frame);
    isPlaying.set(false);
};
</script>

<Gif 
    src="./assets/character-walk.gif"
    x={200}
    y={200}
    playing={isPlaying()}
    currentFrame={targetFrame()}
    animationSpeed={speed()}
/>

<button onclick={play}>Play</button>
<button onclick={stop}>Stop</button>
<button onclick={() => goToFrame(5)}>Go to Frame 5</button>
<button onclick={() => speed.set(2)}>Speed x2</button>
```

## Frame Control:

```html
<script>
import { signal } from 'canvasengine';

const currentFrame = signal(10);
const isPlaying = signal(false);
</script>

<Gif 
    src="./animation.gif"
    currentFrame={currentFrame()}
    playing={isPlaying()}
    onFrameChange={(frame) => {
        console.log('Current frame:', frame);
        currentFrame.set(frame);
    }}
/>
```

## Gif Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `src` | `string` | Path to the GIF file (required) | - |
| `animationSpeed` | `number` | Animation speed (1 = normal speed, 0.5 = half, 2 = double) | `1` |
| `loop` | `boolean` | Whether the animation should loop | `true` |
| `autoPlay` | `boolean` | Whether the animation should start automatically | `true` |
| `playing` | `boolean` | Controls play/pause of the animation | - |
| `currentFrame` | `number` | Current frame to display | - |
| `onComplete` | `() => void` | Callback called when animation finishes | - |
| `onFrameChange` | `(frame: number) => void` | Callback called on each frame change | - |
| `onLoop` | `() => void` | Callback called on each animation loop | - |

## Reactive Control

Control the GIF animation through reactive properties (signals):

```html
<script>
import { signal } from 'canvasengine';

const isPlaying = signal(true);
const speed = signal(1);
const shouldLoop = signal(true);
const frameToShow = signal(0);

// Control functions
const play = () => isPlaying.set(true);
const pause = () => isPlaying.set(false);
const setSpeed = (newSpeed) => speed.set(newSpeed);
const goToFrame = (frame) => {
    frameToShow.set(frame);
    isPlaying.set(false);
};
</script>

<Gif 
    src="./animation.gif"
    playing={isPlaying()}
    animationSpeed={speed()}
    loop={shouldLoop()}
    currentFrame={frameToShow()}
/>
```

## Available Properties

The component inherits all properties from `GifSprite` and exposes them as reactive props:

```html
<Gif 
    src="./animation.gif"
    animationSpeed={2.0}          // Animation speed multiplier
    loop={true}                   // Whether to loop the animation
    playing={true}                // Play/pause state
    currentFrame={10}             // Specific frame to display
    autoPlay={true}               // Auto-start animation on load
    onComplete={() => console.log('Animation finished')}
    onFrameChange={(frame) => console.log('Frame:', frame)}
    onLoop={() => console.log('Loop completed')}
/>
```

## Complete Example

```html
<script>
import { signal } from 'canvasengine';

const characterX = signal(100);
const characterY = signal(100);
const isWalking = signal(false);
const walkSpeed = signal(1.5);
const currentFrame = signal(0);

const startWalking = () => {
    isWalking.set(true);
};

const stopWalking = () => {
    isWalking.set(false);
};

const walkToPosition = (x, y) => {
    characterX.set(x);
    characterY.set(y);
    isWalking.set(true);
    setTimeout(() => isWalking.set(false), 2000); // Stop after 2 seconds
};
</script>

<div>
    <Gif 
        src="./assets/character-walk.gif"
        x={characterX()}
        y={characterY()}
        scale={0.5}
        animationSpeed={walkSpeed()}
        loop={true}
        playing={isWalking()}
        autoPlay={false}
        onComplete={() => console.log('Walk cycle completed')}
        onFrameChange={(frame) => currentFrame.set(frame)}
    />
    
    <button onclick={startWalking}>Walk</button>
    <button onclick={stopWalking}>Stop</button>
    <button onclick={() => walkToPosition(300, 200)}>Go to (300, 200)</button>
    <button onclick={() => walkSpeed.set(2.5)}>Speed Up</button>
    
    <p>Current Frame: {currentFrame()}</p>
    <p>Position: ({characterX()}, {characterY()})</p>
    <p>Walking: {isWalking() ? 'Yes' : 'No'}</p>
</div>
```

## Technical Notes

- **Direct Inheritance**: The `CanvasGif` component inherits directly from PixiJS `GifSprite`
- Direct import: `import { GifSprite } from 'pixi.js'`
- Uses exclusively `GifSprite` - no fallbacks
- GIFs are loaded asynchronously via:
  - `GifSprite.fromURL()` for URLs
  - `GifSprite.fromBuffer()` for data buffers
- **Property copying**: Loaded GIF data is copied to the component instance
- Component automatically manages resource cleanup
- Compatible with all `DisplayObject` props (position, rotation, scale, etc.)
- Native PixiJS API: direct access to `GifSprite` methods and properties
- **Reactive control**: Control animation through signals instead of direct method calls

<!-- @include: ./_display-object.md -->