# Condition

To create a condition, you can use the `@if` directive.

```html
@if (condition) {
    <Text x="5" y="5" text="Hello" />
}

<script>
import { signal } from 'canvasengine'

const condition = signal(true)
</script>
```