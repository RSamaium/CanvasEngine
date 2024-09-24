# Use Container component

Common example:

```html
<Container />
```

Example with x and y:

```html
<script>
import { signal } from 'canvasengine'

const x = signal(10)
const y = signal(10)

const click = () => {
    x.update(x => x + 10)
    y.update(y => y + 10)
}
</script>

<Container x y @click />
```

## Properties

You can use all properties from Display Object