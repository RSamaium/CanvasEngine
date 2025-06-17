# Animation

CanvasEngine provides powerful tools for creating animations. At the core of the animation system are `animatedSignal` and `animatedSequence`.

## `animatedSignal`

An `animatedSignal` is a special type of signal whose changes can be animated over time. It's built on top of the reactive system and integrates with `popmotion` for the animation logic.

### Creation

You create an `animatedSignal` by providing an initial value and optional animation options:

```html
<script>
import { animatedSignal } from 'canvasengine';

const opacity = animatedSignal(1, { duration: 500 }); // Initial opacity 1, animates over 500ms
const positionX = animatedSignal(0, { duration: 1000, ease: (t) => t * t }); // Animates x and y

const click = () => {
  opacity.set(0)
  positionX.set(100)
}
</script>

<Rect width={300} height={300} color="green" x={positionX} click alpha={opacity} />
```

### Updating Value

You can update the value of an `animatedSignal` in two ways:

1.  **`set(newValue, options?)`**: This method animates the signal from its current value to `newValue`. It returns a Promise that resolves when the animation is complete. You can optionally provide animation options specific to this transition.

    ```html
    <script>
    import { animatedSignal } from 'canvasengine';

    const opacity = animatedSignal(1, { duration: 500 });
    const positionX = animatedSignal(0, { duration: 1000 });

    // Example of using set
    async function animateElement() {
      await opacity.set(0.5); // Fades to 50%
      await positionX.set(100, { duration: 2000 }); // Moves to 100 over 2 seconds
    }

    // Call it or attach to an event
    // animateElement();
    </script>

    <Rect width={100} height={100} color="blue" alpha={opacity} x={positionX} click={animateElement} />
    ```

2.  **`update(updaterFn)`**: This method takes a function that receives the current value and should return the new value. The transition to the new value will be animated using the default or previously set animation options for the signal.

    ```html
    <script>
    import { animatedSignal } from 'canvasengine';

    const scale = animatedSignal(1, { duration: 300 });
    const rotation = animatedSignal(0, { duration: 500 });

    // Example of using update
    function modifyElement() {
      scale.update(currentScale => currentScale * 1.2); // Scales up by 20%
      rotation.update(currentRotation => currentRotation + 45); // Rotates by 45 degrees
    }
    // Call it or attach to an event
    // modifyElement();
    </script>

    <Rect width={100} height={100} color="red" scale={scale} rotation={rotation} click={modifyElement} />
    ```

### Accessing Value

To get the current value of an `animatedSignal`, you call it as a function:

```html
<script>
import { animatedSignal, effect } from 'canvasengine';

const rectOpacity = animatedSignal(1);
const rectPositionX = animatedSignal(50);

effect(() => {
  // Logs the current opacity value whenever it changes
  console.log('rectOpacity:', rectOpacity());
});

effect(() => {
  // Logs the current x position whenever it changes
  console.log('rectPositionX:', rectPositionX());
});

const toggleValues = () => {
  if (rectOpacity() === 1) {
    rectOpacity.set(0.5);
    rectPositionX.set(150);
  } else {
    rectOpacity.set(1);
    rectPositionX.set(50);
  }
};
</script>

<Rect width={80} height={80} color="purple" alpha={rectOpacity} x={rectPositionX} click={toggleValues} />
```

### Animation State

Each `animatedSignal` has an `animatedState` property. This is a `WritableSignal` that holds an object with the following properties:

*   `current`: The current value of the signal during an animation.
*   `start`: The value at the beginning of the current or last animation.
*   `end`: The target value of the current or last animation.

You can subscribe to this state to react to changes during an animation:

```html
<script>
import { animatedSignal, effect } from 'canvasengine';

const progressWidth = animatedSignal(0, { duration: 2000 });
let currentProgress = 0;

effect(() => {
  const state = progressWidth.animatedState();
  currentProgress = state.current;
  console.log(`Animation progress: from ${state.start} to ${state.end}, current is ${state.current}`);
  // Here currentProgress could be used to set the width of a visual element
});

const startProgressAnimation = () => {
  progressWidth.set(100);
};

const resetProgressAnimation = () => {
  progressWidth.set(0);
}

const handleProgressClick = () => {
  if (progressWidth() === 0) {
    startProgressAnimation();
  } else {
    resetProgressAnimation();
  }
}
</script>

<!-- Conceptual Rect acting as a progress bar -->
<Rect width={progressWidth} height="20" color="orange" click={handleProgressClick} />
<!-- Text to display progress -->
<Text text={`Progress: ${progressWidth()}%`} x="10" y="40" />
```

