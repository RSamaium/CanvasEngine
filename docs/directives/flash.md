# Using the Flash Directive

The Flash directive allows you to create a flash animation effect on display objects when a trigger is activated. This is useful for creating visual feedback effects, such as when an element is hit, selected, or when an important event occurs.

## Basic Usage

To make an element flash, add the `flash` attribute with a trigger:

```html
<script>
import { trigger } from 'canvasengine';

const flashTrigger = trigger();
</script>

<Sprite image="path/to/image.png" flash={{ trigger: flashTrigger }} />
<Rect x="0" y="0" width="10" height="10" color="red" click={() => flashTrigger.start()} />
```

When you click the red rectangle, the sprite will flash.

## Configuration Options

You can configure the flash behavior by passing an object with options:

```html
<script>
import { trigger, on } from 'canvasengine';

const flashTrigger = trigger();

const flashConfig = {
  trigger: flashTrigger,
  type: 'alpha',        // 'alpha', 'tint', or 'both'
  duration: 300,        // Duration in milliseconds
  cycles: 1,            // Number of flash cycles
  alpha: 0.3,           // Alpha value when flashing (0 to 1)
  tint: 0xffffff,      // Tint color when flashing (hex)
  onStart() {
    console.log("Flash started");
  },
  onComplete() {
    console.log("Flash completed");
  }
};
</script>

<Sprite image="path/to/image.png" flash={flashConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={() => flashTrigger.start()} />
```

### Available Options

- `trigger`: **Required**. The trigger that activates the flash animation
- `type`: Type of flash effect - `'alpha'` (opacity), `'tint'` (color), or `'both'` (default: `'alpha'`)
- `duration`: Duration of the flash animation in milliseconds (default: `300`)
- `cycles`: Number of flash cycles (flash on/off) (default: `1`)
- `alpha`: Alpha value when flashing, from 0 to 1 (default: `0.3`)
- `tint`: Tint color when flashing as hex value (default: `0xffffff` - white)
- `originalAlpha`: Original alpha value to restore (auto-detected if not provided)
- `originalTint`: Original tint value to restore (auto-detected if not provided)
- `onStart()`: Callback function triggered when flash starts
- `onComplete()`: Callback function triggered when flash completes

## Flash Types

### Alpha Flash (Opacity)

Creates a flash effect by changing the opacity of the element:

```html
<script>
import { trigger } from 'canvasengine';

const alphaFlashTrigger = trigger();

const alphaFlashConfig = {
  trigger: alphaFlashTrigger,
  type: 'alpha',
  alpha: 0.2,  // Flash to 20% opacity
  duration: 400
};
</script>

<Sprite image="path/to/image.png" flash={alphaFlashConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={() => alphaFlashTrigger.start()} />
```

### Tint Flash (Color)

Creates a flash effect by changing the color tint of the element:

```html
<script>
import { trigger } from 'canvasengine';

const tintFlashTrigger = trigger();

const tintFlashConfig = {
  trigger: tintFlashTrigger,
  type: 'tint',
  tint: 0xff0000,  // Flash to red
  duration: 300
};
</script>

<Sprite image="path/to/image.png" flash={tintFlashConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={() => tintFlashTrigger.start()} />
```

### Both Alpha and Tint

Creates a flash effect using both opacity and color:

```html
<script>
import { trigger } from 'canvasengine';

const bothFlashTrigger = trigger();

const bothFlashConfig = {
  trigger: bothFlashTrigger,
  type: 'both',
  alpha: 0.5,
  tint: 0x00ff00,  // Flash to green with reduced opacity
  duration: 500
};
</script>

<Sprite image="path/to/image.png" flash={bothFlashConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={() => bothFlashTrigger.start()} />
```

## Multiple Flash Cycles

You can create multiple flash cycles for a more dramatic effect:

```html
<script>
import { trigger } from 'canvasengine';

const multiFlashTrigger = trigger();

const multiFlashConfig = {
  trigger: multiFlashTrigger,
  type: 'alpha',
  cycles: 3,  // Flash 3 times
  duration: 600
};
</script>

<Sprite image="path/to/image.png" flash={multiFlashConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={() => multiFlashTrigger.start()} />
```

## Using with Trigger Data

You can pass data through the trigger to customize the flash effect:

```html
<script>
import { trigger, on } from 'canvasengine';

const flashTrigger = trigger();

on(flashTrigger, (data) => {
  console.log('Flash triggered with data:', data);
});

const flashConfig = {
  trigger: flashTrigger,
  type: 'alpha',
  duration: 300
};

const handleClick = () => {
  // Trigger flash with custom data
  flashTrigger.start({
    type: 'tint',
    tint: 0xff0000,  // Override to red flash
    duration: 500
  });
};
</script>

<Sprite image="path/to/image.png" flash={flashConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={handleClick} />
```

