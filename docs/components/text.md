# Text Component

Use `Text` for labels, HUD values, menu items, dialogue, debug output, and any canvas-rendered text.

## Minimal example

```html
<Text text="Hello World" size={20} color="#ffffff" />
```

## Properties

You can use all properties from Display Object.

### style

Style object from [PixiJS Text](https://pixijs.download/release/docs/text.TextStyle.html).

### text

`text?: string`

Text to display.

### color

`color?: string`

Text color. This is a shortcut for `style.fill`.

### size

`size?: string`

Font size. This is a shortcut for `style.fontSize`.

### fontFamily

`fontFamily?: string`

Font family. This is a shortcut for `style.fontFamily`.

### Layout fitting

Text participating in Yoga uses `objectFit="none"` by default, so a constrained
layout box never makes the authored font silently smaller. Wrapped text should
be given an appropriate width or `wordWrapWidth`; overflow remains visible and
can be diagnosed directly.

Use `objectFit="scale-down"` explicitly when shrinking a label to fit its box is
the intended design:

```html
<Text
  width={160}
  height={24}
  text="Shrink this label if necessary"
  objectFit="scale-down"
/>
```

## Typewriter

```html
<Text text="Hello World" typewriter={{ speed: 1 }} />
```

`typewriter?: {
  speed?: number;
  onComplete?: () => void;
  skip?: Trigger;
  sound?: {
    src: string;
    volume?: number;
    rate?: number;
  };
}`

Object to configure typewriter effect:

- `speed`: Animation speed of the typewriter effect
- `onComplete`: Callback function when the animation completes
- `skip`: Trigger to skip the current animation
- `sound`: Sound configuration for typewriter effect
  - `src`: Path to the audio file to play for each character
  - `volume`: Volume level from 0.0 to 1.0 (default: 0.5)
  - `rate`: Playback rate/speed of the sound (default: 1.0)

### Example with skip trigger

```html
<Text text="Hello World" typewriter={ { skip } } />

<script>
import { trigger } from 'canvasengine'

const skip = trigger()

// Skip the typewriter effect.
skip.start()
</script>
```

### Example with sound effect

```html
<Text 
  text="Hello World! This is a typewriter effect with sound." 
  typewriter={{ 
    speed: 1,
    sound: {
      src: "/assets/typewriter.mp3",
      volume: 0.3,
      rate: 1.2
    }
  }} 
/>
```

This will play a typewriter sound effect for each character as the text appears. The sound system automatically calculates the duration of the audio file and uses it to prevent overlapping sounds, ensuring a clean typewriter effect even at high speeds.

<!-- @include: ./_display-object.md -->
