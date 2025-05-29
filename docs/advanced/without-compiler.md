# Using CanvasEngine Without the Compiler

CanvasEngine provides a powerful template syntax that gets compiled to JavaScript functions. However, you can also use CanvasEngine directly without the compiler by using the core functions: `h`, `loop`, and `cond` from the `canvasengine` package.

This approach gives you more control and can be useful for:
- Dynamic template generation
- Integration with existing build systems
- Learning how the compiler works under the hood
- Performance-critical applications where you want to avoid compilation overhead

## Core Functions

### `h(component, props?, children?)`
Creates a component instance. This is the equivalent of JSX elements.

### `loop(iterable, callback)`
Renders a list of items. This is the equivalent of `@for` loops.

### `cond(condition, callback)`
Conditionally renders content. This is the equivalent of `@if` statements.

## Components

### Basic Component
Instead of writing:
```html
<Canvas />
```

Use:
```javascript
h('Canvas')
```

### Component with Properties
Instead of writing:
```html
<Canvas width="800" height="600" />
```

Use:
```javascript
h('Canvas', { width: '800', height: '600' })
```

### Dynamic Properties
Instead of writing:
```html
<Canvas width={screenWidth} height={screenHeight} />
```

Use:
```javascript
h('Canvas', { width: screenWidth, height: screenHeight })
```

### Computed Properties
For reactive expressions, instead of writing:
```html
<Canvas width={x * 2} />
```

Use:
```javascript
h('Canvas', { width: computed(() => x() * 2) })
```

### Complex Computed Properties
For multiple reactive variables:
```html
<Canvas width={x * 2 * y} />
```

Use:
```javascript
h('Canvas', { width: computed(() => x() * 2 * y()) })
```

### Object Properties
Instead of writing:
```html
<Sprite sheet={{
    definition,
    playing: "stand",
    params: {
        direction: "right"
    },
    onFinish
}} />
```

Use:
```javascript
h('Sprite', { 
  sheet: { 
    definition, 
    playing: "stand", 
    params: { 
      direction: "right" 
    }, 
    onFinish 
  } 
})
```

### Array Properties
Instead of writing:
```html
<Canvas positions={[x, 20]} />
```

Use:
```javascript
h('Canvas', { positions: computed(() => [x(), 20]) })
```

### Event Handlers
Instead of writing:
```html
<Sprite click={handleClick} />
```

Use:
```javascript
h('Sprite', { click: handleClick })
```

### Inline Event Handlers
Instead of writing:
```html
<Sprite click={() => console.log('clicked')} />
```

Use:
```javascript
h('Sprite', { click: () => console.log('clicked') })
```

### Spread Operator
Instead of writing:
```html
<Canvas ...props />
```

Use:
```javascript
h('Canvas', props)
```

### Component as Property
Instead of writing:
```html
<Canvas child={<Sprite />} />
```

Use:
```javascript
h('Canvas', { child: h('Sprite') })
```

### Function Returning Component
Instead of writing:
```html
<Canvas child={() => <Sprite />} />
```

Use:
```javascript
h('Canvas', { child: () => h('Sprite') })
```

## Children

### Single Child
Instead of writing:
```html
<Canvas>
    <Sprite />
</Canvas>
```

Use:
```javascript
h('Canvas', null, h('Sprite'))
```

### Multiple Children
Instead of writing:
```html
<Canvas>
    <Sprite />
    <Text />
</Canvas>
```

Use:
```javascript
h('Canvas', null, [
    h('Sprite'),
    h('Text')
])
```

## Loops

### Basic Loop
Instead of writing:
```html
@for (sprite of sprites) {
    <Sprite />
}
```

Use:
```javascript
loop(sprites, sprite => h('Sprite'))
```

### Loop with Properties
Instead of writing:
```html
@for (sprite of sprites) {
    <Sprite x={sprite.x} y={sprite.y} />
}
```

Use:
```javascript
loop(sprites, sprite => h('Sprite', { x: sprite.x, y: sprite.y }))
```

### Loop with Index
Instead of writing:
```html
@for ((sprite, index) of sprites) {
    <Sprite key={index} />
}
```

Use:
```javascript
loop(sprites, (sprite, index) => h('Sprite', { key: index }))
```

### Loop with Object Property
Instead of writing:
```html
@for (sprite of sprites.items) {
    <Sprite />
}
```

