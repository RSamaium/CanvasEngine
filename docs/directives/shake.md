# Using the Shake Directive

The Shake directive allows you to create a shake animation effect on display objects when a trigger is activated. This is useful for creating visual feedback effects, such as when an element is hit, clicked, or when an error occurs.

## Basic Usage

To make an element shake, add the `shake` attribute with a trigger:

```html
<script>
import { trigger } from 'canvasengine';

const shakeTrigger = trigger();
</script>

<Sprite image="path/to/image.png" shake={{ trigger: shakeTrigger }} />

<Rect x="0" y="0" width="10" height="10" color="red" click={shakeTrigger} />
```

When you click the red rectangle, the sprite will shake.

## Configuration Options

You can configure the shake behavior by passing an object with options:

```html
<script>
import { trigger, on } from 'canvasengine';

const shakeTrigger = trigger();

const shakeConfig = {
  trigger: shakeTrigger,
  intensity: 15,        // Shake intensity in pixels
  duration: 500,        // Duration in milliseconds
  frequency: 10,        // Number of oscillations
  direction: 'both',    // 'x', 'y', or 'both'
  onStart() {
    console.log("Shake started");
  },
  onComplete() {
    console.log("Shake completed");
  }
};
</script>

<Sprite image="path/to/image.png" shake={shakeConfig} />

<Rect x="0" y="0" width="10" height="10" color="red" click={shakeTrigger} />
```

### Available Options

- `trigger`: **Required**. The trigger that activates the shake animation
- `intensity`: Shake intensity in pixels (default: `10`)
- `duration`: Duration of the shake animation in milliseconds (default: `500`)
- `frequency`: Number of shake oscillations during the animation (default: `10`)
- `direction`: Direction of the shake - `'x'`, `'y'`, or `'both'` (default: `'both'`)
- `onStart()`: Callback function triggered when shake starts
- `onComplete()`: Callback function triggered when shake completes

## Using with Trigger Data

You can pass data through the trigger to customize the shake effect:

```html
<script>
import { trigger, on } from 'canvasengine';

const shakeTrigger = trigger();

on(shakeTrigger, (data) => {
  console.log('Shake triggered with data:', data);
});

const shakeConfig = {
  trigger: shakeTrigger,
  intensity: 10,
  duration: 500
};

const handleClick = () => {
  // Trigger shake with custom data
  shakeTrigger.start({
    intensity: 20,  // Override intensity for this shake
    duration: 1000
  });
};
</script>

<Sprite image="path/to/image.png" shake={shakeConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={handleClick} />
```

## Direction Options

You can control which axis the shake affects:

```html
<script>
import { trigger } from 'canvasengine';

const shakeX = trigger();
const shakeY = trigger();
const shakeBoth = trigger();

const shakeHorizontal = {
  trigger: shakeX,
  direction: 'x',  // Only shake horizontally
  intensity: 15
};

const shakeVertical = {
  trigger: shakeY,
  direction: 'y',  // Only shake vertically
  intensity: 15
};

const shakeAll = {
  trigger: shakeBoth,
  direction: 'both',  // Shake in both directions
  intensity: 15
};
</script>

<Sprite image="path/to/image.png" shake={shakeHorizontal} />
<Sprite image="path/to/image2.png" shake={shakeVertical} />
<Sprite image="path/to/image3.png" shake={shakeAll} />
```

## Advanced Usage

### Shake on Multiple Events

You can use the same trigger for multiple elements or multiple events:

```html
<script>
import { trigger } from 'canvasengine';

const globalShake = trigger();

const shakeConfig = {
  trigger: globalShake,
  intensity: 20,
  duration: 300
};
</script>

<!-- Multiple elements shake together -->
<Sprite image="path/to/image1.png" shake={shakeConfig} />
<Sprite image="path/to/image2.png" shake={shakeConfig} />
<Sprite image="path/to/image3.png" shake={shakeConfig} />

<!-- Trigger shake from multiple sources -->
<Rect x="0" y="0" width="10" height="10" color="red" click={globalShake} />
<Rect x="20" y="0" width="10" height="10" color="blue" click={globalShake} />
```

### Shake with Async/Await

Since triggers support async/await, you can wait for the shake to complete:

```html
<script>
import { trigger, on } from 'canvasengine';

const shakeTrigger = trigger();

on(shakeTrigger, async (data) => {
  console.log('Shake started');
  // The shake animation will complete before this promise resolves
  console.log('Shake completed');
});

const shakeConfig = {
  trigger: shakeTrigger,
  intensity: 15,
  duration: 500
};

async function handleClick() {
  await shakeTrigger.start();
  console.log('Animation finished, can proceed with next action');
}
</script>

<Sprite image="path/to/image.png" shake={shakeConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={handleClick} />
```

### Dynamic Shake Configuration

You can use signals to make shake configuration reactive:

```html
<script>
import { trigger, signal } from 'canvasengine';

const shakeTrigger = trigger();
const intensity = signal(10);
const duration = signal(500);

const shakeConfig = {
  trigger: shakeTrigger,
  intensity: intensity,
  duration: duration
};

// Later, update the configuration
intensity.set(20);
duration.set(1000);
</script>

<Sprite image="path/to/image.png" shake={shakeConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={shakeTrigger} />
```

## Use Cases

### Shake on Click

```html
<script>
import { trigger } from 'canvasengine';

const shakeTrigger = trigger();
</script>

<Sprite image="path/to/image.png" shake={{ trigger: shakeTrigger }} click={shakeTrigger} />
```

### Shake on Error

```html
<script>
import { trigger, on } from 'canvasengine';

const errorShake = trigger();

on(errorShake, () => {
  console.error('An error occurred!');
});

const shakeConfig = {
  trigger: errorShake,
  intensity: 20,
  duration: 300,
  onStart() {
    console.log('Error shake started');
  }
};

function handleError() {
  errorShake.start();
}
</script>

<Sprite image="path/to/image.png" shake={shakeConfig} />
```

### Shake on Hit/Damage

```html
<script>
import { trigger } from 'canvasengine';

const hitShake = trigger();

const shakeConfig = {
  trigger: hitShake,
  intensity: 25,
  duration: 400,
  frequency: 15,
  direction: 'both'
};

function takeDamage() {
  hitShake.start();
}
</script>

<Sprite image="path/to/character.png" shake={shakeConfig} />
```

## Tips

- **Intensity**: Higher values create more dramatic shakes. Values between 5-30 pixels work well for most use cases.
- **Duration**: Shorter durations (200-500ms) create quick, snappy shakes. Longer durations (500-1000ms) create more dramatic effects.
- **Frequency**: Higher frequencies (10-20) create rapid, intense shakes. Lower frequencies (5-10) create slower, more noticeable shakes.
- **Direction**: Use `'x'` or `'y'` for directional effects, such as shaking a health bar horizontally when taking damage.

::: tip
The shake animation automatically resets the element's position to its original location when complete, so you don't need to manually reset it.
:::

::: warning
If you're using the shake directive with elements that have position animations, make sure the shake doesn't conflict with other position updates. The shake temporarily modifies the position during the animation.
:::

