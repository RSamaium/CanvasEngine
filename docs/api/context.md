# Context

The context is an object that is automatically provided to all components in the component tree. It contains shared resources and utilities that are available throughout your application.

## Available Properties

The context object contains the following properties:

| Name | Type | Description |
|------|------|-------------|
| `app` | `() => Application \| null` | Function that returns the PixiJS Application instance. Returns `null` until the canvas is rendered. |
| `canvasSize` | `Signal<{ width: number, height: number }>` | Signal containing the current width and height of the canvas. Updates automatically when the canvas is resized. |
| `globalLoader` | `GlobalAssetLoader` | Global asset loader instance that tracks loading progress of all assets across the component tree. See [GlobalAssetLoader documentation](../utils/global-asset-loader.md) for more details. |
| `tick` | `Signal<Tick>` | Signal containing the ticker information. Updates on each frame with timing and frame data. See [Tick interface](#tick-interface) below. |
| `rootElement` | `Element` | The root Canvas element. See [Element documentation](./element.md) for more details. |

## Tick Interface

The `tick` signal contains the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `timestamp` | `number` | Current timestamp in milliseconds |
| `deltaTime` | `number` | Time elapsed since the last frame in milliseconds |
| `frame` | `number` | Current frame number |
| `deltaRatio` | `number` | Ratio of deltaTime to the target frame time (useful for frame-independent animations) |

## Accessing Context

You can access the context through the `element.props.context` property in any component:

```html
<script>
  import { mount, effect } from 'canvasengine';

  mount((element) => {
    const context = element.props.context;
    
    // Access PixiJS Application
    const app = context.app();
    if (app) {
      console.log('PixiJS Application:', app);
    }
    
    // Access canvas size signal
    const canvasSize = context.canvasSize();
    console.log('Canvas size:', canvasSize.width, canvasSize.height);
    
    // Subscribe to canvas size changes using effect
    effect(() => {
      const size = context.canvasSize();
      console.log('Canvas resized:', size.width, size.height);
    });
    
    // Access global loader
    context.globalLoader.onProgress((progress) => {
      console.log('Loading progress:', progress * 100 + '%');
    });
    
    context.globalLoader.onComplete(() => {
      console.log('All assets loaded!');
    });
    
    // Access tick signal
    const tick = context.tick();
    console.log('Current frame:', tick.frame);
    console.log('Delta time:', tick.deltaTime);
    
    // Subscribe to tick updates using effect
    effect(() => {
      const tick = context.tick();
      console.log('Frame:', tick.frame, 'Delta:', tick.deltaTime);
    });
    
    // Access root element
    console.log('Root element:', context.rootElement);
  });
</script>
```

## Examples

### Using Canvas Size for Responsive Layouts

```html
<Container>
  <Sprite image="background.png" />
</Container>

<script>
  import { mount, effect } from 'canvasengine';

  mount((element) => {
    const context = element.props.context;
    
    // Center sprite based on canvas size
    effect(() => {
      const size = context.canvasSize();
      const sprite = element.componentInstance;
      sprite.x = size.width / 2;
      sprite.y = size.height / 2;
      sprite.anchor.set(0.5);
    });
  });
</script>
```

### Tracking Asset Loading Progress

```html
<Container>
  <Sprite image="image1.png" />
  <Sprite image="image2.png" />
  <Sprite image="image3.png" />
</Container>

<script>
  import { mount } from 'canvasengine';

  mount((element) => {
    const context = element.props.context;
    
    // Show loading progress
    context.globalLoader.onProgress((progress) => {
      const percentage = Math.round(progress * 100);
      console.log(`Loading: ${percentage}%`);
    });
    
    // Hide loading screen when complete
    context.globalLoader.onComplete(() => {
      console.log('All assets loaded!');
      // Hide your loading screen here
    });
  });
</script>
```

### Using Tick for Frame-Independent Animations

```html
<Sprite image="sprite.png" />

<script>
  import { mount, effect } from 'canvasengine';

  mount((element) => {
    const context = element.props.context;
    const sprite = element.componentInstance;
    
    // Move sprite at constant speed regardless of FPS
    effect(() => {
      const tick = context.tick();
      // deltaRatio ensures consistent movement speed
      sprite.x += 100 * tick.deltaRatio; // 100 pixels per second
      
      if (sprite.x > 800) {
        sprite.x = 0; // Reset when off screen
      }
    });
  });
</script>
```

### Accessing PixiJS Application

```html
<Container>
  <Sprite image="sprite.png" />
</Container>

<script>
  import { mount, effect } from 'canvasengine';

  mount((element) => {
    const context = element.props.context;
    
    // Wait for app to be initialized
    effect(() => {
      const app = context.app();
      if (app) {
        console.log('PixiJS Application:', app);
        console.log('Renderer:', app.renderer);
        console.log('Stage:', app.stage);
        
        // You can now use any PixiJS API
        app.ticker.add(() => {
          // Custom ticker logic
        });
      }
    });
  });
</script>
```
