# Bar

<!-- @include: ./_before.md -->

## Usage

```html
<Canvas>
    <Bar width={200} height={20} value={50} maxValue={100} backgroundColor="#333" foregroundColor="#f00" />
</Canvas>

<script>
    import { Bar } from '@canvasengine/presets'
</script>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| backgroundColor | string | No | '#333333' | Background color of the bar |
| foregroundColor | string | No | '#ffffff' | Color of the progress bar |
| value | number | Yes | - | Current value of the progress bar |
| maxValue | number | Yes | - | Maximum value of the progress bar |
| width | number | Yes | - | Width of the bar in pixels |
| height | number | Yes | - | Height of the bar in pixels |
