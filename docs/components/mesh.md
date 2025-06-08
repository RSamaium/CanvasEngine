# Mesh

The `Mesh` component allows you to render custom 3D meshes with shaders and textures in your canvas application. It provides advanced rendering capabilities for complex geometries and custom visual effects.

## Basic Usage

```html
<Mesh 
  geometry={triangleGeometry} 
  texture="assets/texture.png"
  x={100}
  y={100}
/>
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `geometry` | `Geometry` | The geometry defining the mesh structure (vertices, indices, UVs, etc.) |
| `shader` | `Shader` | The shader to render the mesh with |
| `texture` | `Texture \| string` | The texture to apply to the mesh |
| `image` | `string` | The image URL to load as texture |
| `tint` | `number` | The tint color to apply to the mesh |
| `roundPixels` | `boolean` | Whether to round pixels for sharper rendering |

## Examples

### Basic Textured Mesh

```html
<Canvas>
  <Mesh 
    geometry={triangleGeometry} 
    texture="assets/triangle-texture.png"
    x={200}
    y={150}
    tint={0xff0000}
  />
</Canvas>

<script>
  import { Geometry } from 'pixi.js';

  // Create a simple triangle geometry
  const triangleGeometry = new Geometry()
    .addAttribute('aPosition', [
      0, 0,     // vertex 1
      100, 0,   // vertex 2
      50, 100   // vertex 3
    ], 2)
    .addIndex([0, 1, 2]);
</script>
```

### Mesh with Custom Shader

```html
<Canvas>
  <Mesh 
    geometry={planeGeometry}
    shader={customShader}
    x={100}
    y={100}
  />
</Canvas>

<script>
  import { Geometry, Shader } from 'pixi.js';

  // Create plane geometry
  const planeGeometry = new Geometry()
    .addAttribute('aPosition', [
      -50, -50,  // bottom-left
      50, -50,   // bottom-right
      50, 50,    // top-right
      -50, 50    // top-left
    ], 2)
    .addAttribute('aUV', [
      0, 1,      // bottom-left UV
      1, 1,      // bottom-right UV
      1, 0,      // top-right UV
      0, 0       // top-left UV
    ], 2)
    .addIndex([0, 1, 2, 0, 2, 3]);

  // Custom vertex shader
  const vertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aUV;
    
    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;
    
    varying vec2 vUV;
    
    void main() {
      vUV = aUV;
      gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    }
  `;

  // Custom fragment shader
  const fragmentShader = `
    precision mediump float;
    
    varying vec2 vUV;
    uniform float time;
    
    void main() {
      vec3 color = vec3(sin(vUV.x + time), cos(vUV.y + time), sin(time));
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const customShader = Shader.from(vertexShader, fragmentShader, {
    time: 0.0
  });
</script>
```

### Animated Mesh

```html
<Canvas>
  <Mesh 
    geometry={quadGeometry}
    texture="assets/animated-texture.png"
    x={centerX}
    y={centerY}
    tint={animatedTint}
    rotation={rotation}
    draw={animateMesh}
  />
</Canvas>

<script>
  import { signal } from 'canvasengine';
  import { Geometry } from 'pixi.js';

  const centerX = signal(400);
  const centerY = signal(300);
  const animatedTint = signal(0xffffff);
  const rotation = signal(0);

  // Create quad geometry
  const quadGeometry = new Geometry()
    .addAttribute('aPosition', [
      -25, -25,  // bottom-left
      25, -25,   // bottom-right
      25, 25,    // top-right
      -25, 25    // top-left
    ], 2)
    .addAttribute('aUV', [
      0, 1, 1, 1, 1, 0, 0, 0
    ], 2)
    .addIndex([0, 1, 2, 0, 2, 3]);

  const animateMesh = (mesh, delta) => {
    // Rotate the mesh
    rotation.set(rotation() + 0.02 * delta);
    
    // Animate tint color
    const time = Date.now() * 0.001;
    const r = Math.sin(time) * 0.5 + 0.5;
    const g = Math.sin(time + 2) * 0.5 + 0.5;
    const b = Math.sin(time + 4) * 0.5 + 0.5;
    animatedTint.set((r * 255 << 16) + (g * 255 << 8) + (b * 255));
  };
</script>
```

### Reactive Mesh Properties

```html
<Canvas>
  <Mesh 
    geometry={meshGeometry}
    texture={selectedTexture}
    tint={meshTint}
    roundPixels={pixelPerfect}
    x={meshX}
    y={meshY}
  />
  
  <!-- UI Controls -->
  <Container x={10} y={10}>
    <Text text="Mesh Controls" style={{ fill: 'white' }} />
  </Container>
</Canvas>

<script>
  import { signal, computed } from 'canvasengine';
  import { Geometry } from 'pixi.js';

  // Reactive properties
  const meshX = signal(200);
  const meshY = signal(150);
  const meshTint = signal(0xffffff);
  const pixelPerfect = signal(true);
  const textureIndex = signal(0);

  const textures = [
    'assets/texture1.png',
    'assets/texture2.png',
    'assets/texture3.png'
  ];

  const selectedTexture = computed(() => textures[textureIndex()]);

  // Create mesh geometry
  const meshGeometry = new Geometry()
    .addAttribute('aPosition', [
      -50, -50, 50, -50, 50, 50, -50, 50
    ], 2)
    .addAttribute('aUV', [
      0, 1, 1, 1, 1, 0, 0, 0
    ], 2)
    .addIndex([0, 1, 2, 0, 2, 3]);

  // Methods to control the mesh
  const changeTint = (color) => {
    meshTint.set(color);
  };

  const moveToPosition = (x, y) => {
    meshX.set(x);
    meshY.set(y);
  };

  const nextTexture = () => {
    textureIndex.set((textureIndex() + 1) % textures.length);
  };
</script>
```

## Advanced Usage

### Custom Geometry Creation

```html
<Canvas>
  <Mesh geometry={starGeometry} texture="assets/star.png" x={400} y={300} />
</Canvas>

<script>
  import { Geometry } from 'pixi.js';

  // Create a custom star geometry
  function createStarGeometry(points = 5, outerRadius = 50, innerRadius = 25) {
    const vertices = [];
    const uvs = [];
    const indices = [];
    
    // Center vertex
    vertices.push(0, 0);
    uvs.push(0.5, 0.5);
    
    // Star points
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      vertices.push(x, y);
      uvs.push((x / outerRadius + 1) * 0.5, (y / outerRadius + 1) * 0.5);
      
      // Create triangles from center
      if (i > 0) {
        indices.push(0, i, i + 1);
      }
    }
    
    // Close the star
    indices.push(0, points * 2, 1);
    
    return new Geometry()
      .addAttribute('aPosition', vertices, 2)
      .addAttribute('aUV', uvs, 2)
      .addIndex(indices);
  }

  const starGeometry = createStarGeometry(5, 50, 25);