## Advanced Usage

### Flash on Multiple Events

You can use the same trigger for multiple elements:

```html
<script>
import { trigger } from 'canvasengine';

const globalFlash = trigger();

const flashConfig = {
  trigger: globalFlash,
  type: 'alpha',
  alpha: 0.2,
  duration: 300
};
</script>

<!-- Multiple elements flash together -->
<Sprite image="path/to/image1.png" flash={flashConfig} />
<Sprite image="path/to/image2.png" flash={flashConfig} />
<Sprite image="path/to/image3.png" flash={flashConfig} />

<!-- Trigger flash from multiple sources -->
<Rect x="0" y="0" width="10" height="10" color="red" click={() => globalFlash.start()} />
<Rect x="20" y="0" width="10" height="10" color="blue" click={() => globalFlash.start()} />
```

### Flash with Async/Await

Since triggers support async/await, you can wait for the flash to complete:

```html
<script>
import { trigger, on } from 'canvasengine';

const flashTrigger = trigger();

on(flashTrigger, async (data) => {
  console.log('Flash started');
  // The flash animation will complete before this promise resolves
  console.log('Flash completed');
});

const flashConfig = {
  trigger: flashTrigger,
  type: 'alpha',
  duration: 300
};

async function handleClick() {
  await flashTrigger.start();
  console.log('Animation finished, can proceed with next action');
}
</script>

<Sprite image="path/to/image.png" flash={flashConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={handleClick} />
```

### Dynamic Flash Configuration

You can use signals to make flash configuration reactive:

```html
<script>
import { trigger, signal } from 'canvasengine';

const flashTrigger = trigger();
const flashType = signal('alpha');
const flashDuration = signal(300);

const flashConfig = {
  trigger: flashTrigger,
  type: flashType,
  duration: flashDuration
};

// Later, update the configuration
flashType.set('tint');
flashDuration.set(500);
</script>

<Sprite image="path/to/image.png" flash={flashConfig} />
<Rect x="0" y="0" width="10" height="10" color="red" click={() => flashTrigger.start()} />
```

## Use Cases

### Flash on Click

```html
<script>
import { trigger } from 'canvasengine';

const flashTrigger = trigger();
</script>

<Sprite image="path/to/image.png" flash={{ trigger: flashTrigger }} click={() => flashTrigger.start()} />
```

### Flash on Hit/Damage

```html
<script>
import { trigger } from 'canvasengine';

const hitFlash = trigger();

const flashConfig = {
  trigger: hitFlash,
  type: 'both',
  alpha: 0.5,
  tint: 0xff0000,  // Red flash
  duration: 200,
  cycles: 2
};

function takeDamage() {
  hitFlash.start();
}
</script>

<Sprite image="path/to/character.png" flash={flashConfig} />
```

### Flash on Selection

```html
<script>
import { trigger } from 'canvasengine';

const selectFlash = trigger();

const flashConfig = {
  trigger: selectFlash,
  type: 'tint',
  tint: 0x00ff00,  // Green flash
  duration: 150
};
</script>

<Sprite image="path/to/item.png" flash={flashConfig} />
```

### Flash on Error

```html
<script>
import { trigger, on } from 'canvasengine';

const errorFlash = trigger();

on(errorFlash, () => {
  console.error('An error occurred!');
});

const flashConfig = {
  trigger: errorFlash,
  type: 'both',
  alpha: 0.3,
  tint: 0xff0000,  // Red flash
  duration: 300,
  cycles: 3,
  onStart() {
    console.log('Error flash started');
  }
};

function handleError() {
  errorFlash.start();
}
</script>

<Sprite image="path/to/image.png" flash={flashConfig} />
```

## Tips

- **Alpha values**: Range from 0 (fully transparent) to 1 (fully opaque). Lower values create more dramatic flashes.
- **Tint colors**: Use hex color values (e.g., `0xff0000` for red, `0x00ff00` for green, `0x0000ff` for blue).
- **Duration**: Shorter durations (100-300ms) create quick, snappy flashes. Longer durations (500-1000ms) create more noticeable effects.
- **Cycles**: Higher cycle counts create more dramatic, attention-grabbing effects. Use 2-3 cycles for important notifications.
- **Type selection**: 
  - Use `'alpha'` for subtle, elegant flashes
  - Use `'tint'` for colorful, vibrant flashes
  - Use `'both'` for maximum visual impact

::: tip
The flash animation automatically restores the element's original alpha and tint values when complete, so you don't need to manually reset them.
:::

::: warning
If you're using the flash directive with elements that have alpha or tint animations, make sure the flash doesn't conflict with other property updates. The flash temporarily modifies these properties during the animation.
:::

