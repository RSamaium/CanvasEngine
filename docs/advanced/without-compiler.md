# Usage

## Loop

```
@for (sprite of sprites) {
    [...]
}
```

Transform to:

loop(sprites, (sprite) => {  })

Condition

```
@if (sprite.visible) {
    [...]
}
```

cond(sprite.visible, () => {  })

## Component

```
<Canvas></Canvas>
```

or

```
<Canvas />
```

Transform to: h('Canvas')

Component with attribute

Dynamic attribute 

```
<Canvas [width]="x"></Canvas>
```

Transform to: h('Canvas', { width: x })

```
<Canvas [width]="x * 2"></Canvas>
```

Transform to: h('Canvas', { width: computed(() => x() * 2) })

```
<Canvas [width]="x * 2 * y"></Canvas>
```

Transform to: h('Canvas', { width: computed(() => x() * 2 * y()) })

### Static attribute

```
<Canvas width="10"></Canvas>
```

Transform to: h('Canvas', { width: 10 })

```
<Canvas width="val"></Canvas>
```

Transform to: h('Canvas', { width: 'val' })

Child

```
<Canvas>
    <Sprite />
    <Text />
</Canvas>
```

## Event

```
<Sprite (click)="onClick()"></Sprite>
```

or

```
<Sprite (click)="() => console.log('click')"></Sprite>
```

## Interpolation

{{ val }}

Transform to : h('Text', { text: val })