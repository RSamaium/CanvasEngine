# Performance Optimization Guide

When building games or visualizations with many elements (1000+), performance becomes critical. This guide covers best practices for optimizing CanvasEngine applications.

## Understanding the Reactive System Cost

CanvasEngine uses a reactive system based on signals. Each signal creates:
- An RxJS subscription
- Change detection overhead
- Component update callbacks

**Rule of thumb**: Minimize the number of signals, especially for properties that change frequently.

### Signal Count Impact

| Elements | Signals/Element | Total Signals | Estimated Cost |
|----------|-----------------|---------------|----------------|
| 100 | 5 | 500 | Low |
| 1000 | 5 | 5,000 | Medium |
| 5000 | 5 | 25,000 | High |
| 5000 | 2 | 10,000 | Medium |

## Optimization Strategies

### 1. Reduce Signal Granularity

Instead of creating signals for every property, only use signals for properties that need reactive updates from external sources.

**Before (expensive)**:
```javascript
// 5 signals per element = 25,000 signals for 5000 elements
function generateItems(count) {
  return Array.from({ length: count }, (_, i) => ({
    x: signal(i * 10),
    y: signal(i * 10),
    rotation: signal(0),      // Animated - DON'T use signal!
    alpha: signal(1),         // Animated - DON'T use signal!
    scale: signal(1),         // Animated - DON'T use signal!
  }));
}
```

**After (optimized)**:
```javascript
// 2 signals per element = 10,000 signals for 5000 elements
function generateItems(count) {
  return Array.from({ length: count }, (_, i) => ({
    x: signal(i * 10),        // Position needs signals for loop
    y: signal(i * 10),
    rotationSpeed: Math.random() * 0.1,  // Plain value
    alphaBase: 0.5 + Math.random() * 0.5, // Plain value
    scaleBase: 0.8 + Math.random() * 0.4, // Plain value
  }));
}
```

### 2. Imperative Animation in tick()

For animations, update Pixi objects directly instead of going through signals:

```html
<script>
  import { tick } from 'canvasengine';
  
  tick((tickValue, element) => {
    // Get the container with sprites
    const container = element.componentInstance.children[0];
    const sprites = container.children;
    const items = itemsSignal();
    
    sprites.forEach((sprite, i) => {
      const item = items[i];
      // Direct Pixi manipulation - no signal overhead!
      sprite.rotation = item.rotationSpeed * tickValue.frame;
      sprite.alpha = item.alphaBase + Math.sin(tickValue.frame * 0.05) * 0.2;
    });
  });
</script>
```

### 3. Incremental Collection Updates

When adding/removing elements, avoid resetting the entire collection:

**Before (expensive)**:
```javascript
// This triggers a full reset - destroys and recreates ALL elements
items.set(generateItems(newCount));
```

**After (optimized)**:
```javascript
effect(() => {
  const targetCount = elementCount();
  const currentItems = items();
  const currentCount = currentItems.length;
  
  if (targetCount > currentCount) {
    // Add only new elements
    const newItems = [...currentItems];
    for (let i = currentCount; i < targetCount; i++) {
      newItems.push(createItem(i));
    }
    items.set(newItems);
  } else if (targetCount < currentCount) {
    // Remove from end - avoids full recreation
    items.set(currentItems.slice(0, targetCount));
  }
});
```

### 4. Frame Throttling

For non-critical updates, skip frames:

```javascript
tick((tickValue) => {
  // Update every 2nd frame (30 FPS effective)
  if (tickValue.frame % 2 !== 0) return;
  
  // Or every 3rd frame (20 FPS effective)
  if (tickValue.frame % 3 !== 0) return;
  
  // Animation logic
});
```

### 5. Level of Detail (LOD)

Reduce visual complexity based on element count:

```javascript
tick((tickValue, element) => {
  const count = items().length;
  const sprites = getSprites(element);
  
  sprites.forEach((sprite, i) => {
    // Always animate rotation (cheap)
    sprite.rotation += items()[i].rotationSpeed;
    
    // Animate alpha only below 5000 elements
    if (count < 5000) {
      sprite.alpha = 0.5 + Math.sin(tickValue.frame * 0.02) * 0.5;
    }
    
    // Animate scale only below 2000 elements
    if (count < 2000) {
      const scale = 1 + Math.sin(tickValue.frame * 0.01) * 0.2;
      sprite.scale.set(scale);
    }
  });
});
```

### 6. Viewport Culling

Use the `viewportCull` directive to hide off-screen elements:

```html
<Viewport worldWidth="5000" worldHeight="5000">
  <Container viewportCull={true}>
    @for (item of items) {
      <Sprite x={@item.x} y={@item.y} />
    }
  </Container>
</Viewport>
```

## Complete Optimized Example

```html
<Canvas>
  <Viewport worldWidth={worldWidth} worldHeight={worldHeight} drag={true}>
    <Container>
      @for (item of items) {
        <Sprite 
          image="sprite.png"
          x={@item.x}
          y={@item.y}
        />
      }
    </Container>
  </Viewport>
</Canvas>

<script>
  import { signal, computed, effect, tick } from 'canvasengine';
  
  const elementCount = signal(1000);
  let spriteRefs = [];
  
  // Optimized: Only position signals
  function createItem(index, cols) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: signal(col * 50),
      y: signal(row * 50),
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      alphaBase: 0.5 + Math.random() * 0.5,
    };
  }
  
  const items = signal([]);
  
  // Incremental updates
  effect(() => {
    const target = elementCount();
    const current = items();
    const cols = Math.ceil(Math.sqrt(target));
    
    if (target > current.length) {
      const newItems = [...current];
      for (let i = current.length; i < target; i++) {
        newItems.push(createItem(i, cols));
      }
      items.set(newItems);
      spriteRefs = []; // Reset cache
    } else if (target < current.length) {
      items.set(current.slice(0, target));
      spriteRefs = [];
    }
  });
  
  // Imperative animation
  tick((tickValue, element) => {
    const viewport = element.componentInstance?.children?.[0];
    const container = viewport?.children?.[0];
    
    if (spriteRefs.length === 0 && container) {
      spriteRefs = container.children;
    }
    
    const data = items();
    const count = data.length;
    
    spriteRefs.forEach((sprite, i) => {
      if (!sprite || !data[i]) return;
      
      sprite.rotation += data[i].rotationSpeed;
      
      // LOD: alpha only below 3000
      if (count < 3000) {
        sprite.alpha = data[i].alphaBase + 
          Math.sin(tickValue.frame * 0.02) * 0.3;
      }
    });
  });
  
  const worldWidth = computed(() => Math.ceil(Math.sqrt(elementCount())) * 50);
  const worldHeight = worldWidth;
</script>
```

## Performance Checklist

- [ ] Minimize signals per element (2-3 max for large collections)
- [ ] Use imperative updates in `tick()` for animations
- [ ] Implement incremental add/remove for collections
- [ ] Add frame throttling for non-critical updates
- [ ] Implement LOD for very large element counts
- [ ] Enable viewport culling for scrollable worlds
- [ ] Profile with browser DevTools to identify bottlenecks

## Benchmark

Run the benchmark in `sample/src/benchmark.ce` to test different optimization modes:

```bash
cd sample
npm run dev
```

Press `1-4` to switch between optimization modes and observe FPS differences.

