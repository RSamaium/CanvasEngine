# Element Interface

The Element interface represents a component in the framework. It contains all the necessary properties and methods to manage a component's lifecycle, props, effects, and relationships.

## Properties and Methods

| Name | Type | Description |
|------|------|-------------|
| `tag` | `string` | The HTML tag name or component name |
| `props` | `Props` | The component's properties/attributes |
| `componentInstance` | `T` | The instance of the component. It is the PixiJS instance |
| `propObservables` | `NestedSignalObjects \| undefined` | Observable objects for reactive properties |
| `parent` | `Element \| null` | Reference to the parent element. Null if it's a root element |
| `context` | `{ [key: string]: any }` | Optional context object for sharing data between components |
| `directives` | `{ [key: string]: Directive }` | Map of directives applied to the element |
| `destroy` | `() => void` | Cleanup method called when the element is being destroyed

## Examples

### Get the tag name

```html
<Container x="5" y="5" />

<script>
  import { mount } from 'canvasengine';

  mount((element) => {
    console.log(element.tag)
    console.log(element.parent)
    console.log(element.props)
  });
</script>
```

### Get the children components:

```html
<Container x="5" y="5">
  <Rect x="5" y="5" width="10" height="10" color="red" />
</Container>

<script>
  import { mount } from 'canvasengine';

  mount((element) => {
    console.log(element.props.children)
  });
</script>
```

### Get context
```html
<script>
  import { mount } from 'canvasengine';

  mount((element) => {
    console.log(element.props.context)
  });
</script>
```

### Get the reactive props

```html
<Container x y />

<script>
    import { mount, signal } from 'canvasengine'

    const x = signal(5)
    const y = signal(5)

    mount((element) => {
        const x = element.propObservables.x

        // Get signal value
        console.log(x())

        // Subscribe to the RxJS observable
        x.observable.subscribe((value) => {
            console.log(value)
        })
    })
</script>

```