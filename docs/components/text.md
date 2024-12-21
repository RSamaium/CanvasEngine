# Use Text component

Common example:

```html
<Text text="Hello World" size="20" />
```

## Properties

You can use all properties from Display Object 

### style

Style object from [PixiJS Text](https://pixijs.download/release/docs/text.TextStyle.html)

### text

`text?: string`

Le texte à afficher

### color

`color?: string`

La couleur du texte (raccourci pour style.fill)

### size

`size?: string`

La taille de la police (raccourci pour style.fontSize)

### fontFamily

`fontFamily?: string`

La famille de police à utiliser (raccourci pour style.fontFamily)

## typewriter

```html
<Text text="Hello World" typewriter="{}" />
```

`typewriter?: {
  speed?: number;
  onComplete?: () => void;
  skip?: Trigger;
}`

Object to configure typewriter effect:
- `speed`: Animation speed of the typewriter effect
- `onComplete`: Callback function when the animation completes
- `skip`: Trigger to skip the current animation

### Example with skip trigger

```html
<Text text="Hello World" typewriter={ { skip } } />

<script>
import { trigger } from 'canvasengine'

const skip = trigger()

// skip the typewriter effect
skip.start()
</script>
```
