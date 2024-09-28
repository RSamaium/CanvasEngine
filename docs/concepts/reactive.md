# Reactive Programming

CanvasEngine uses a reactive programming model to manage state and animations. This is a declarative way to manage state and animations, and it is different from the traditional imperative programming model.

In CanvasEngine, you define signals that represent values that can change over time. When a signal changes, all the components that depend on that signal are automatically updated. This is known as reactive data binding.

## Signals

Signals are created using the `signal` function. For example:

```html
<script>
  import { signal } from 'canvasengine';

  const x = signal(0);
  const y = signal(0);
</script>

<Rect x y width="10" height="10" color="red" />
```

In this example, the `Rect` component will be drawn at the initial position of `(0, 0)`. When the `x` or `y` signal changes, the `Rect` component will be re-rendered at the new position.

## Animated Signals

Animated signals are a type of signal that can be animated over time. They are created using the `animatedSignal` function. For example:

```html
<script>
  import { animatedSignal } from 'canvasengine';

  const x = animatedSignal(0);
  const y = animatedSignal(0);
</script>

<Rect x={x} y={y} width="10" height="10" color="red" />
```

In this example, the `Rect` component will be drawn at the initial position of `(0, 0)`. When the `x` or `y` signal changes, the `Rect` component will be re-rendered at the new position.

## Computed Signals

Computed signals are a type of signal that can be computed from other signals. They are created using the `computed` function. For example:

```html
<script>
  import { computed, signal } from 'canvasengine';

  const x = signal(0);
  const y = signal(0);

  const distance = computed(() => Math.sqrt(x() ** 2 + y() ** 2));
</script>

<Text x={x} y={y} text={distance} />
```

In this example, the `Text` component will display the distance between the `x` and `y` signals. When the `x` or `y` signal changes, the `distance` signal will be re-computed and the `Text` component will be re-rendered with the new distance.

## Effects

Effects are a type of signal that can be used to perform side effects. They are created using the `effect` function. For example:

```html
<script>
  import { effect, signal } from 'canvasengine';

  const x = signal(0);
  const y = signal(0);

  effect(() => {
    console.log(`x: ${x()}, y: ${y()}`);
  });
</script>

 <Rect x y width="10" height="10" color="red" />
 ```

In this example, the `effect` function will log the value of the `x` and `y` signals to the console. When the `x` or `y` signal changes, the `effect` function will be re-run and the new value of the `x` and `y` signals will be logged to the console.