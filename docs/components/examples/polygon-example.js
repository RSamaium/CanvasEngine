export default {
  title: "Polygon Example",
  description: "Multiple polygons with different shapes, colors and styles to demonstrate polygon drawing capabilities",
  files: {
    'app.ce': `<Canvas width="100%" height="100%">
  <Container>
    <Graphics draw />
  </Container>
</Canvas>

<script>
/**
 * Draw various polygon shapes to demonstrate polygon functionality
 * @param {Graphics} g - The PIXI Graphics object
 * @example
 * // Creates multiple polygons with different shapes and styles
 * draw(graphicsObject);
 */
const draw = (g) => {
    // Triangle - Simple 3-sided polygon
    const triangle = [100, 50, 200, 50, 150, 150];
    g.poly(triangle).fill(0xff6b6b);
    
    // Rectangle using polygon coordinates
    const rectangle = [250, 50, 350, 50, 350, 150, 250, 150];
    g.poly(rectangle).fill(0x4ecdc4);
    
    // Pentagon - 5-sided polygon
    const pentagon = [
        450, 80,   // top
        480, 120,  // top right
        465, 170,  // bottom right
        435, 170,  // bottom left
        420, 120   // top left
    ];
    g.poly(pentagon).fill(0xffe66d);
    
    // Hexagon - 6-sided polygon
    const hexagon = [
        550, 80,   // top
        580, 100,  // top right
        580, 140,  // bottom right
        550, 160,  // bottom
        520, 140,  // bottom left
        520, 100   // top left
    ];
    g.poly(hexagon).fill(0xa8e6cf);
    
    // Star shape - more complex polygon
    const star = [
        400, 220,  // top point
        410, 250,  // inner right
        440, 250,  // outer right
        420, 270,  // inner bottom right
        430, 300,  // bottom right point
        400, 280,  // inner bottom
        370, 300,  // bottom left point
        380, 270,  // inner bottom left
        360, 250,  // outer left
        390, 250   // inner left
    ];
    g.poly(star).fill(0xff8b94);
    
    // Arrow shape
    const arrow = [
        100, 220,  // left point
        150, 200,  // top left
        150, 210,  // inner top left
        200, 210,  // inner top right
        200, 200,  // top right
        250, 220,  // right point
        200, 240,  // bottom right
        200, 230,  // inner bottom right
        150, 230,  // inner bottom left
        150, 240   // bottom left
    ];
    g.poly(arrow).fill(0xdda0dd);
    
    // Diamond shape
    const diamond = [
        350, 350,  // top
        400, 400,  // right
        350, 450,  // bottom
        300, 400   // left
    ];
    g.poly(diamond).fill(0x98d8c8);
    
    // Complex polygon with stroke
    const complexShape = [
        500, 350,
        550, 320,
        600, 350,
        580, 400,
        550, 430,
        520, 400
    ];
    g.poly(complexShape)
     .fill(0x06d6a0)
     .stroke({ width: 3, color: 0x118ab2 });
}
</script>`
  }
} 