Use:
```javascript
loop(sprites.items, sprite => h('Sprite'))
```

### Loop with Function Call
Instead of writing:
```html
@for (sprite of getSprites()) {
    <Sprite />
}
```

Use:
```javascript
loop(getSprites(), sprite => h('Sprite'))
```

### Nested Loops
Instead of writing:
```html
@for (sprite of sprites) {
    @for (other of others) {
        <Sprite />
    }
}
```

Use:
```javascript
loop(sprites, sprite => 
    loop(others, other => h('Sprite'))
)
```

### Loop in Component
Instead of writing:
```html
<Canvas>
    @for (sprite of sprites) {
        <Sprite />
    }
</Canvas>
```

Use:
```javascript
h('Canvas', null, loop(sprites, sprite => h('Sprite')))
```

## Conditions

### Basic Condition
Instead of writing:
```html
@if (sprite) {
    <Sprite />
}
```

Use:
```javascript
cond(sprite, () => h('Sprite'))
```

### Property-based Condition
Instead of writing:
```html
@if (sprite.visible) {
    <Sprite />
}
```

Use:
```javascript
cond(sprite.visible, () => h('Sprite'))
```

### Function-based Condition
Instead of writing:
```html
@if (isVisible()) {
    <Sprite />
}
```

Use:
```javascript
cond(isVisible(), () => h('Sprite'))
```

### Complex Conditions
Instead of writing:
```html
@if (!sprite && other) {
    <Sprite />
}
```

Use:
```javascript
cond(computed(() => !sprite() && other()), () => h('Sprite'))
```

### Multiple Conditions
Instead of writing:
```html
@if (sprite) {
    <Sprite />
}
@if (other) {
    <Text />
}
```

Use:
```javascript
[
    cond(sprite, () => h('Sprite')),
    cond(other, () => h('Text'))
]
```

### Nested Conditions
Instead of writing:
```html
@if (sprite.visible) {
    @if (deep) {
        <Sprite />
    }
}
```

Use:
```javascript
cond(sprite.visible, () => 
    cond(deep, () => h('Sprite'))
)
```

### Condition with Multiple Elements
Instead of writing:
```html
@if (sprite.visible) {
    <Sprite />
    <Text />
}
```

Use:
```javascript
cond(sprite.visible, () => [
    h('Sprite'),
    h('Text')
])
```

## Combining Loops and Conditions

### Condition in Loop
Instead of writing:
```html
<Canvas>
    @for (sprite of sprites) {
        @if (sprite.visible) {
            <Sprite />
        }
    }
</Canvas>
```

Use:
```javascript
h('Canvas', null, 
    loop(sprites, sprite => 
        cond(sprite.visible, () => h('Sprite'))
    )
)
```

### Multiple Loops
Instead of writing:
```html
<Canvas>
    @for (sprite of sprites) {
        <Sprite />
    }
    @for (other of others) {
        <Text />
    }
</Canvas>
```

Use:
```javascript
h('Canvas', null, [
    loop(sprites, sprite => h('Sprite')),
    loop(others, other => h('Text'))
])
```

## Complete Example

Here's a complete example showing how to build a complex component without the compiler:

```javascript
import { h, loop, cond, computed } from 'canvasengine';

function GameScene({ sprites, enemies, showUI }) {
    return h('Canvas', { width: 800, height: 600 }, [
        // Background
        h('Sprite', { texture: 'background' }),
        
        // Player sprites
        loop(sprites, sprite => 
            cond(sprite.visible, () => 
                h('Sprite', {
                    x: sprite.x,
                    y: sprite.y,
                    texture: sprite.texture,
                    click: () => sprite.onClick()
                })
            )
        ),
        
        // Enemies
        loop(enemies, (enemy, index) => 
            h('Sprite', {
                key: index,
                x: computed(() => enemy.x() + 10),
                y: computed(() => enemy.y() + 10),
                texture: enemy.texture,
                tint: enemy.isHit ? 0xff0000 : 0xffffff
            })
        ),
        
        // UI overlay
        cond(showUI, () => 
            h('Container', null, [
                h('Text', { text: 'Score: 100', x: 10, y: 10 }),
                h('Text', { text: 'Lives: 3', x: 10, y: 30 })
            ])
        )
    ]);
}
```

This approach gives you the full power of CanvasEngine while maintaining complete control over your component structure and logic.