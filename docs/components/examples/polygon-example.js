export default {
  title: "Polygon Example",
  description: "A polygon drawn using custom path coordinates with a purple fill",
  files: {
    'app.ce': `<Canvas width={800} height={600}>
  <Container>
    <Graphics draw />
  </Container>
</Canvas>

<script>
const draw = (g) => {
    const path = [600, 370, 700, 460, 780, 420, 730, 570, 590, 520];
    g.poly(path).fill(0x3500fa);
}
</script>`
  }
} 