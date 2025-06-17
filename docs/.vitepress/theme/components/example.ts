interface Example {
    title: string;
    description: string;
    files: Record<string, string>;
}

const examples: Example[] = [{
    title: 'Hello World',
    description: 'A simple example of how to use CanvasEngine',
    files: {
        "app.ce": `
<Canvas 
    backgroundColor="#fff" 
    width="100%" 
    height="100%" 
    antialias="true"
    >
    <Container
        width="100%" 
        height="100%" 
        justifyContent="center"
        alignItems="center">
        <HelloWorld text="CanvasEngine" color="black" />
    </Container>
</Canvas>

<script>
    import HelloWorld from "./hello.ce";
</script>
        `,
        "hello.ce": `<Text text="Hello World" size={70} fontFamily="Helvetica" x={50} y={40} />`,
    },
}, {
    title: 'Tiled Map',
    description: 'Example of using a Tiled map in CanvasEngine',
    files: {
        "app.ce": `
<Canvas>
    <TiledMap 
        map={map} 
        createLayersPerTilesZ={true} 
        basePath="/map" 
        objectLayer={(layer) => <Rect width={32} height={32} color="red" />} 
    />
</Canvas>

<script>
    import { TiledMap } from '@canvasengine/presets'
    import { signal } from 'canvasengine'
    
    let map = signal(null)
    
    fetch('/map/simplemap.tmx')
        .then((res) => res.text())
        .then((text) => {
            map.set(text)
        })
</script>
        `,
    },
}];

export default examples;