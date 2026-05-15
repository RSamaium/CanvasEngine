export default {
  title: "Focus Navigation with DOM",
  description: "Navigate through a scrollable list of DOM buttons using keyboard controls (arrow keys or gamepad)",
  defaultViewMode: "both",
  files: {
    "app.ce": `
    <Canvas>
    <Container>
  <Text
    text="Focus Navigation DOM Example"
    x={0}
    y={-250}
    style={{ fontSize: 32, fill: "#ecf0f1" }}
  />

  <Navigation
    tabindex={tabindex}
    controls={controls}
  >
    <DOMContainer>
      <div class="button-container">
        <div>
          <div>
            @for (item of items) {
              <button tabindex={item().id}>{item().label}</button>
            }
          </div>
        </div>
      </div>
    </DOMContainer>
  </Navigation>
</Container>
</Canvas>

<style scoped>
  .button-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
    height: 300px;
  }
  button {
    padding: 10px 20px;
    font-size: 18px;
    cursor: pointer;
    background: #34495e;
    color: white;
    border: 2px solid transparent;
    border-radius: 4px;
    transition: all 0.2s;
  }
  button:focus {
    background: #3498db;
    border-color: white;
    outline: none;
    transform: scale(1.05);
  }
</style>

<script>
  import { signal, effect } from "canvasengine";

  const tabindex = signal(0);

  effect(() => {
    console.log("Selected index:", tabindex());
  });

  const items100 = new Array(20).fill(0).map((_, index) => ({ id: index, label: \`Item \${index + 1}\` }));
  const items = signal(items100);

  const controls = signal({
    up: {
      repeat: true,
      bind: "up"
    },
    down: {
      repeat: true,
      bind: "down"
    },
    action: {
      bind: ["space", "enter"]
    },
    gamepad: {
      enabled: true
    }
  });
</script>`
  }
};