</script>
```

### Performance Tips

1. **Reuse Geometries**: Create geometries once and reuse them across multiple mesh instances
2. **Batch Similar Meshes**: Group meshes with the same shader and texture for better performance
3. **Use Appropriate Precision**: Use `roundPixels` for pixel-perfect rendering when needed
4. **Optimize Shaders**: Keep fragment shaders simple for better performance on mobile devices

### Conditional Rendering

```html
<Canvas>
  <Container>
    @if (showMesh) {
      <Mesh 
        geometry={triangleGeometry}
        texture="assets/triangle.png"
        x={100}
        y={100}
      />
    }
  </Container>
</Canvas>

<script>
  import { signal } from 'canvasengine';
  import { Geometry } from 'pixi.js';

  const showMesh = signal(true);
  
  const triangleGeometry = new Geometry()
    .addAttribute('aPosition', [0, 0, 100, 0, 50, 100], 2)
    .addIndex([0, 1, 2]);
</script>
```

### Multiple Meshes with Loops

```html
<Canvas>
  <Container>
    @for (mesh of meshes) {
      <Mesh 
        geometry={@mesh.geometry}
        texture={@mesh.texture}
        x={@mesh.x}
        y={@mesh.y}
        tint={@mesh.tint}
      />
    }
  </Container>
</Canvas>

<script>
  import { signal } from 'canvasengine';
  import { Geometry } from 'pixi.js';

  const quadGeometry = new Geometry()
    .addAttribute('aPosition', [-25, -25, 25, -25, 25, 25, -25, 25], 2)
    .addAttribute('aUV', [0, 1, 1, 1, 1, 0, 0, 0], 2)
    .addIndex([0, 1, 2, 0, 2, 3]);

  const meshes = signal([
    { geometry: quadGeometry, texture: 'assets/mesh1.png', x: 100, y: 100, tint: 0xff0000 },
    { geometry: quadGeometry, texture: 'assets/mesh2.png', x: 200, y: 100, tint: 0x00ff00 },
    { geometry: quadGeometry, texture: 'assets/mesh3.png', x: 300, y: 100, tint: 0x0000ff }
  ]);
</script>
```
