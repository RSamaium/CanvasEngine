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
| `destroy` | `() => void` | Cleanup method called when the element is being destroyed |
| `isFrozen` | `boolean` | Indicates whether the element is currently frozen (read-only)

## Examples

### Get the tag name

```html
<Container x={5} y={5} />

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
<Container x={5} y={5}>
  <Rect x={5} y={5} width={10} height={10} color="red" />
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

### Get directives

You can access directive instances through the `directives` property. Each directive is stored with its attribute name as the key.

```html
<Sprite image="path/to/image.png" controls drag />

<script>
  import { mount } from 'canvasengine';

  mount((element) => {
    // Access the controls directive instance
    const controlsInstance = element.directives.controls;
    
    if (controlsInstance) {
      // Use methods from the directive instance
      // For example, with controls directive:
      // controlsInstance.stopInputs()
      // controlsInstance.getControls()
    }
    
    // Access the drag directive instance
    const dragInstance = element.directives.drag;
    
    // Check all available directives
    console.log(Object.keys(element.directives));
  });
</script>
```

## Freeze System

The `freeze` prop allows you to completely freeze an element, preventing all updates, controls, and events. When an element is frozen:

- **Reactive updates are blocked**: No `onUpdate` calls are made when signal values change
- **Controls are blocked**: All input controls (keyboard, gamepad, joystick) are stopped
- **Events are blocked**: Event handlers (click, mousedown, etc.) are not executed

The `freeze` prop accepts either a `boolean` or `Signal<boolean>`, allowing you to toggle the freeze state dynamically.

### Basic Usage

```html
<!-- Freeze with boolean -->
<Sprite image="path/to/image.png" freeze={true} />

<!-- Freeze with signal (dynamic) -->
<Sprite image="path/to/image.png" freeze={freezeSignal} />
```

### Example: Dynamic Freeze

```html
<Canvas>
    <Container>
        <Text text="Click to toggle freeze" x={10} y={10} />
        <Sprite 
            image="hero.png"
            x={x}
            y={y}
            freeze={isFrozen}
            controls={{
                up: {
                    bind: 'ArrowUp',
                    keyDown: () => y.set(y() - 10)
                }
            }}
            click={() => {
                console.log('Sprite clicked!')
            }}
        />
    </Container>
</Canvas>

<script>
    import { signal } from 'canvasengine';
    
    const isFrozen = signal(false);
    const x = signal(100);
    const y = signal(100);
    
    // Toggle freeze state
    function toggleFreeze() {
        isFrozen.set(!isFrozen());
    }
</script>
```

### Example: Blocking Updates

When frozen, reactive property updates are completely blocked:

```html
<Sprite 
    image="hero.png"
    x={xSignal}
    y={ySignal}
    freeze={freezeSignal}
/>

<script>
    import { signal } from 'canvasengine';
    
    const freezeSignal = signal(false);
    const xSignal = signal(0);
    const ySignal = signal(0);
    
    // When freezeSignal is true, these updates won't trigger onUpdate
    xSignal.set(100);
    ySignal.set(200);
</script>
```

### Example: Blocking Controls

When frozen, all controls are automatically stopped:

```html
<Sprite 
    image="hero.png"
    freeze={freezeSignal}
    controls={{
        move: {
            bind: 'ArrowUp',
            keyDown: () => {
                console.log('Moving...'); // Won't execute when frozen
            }
        }
    }}
/>
```

### Example: Blocking Events

When frozen, event handlers are not executed:

```html
<Sprite 
    image="hero.png"
    freeze={freezeSignal}
    click={() => {
        console.log('Clicked!'); // Won't execute when frozen
    }}
    mousedown={() => {
        console.log('Mouse down!'); // Won't execute when frozen
    }}
/>
```

### Checking Freeze State

You can check if an element is frozen using the `isElementFrozen` helper function:

```html
<script>
    import { isElementFrozen } from 'canvasengine';
    
    mount((element) => {
        if (isElementFrozen(element)) {
            console.log('Element is frozen');
        }
    });
</script>
```

Or access the `isFrozen` property directly:

```html
<script>
    mount((element) => {
        console.log('Is frozen:', element.isFrozen);
    });
</script>
```