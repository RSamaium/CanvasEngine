# Dependencies

The `dependencies` prop allows you to delay component mounting until all specified dependencies are ready (not `undefined`). This is useful for scenarios where a component needs to wait for asynchronous data loading or reactive signals to become available before rendering.

## Overview

When you provide a `dependencies` prop to a component, the component will not mount until all dependencies are defined. Dependencies can be:

- **Signals**: Reactive signals that may start as `undefined` and become defined later
- **Promises**: Async operations that resolve to a value (must not resolve to `undefined`)
- **Direct values**: Any value that is not `undefined`

## Basic Usage

### With Signal Dependencies

```html
<script>
  import { signal, mount } from 'canvasengine';

  // Start with undefined dependency
  const userData = signal(undefined);

  // Load data asynchronously
  setTimeout(() => {
    userData.set({ name: 'John', score: 100 });
  }, 1000);
</script>

<Container dependencies={[userData]}>
  <Text text={`Welcome ${userData().name}!`} />
  <Text text={`Score: ${userData().score}`} />
</Container>
```

In this example, the `Container` and its children will not mount until `userData` becomes defined. The `mount` hook will only be called after the signal is set to a value.

### With Promise Dependencies

```html
<script>
  import { mount } from 'canvasengine';

  // Simulate async data loading
  const loadUserData = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ name: 'Jane', level: 5 });
      }, 2000);
    });
  };

  const userDataPromise = loadUserData();
</script>

<Container dependencies={[userDataPromise]}>
  <Text text="User data loaded!" />
</Container>
```

The component will wait for the promise to resolve before mounting. If the promise resolves to `undefined`, the component will not mount.

### Mixed Dependencies

You can combine signals and promises:

```html
<script>
  import { signal } from 'canvasengine';

  const config = signal(undefined);
  const assetsPromise = Promise.resolve({ sprites: [] });

  // Load config
  setTimeout(() => {
    config.set({ theme: 'dark' });
  }, 500);
</script>

<Container dependencies={[config, assetsPromise]}>
  <Text text="All dependencies ready!" />
</Container>
```

The component will mount only when both the signal becomes defined AND the promise resolves to a non-undefined value.

## Using with h() Function

When using CanvasEngine without the compiler, you can pass dependencies using the `h()` function:

```typescript
import { h, signal, Container, Text } from 'canvasengine';

const userData = signal(undefined);

// Later...
userData.set({ name: 'Alice' });

const component = h(Container, {
  dependencies: [userData]
}, 
  h(Text, { text: 'User loaded!' })
);
```

## Behavior

- **Immediate mounting**: If all dependencies are already defined when the component is created, it mounts immediately
- **Delayed mounting**: If any dependency is `undefined`, the component waits and subscribes to signal changes
- **Reactive updates**: For signal dependencies, the component automatically subscribes and mounts when all signals become defined
- **Promise handling**: Promise dependencies are awaited, and the component mounts if the resolved value is not `undefined`
- **No dependencies**: If the `dependencies` prop is not provided, the component mounts normally

## Use Cases

### Loading Game Assets

```html
<script>
  import { signal } from 'canvasengine';

  const textures = signal(undefined);
  const sounds = signal(undefined);

  // Load assets
  Promise.all([
    loadTextures(),
    loadSounds()
  ]).then(([tex, snd]) => {
    textures.set(tex);
    sounds.set(snd);
  });
</script>

<Container dependencies={[textures, sounds]}>
  <Text text="All assets loaded! Game ready." />
</Container>
```

### Waiting for User Authentication

```html
<script>
  import { signal } from 'canvasengine';

  const user = signal(undefined);

  // Authenticate user
  authenticateUser().then(userData => {
    user.set(userData);
  });
</script>

<Container dependencies={[user]}>
  <Text text={`Welcome back, ${user().username}!`} />
</Container>
```

### Conditional Component Rendering

```html
<script>
  import { signal } from 'canvasengine';

  const gameState = signal(undefined);
  const playerData = signal(undefined);

  // Initialize game
  initializeGame().then(() => {
    gameState.set('ready');
    playerData.set({ health: 100 });
  });
</script>

<Container dependencies={[gameState, playerData]}>
  <Text text="Game initialized!" />
</Container>
```

## Important Notes

- A dependency is considered "ready" when its value is **not** `undefined`
- The value `null` is considered ready (only `undefined` blocks mounting)
- All dependencies must be ready simultaneously for the component to mount
- Once mounted, the component will not unmount if dependencies become `undefined` again
- The `mount` hook is only called after all dependencies are ready

