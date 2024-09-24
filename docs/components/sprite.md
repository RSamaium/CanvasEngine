# Use Sprite component

Common example:

```html
<script>
const definition = {
    id: "hero",
    image: "./hero_2.png",
    width: 1248,
    height: 2016,
    framesWidth: 6,
    framesHeight: 4,
    textures: {
        stand: {
             animations: ({ direction }) => [
                [ { time: 0, 0, frameY: 0 } ]
             ]
        }
    }
}

</script>
<Sprite 
    image="path/to/image.png" 
    sheet = {
        {
            definition,
            playing: "stand",
            params: {
                direction: "right"
            }
        }
    }
/>
```