# Dynamic Components

CanvasEngine allows you to create and use dynamic components that can be defined directly in your application or loaded dynamically at runtime.

## Defining Custom Components

You can define your own components directly in your application using the script tag:

```html
<script>
const MyComponent = {
  name: 'MyComponent',
  props: {
    width: Number,
    height: Number,
    color: String
  }
};
</script>

<!-- Using the custom component -->
<MyComponent.name ...props />
```