### Example

```html
<script>
import { animatedSignal, effect } from 'canvasengine';

const xPosition = animatedSignal(10, { duration: 1000 });
const boxOpacity = animatedSignal(1, { duration: 750 });
const boxColor = signal('blue'); // Non-animated signal for color

// Log the value whenever it changes
effect(() => {
  console.log('xPosition is now:', xPosition());
});

effect(() => {
  console.log('boxOpacity is now:', boxOpacity());
});

// Log the detailed animation state for xPosition
effect(() => {
  const animState = xPosition.animatedState();
  console.log(
    `xPosition Animation: from ${animState.start} to ${animState.end}. Current: ${animState.current}`
  );
});

async function animateMyBox() {
  console.log('Starting animation for MyBox...');
  boxColor.set('red'); // Change color immediately
  // Parallel animation using Promise.all
  await Promise.all([
    xPosition.set(150), // Move right
    boxOpacity.set(0.3)  // Fade out a bit
  ]);
  console.log('Animation to x:150, opacity:0.3 finished.');
  
  boxColor.set('green');
  await xPosition.set(10, { duration: 500 }); // Animate back faster
  console.log('Animation back to x:10 finished.');

  boxColor.set('blue');
  boxOpacity.set(1); // Fade back in, default duration
  xPosition.update(val => val + 70); // Animate to 80 using default duration (1000ms)
  console.log('Fade in and x-update to 80 initiated.');
}

</script>

<Rect x={xPosition} y="50" width="50" height="50" color={boxColor} alpha={boxOpacity} click={animateMyBox} />
```

## `animatedSequence`

The `animatedSequence` function allows you to orchestrate multiple animations, running them sequentially or in parallel. This is particularly useful for creating complex animation timelines.

### How it Works

`animatedSequence` takes an array as its argument. Each element in this array can be either:

1.  A function that returns a `Promise` (typically an `animatedSignal.set()` call). These functions are executed one after another (sequentially).
2.  An array of such promise-returning functions. All functions within this inner array are executed simultaneously (in parallel). The sequence will only proceed to the next step once all promises in the parallel block have resolved.

### Usage

```html
<script>
import { animatedSignal, animatedSequence, signal } from 'canvasengine';

// Define some animated signals for our Rects
const rect1X = animatedSignal(10, { duration: 500 });
const rect2Y = animatedSignal(10, { duration: 700 });
const rect3Scale = animatedSignal(1, { duration: 300 });
const rectsVisible = signal(true);

async function runRectSequence() {
  console.log('Starting Rect animation sequence...');
  rectsVisible.set(true);

  await animatedSequence([
    // Step 1: Animate rect1X to 100
    () => rect1X.set(100),

    // Step 2: Animate rect2Y to 50 and rect3Scale to 1.5 in parallel
    [
      () => rect2Y.set(50),
      () => rect3Scale.set(1.5)
    ],

    // Step 3: Animate rect1X back to 10
    () => rect1X.set(10),

    // Step 4: Animate all three values simultaneously to new targets
    [
      () => rect1X.set(30),
      () => rect2Y.set(20),
      () => rect3Scale.set(0.8)
    ],
    
    // Step 5: Hide the rects (not animated, but part of sequence)
    async () => {
        // Example of a non-animated action within the sequence
        await Promise.all([rect1X.set(200, {duration: 300}), rect2Y.set(200, {duration: 300}), rect3Scale.set(0.1, {duration: 300})]);
        rectsVisible.set(false);
    }
  ]);

  console.log('Rect sequence complete!');
  // console.log(`Final values: rect1X=${rect1X()}, rect2Y=${rect2Y()}, rect3Scale=${rect3Scale()}`);
}

const resetRects = () => {
    rect1X.set(10, {duration: 0});
    rect2Y.set(10, {duration: 0});
    rect3Scale.set(1, {duration: 0});
    rectsVisible.set(true);
}

</script>
```

### Key Features:

*   **Sequential Execution**: Animations in the main array are performed one by one.
*   **Parallel Execution**: Animations within a nested array are performed concurrently.
*   **Promise-based**: It leverages Promises to manage the timing and completion of animations. The `animatedSequence` function itself returns a Promise that resolves when the entire sequence is finished.

This structure provides a flexible way to define intricate animation chains.
