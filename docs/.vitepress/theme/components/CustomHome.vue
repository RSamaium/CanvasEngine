<template>
  <div class="custom-home">
    <!-- Custom Navbar -->
    <nav class="custom-navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          
        </div>
        <div class="navbar-links">
          <a href="/get_started/installation" class="nav-link">Documentation</a>
          <a href="https://github.com/RSamaium/CanvasEngine" target="_blank" class="nav-link">Github</a>
          <a href="https://discord.gg/W38yDyGfwC" class="nav-link">Discord</a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <img src="/logo.png" alt="Canvas Engine" class="logo" />
            <span>Build 2D games faster with AI</span>
          </h1>
          <p class="hero-subtitle">
            Install the CanvasEngine skill, prompt your coding agent, and start from a playable game scene.
          </p>
          <p class="hero-description">
            CanvasEngine gives AI assistants the framework context they need to generate .ce components,
            tilemaps, controls, joystick input, sound, weather, FX particles, DOM overlays, and reactive game logic.
          </p>
          <div class="hero-command" aria-label="Install the CanvasEngine AI skill">
            <span class="command-label">Install AI skill</span>
            <code>npx skills add https://github.com/RSamaium/CanvasEngine</code>
          </div>
          <div class="hero-prompt">
            <span>Try asking:</span>
            <strong>create mario style game</strong>
          </div>
          <div class="hero-actions">
            <a href="/get_started/installation" class="btn btn-primary">
              Start Building
            </a>
            <a href="https://github.com/RSamaium/CanvasEngine" class="btn btn-secondary" target="_blank">
              <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-playground">
            <Playground
              title="Playable CanvasEngine mini project"
              description="Use arrow keys to move the player, drag it with the pointer, or switch to Code and edit the scene."
              :files="heroDemoFiles"
              :height="520"
              defaultViewMode="preview"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="features-container">
        <h2 class="section-title">Everything for 2D games</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h3>Reactive game components</h3>
            <p>Compose scenes with .ce components, signals, lifecycle hooks, template syntax, sprites, graphics, text, and canvas layouts.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h3>Tilemaps and worlds</h3>
            <p>Render Tiled Map Editor worlds, object layers, animated tiles, and large maps with Viewport pan, zoom, clamp, and culling.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3>Weather and ambience</h3>
            <p>Add rain, snow, fog, clouds, night ambience, shadows, footprints, and atmospheric presets directly to your scenes.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="8" width="18" height="4" rx="1"/>
                <path d="M12 8v13"/>
                <path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"/>
                <path d="M7.5 8a2.5 2.5 0 010-5A4.8 8 0 0112 8a4.8 8 0 014.5-5 2.5 2.5 0 010 5"/>
              </svg>
            </div>
            <h3>Controls for every device</h3>
            <p>Wire gameplay to keyboard, gamepad, and virtual joystick controls, with drag and drop for pointer-driven interactions.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h3>Sound and FX particles</h3>
            <p>Trigger sound, ambience, hit sparks, smoke, magic bursts, fire, pickups, explosions, and custom particle effects.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h3>Canvas and DOM together</h3>
            <p>Use DOMContainer to mix HTML overlays, menus, forms, and UI panels with the same game scene structure.</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import Playground from './Playground.vue'

const heroDemoFiles = {
  'app.ce': `
<Canvas backgroundColor="#111827" width="100%" height="100%" antialias="true">
  <Container width="100%" height="100%">
    <Container x={worldX} y={worldY}>
      @for (tile of tiles) {
        <Sprite image="/base.png" rectangle={{ x: tile.sx, y: tile.sy, width: 32, height: 32 }} x={tile.x} y={tile.y} width={48} height={48} />
      }

      @for (prop of props) {
        <Sprite image="/base.png" rectangle={{ x: prop.sx, y: prop.sy, width: prop.sw, height: prop.sh }} x={prop.x} y={prop.y} width={prop.w} height={prop.h} />
      }

      <Sprite x={playerX} y={playerY} sheet={{
        definition: heroDefinition,
        playing: animation,
        params: { direction }
      }} controls={controls} drag={drag} />

      <Circle x={sparkX} y={sparkY} radius={3} color="#fff176" alpha={sparkAlpha} />
      <Circle x={sparkX2} y={sparkY2} radius={3} color="#80deea" alpha={sparkAlpha} />
      <Circle x={sparkX3} y={sparkY3} radius={4} color="#ff8a65" alpha={sparkAlpha} />

      <Sprite image="/LightShadow_pipo.png" x={-24} y={-12} width={360} height={260} alpha={0.26} />
    </Container>

    <DOMContainer x={18} y={18}>
      <div class="hud">
        <strong>RPG mini scene</strong>
        <span>hero.png</span>
        <span>base.png</span>
        <span>controls + drag</span>
      </div>
    </DOMContainer>

    <Text text="Move with arrows, drag the hero, switch to Code to edit" x={20} y={382} color="#ffffff" size={15} fontFamily="Arial" />
  </Container>
</Canvas>

<script>
  import { signal, computed, tick } from "canvasengine";

  const tileSize = 48;
  const worldX = signal(36);
  const worldY = signal(52);
  const playerX = signal(330);
  const playerY = signal(210);
  const clock = signal(0);
  const direction = signal("down");
  const animation = signal("stand");
  const speed = 7;

  const ground = { sx: 0, sy: 0 };
  const path = { sx: 0, sy: 192 };
  const flowers = { sx: 0, sy: 128 };

  const layout = [
    "gggggggggggggg",
    "gggffffggggggg",
    "gggppppppppggg",
    "gggppggggppggg",
    "gggppggggppggg",
    "gggppppppppggg",
    "ggggggffgggggg",
  ];

  const tiles = layout.flatMap((row, y) =>
    [...row].map((type, x) => {
      const source = type === "p" ? path : type === "f" ? flowers : ground;
      return {
        x: x * tileSize,
        y: y * tileSize,
        sx: source.sx,
        sy: source.sy,
      };
    })
  );

  const props = [
    { x: 36, y: 18, sx: 0, sy: 0, sw: 32, sh: 64, w: 58, h: 92 },
    { x: 112, y: 22, sx: 32, sy: 0, sw: 32, sh: 64, w: 58, h: 92 },
    { x: 580, y: 24, sx: 64, sy: 0, sw: 32, sh: 64, w: 58, h: 92 },
    { x: 94, y: 270, sx: 96, sy: 192, sw: 32, sh: 32, w: 44, h: 44 },
    { x: 532, y: 256, sx: 128, sy: 192, sw: 32, sh: 32, w: 44, h: 44 },
    { x: 478, y: 72, sx: 32, sy: 256, sw: 32, sh: 32, w: 48, h: 48 },
    { x: 628, y: 202, sx: 0, sy: 320, sw: 32, sh: 32, w: 48, h: 48 },
  ];

  const heroDefinition = {
    id: "docs-hero",
    image: "/hero.png",
    width: 96,
    height: 128,
    framesWidth: 3,
    framesHeight: 4,
    rectWidth: 32,
    rectHeight: 32,
    scale: [1.55, 1.55],
    textures: {
      stand: {
        animations: ({ direction }) => [
          [{ time: 0, frameX: 1, frameY: rowFor(direction) }],
        ],
      },
      walk: {
        animations: ({ direction }) => [
          [
            { time: 0, frameX: 0, frameY: rowFor(direction) },
            { time: 8, frameX: 1, frameY: rowFor(direction) },
            { time: 16, frameX: 2, frameY: rowFor(direction) },
            { time: 24, frameX: 1, frameY: rowFor(direction) },
          ],
        ],
      },
    },
  };

  function rowFor(value) {
    return {
      down: 0,
      left: 1,
      right: 2,
      up: 3,
    }[value] ?? 0;
  }

  const markMove = (value) => {
    direction.set(value);
    animation.set("walk");
    clearTimeout(markMove.timer);
    markMove.timer = setTimeout(() => animation.set("stand"), 130);
  };

  const controls = signal({
    left: {
      repeat: true,
      bind: "left",
      keyDown() {
        markMove("left");
        playerX.update((x) => Math.max(90, x - speed));
      },
    },
    right: {
      repeat: true,
      bind: "right",
      keyDown(_, payload) {
        markMove("right");
        playerX.update((x) => Math.min(560, x + speed * (payload?.power ?? 1)));
      },
    },
    up: {
      repeat: true,
      bind: "up",
      keyDown() {
        markMove("up");
        playerY.update((y) => Math.max(86, y - speed));
      },
    },
    down: {
      repeat: true,
      bind: "down",
      keyDown() {
        markMove("down");
        playerY.update((y) => Math.min(282, y + speed));
      },
    },
    joystick: {
      enabled: true,
      moveInterval: 40,
      threshold: 0.1,
    },
  });

  const drag = {
    direction: "all",
    start() {
      animation.set("walk");
    },
    end(event) {
      animation.set("stand");
    },
  };

  const sparkAlpha = computed(() => 0.25 + Math.abs(Math.sin(clock() * 2)) * 0.75);
  const sparkX = computed(() => playerX() + 42 + Math.sin(clock() * 3) * 16);
  const sparkY = computed(() => playerY() + 10 + Math.cos(clock() * 2) * 14);
  const sparkX2 = computed(() => playerX() + 18 + Math.cos(clock() * 4) * 14);
  const sparkY2 = computed(() => playerY() + 32 + Math.sin(clock() * 3) * 10);
  const sparkX3 = computed(() => playerX() + 36 + Math.sin(clock() * 5) * 12);
  const sparkY3 = computed(() => playerY() + 42 + Math.cos(clock() * 5) * 12);

  tick(() => {
    clock.update((value) => value + 0.07);
  });
<\/script>

<style>
  .hud {
    align-items: center;
    background: rgba(255, 255, 255, 0.74);
    border: 1px solid rgba(18, 50, 74, 0.12);
    border-radius: 999px;
    color: #12324a;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 7px 10px;
    font: 700 12px Arial, sans-serif;
  }

  .hud span {
    background: rgba(66, 184, 131, 0.18);
    border-radius: 999px;
    padding: 3px 8px;
  }
<\/style>
`,
}
</script>

<style scoped>
.custom-home {
  --primary-color: #646cff;
  --primary-color-light: #747bff;
  --secondary-color: #42b883;
  --text-color: #213547;
  --text-color-light: #64748b;
  --bg-color: #ffffff;
  --border-color: #e2e8f0;
  --card-bg: #f8fafc;
}

.dark .custom-home {
  --text-color: #f1f5f9;
  --text-color-light: #94a3b8;
  --bg-color: #0f172a;
  --border-color: #334155;
  --card-bg: #1e293b;
}

/* Custom Navbar */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
}

.dark .custom-navbar {
  background: rgba(15, 23, 42, 0.95);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  position: relative;
}

.nav-link:hover {
  color: var(--primary-color);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: width 0.2s;
}

.nav-link:hover::after {
  width: 100%;
}

/* Hero Section */
.hero {
  background:
    radial-gradient(circle at 78% 18%, rgba(66, 184, 131, 0.22), transparent 28%),
    radial-gradient(circle at 12% 16%, rgba(100, 108, 255, 0.2), transparent 32%),
    linear-gradient(135deg, var(--bg-color) 0%, #f1f5f9 100%);
  padding: 8rem 2rem 5rem;
  min-height: 82vh;
  display: flex;
  align-items: center;
}

.dark .hero {
  background:
    radial-gradient(circle at 78% 18%, rgba(66, 184, 131, 0.2), transparent 28%),
    radial-gradient(circle at 12% 16%, rgba(100, 108, 255, 0.22), transparent 32%),
    linear-gradient(135deg, var(--bg-color) 0%, #1e293b 100%);
}

.hero-content {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(480px, 1.1fr);
  gap: 4rem;
  align-items: center;
}

.hero-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.25rem;
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.logo {
  width: min(320px, 100%);
  height: auto;
}

.hero-title span {
  max-width: 720px;
}

.gradient-text {
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.45rem;
  color: var(--text-color);
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.35;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--text-color-light);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.hero-command {
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.85rem;
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.18);
  color: #ffffff;
  margin-bottom: 1rem;
  max-width: 640px;
  overflow-x: auto;
  padding: 1rem;
}

.command-label {
  color: #9ca3af;
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 0.55rem;
  text-transform: uppercase;
}

.hero-command code {
  color: #ffffff;
  font-family: 'Fira Code', monospace;
  font-size: 0.96rem;
  white-space: nowrap;
}

.hero-prompt {
  align-items: center;
  color: var(--text-color-light);
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 2rem;
}

.hero-prompt strong {
  background: rgba(66, 184, 131, 0.16);
  border: 1px solid rgba(66, 184, 131, 0.35);
  border-radius: 999px;
  color: var(--text-color);
  padding: 0.45rem 0.75rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-color-light);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 108, 255, 0.3);
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--text-color);
  border-color: var(--border-color);
}

.btn-secondary:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.github-icon {
  width: 1.2rem;
  height: 1.2rem;
}

/* Hero Demo */
.hero-visual {
  min-width: 0;
}

.hero-playground {
  border-radius: 1.25rem;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.28);
  overflow: hidden;
  transform: rotateY(-5deg) rotateX(2deg);
}

.hero-playground :deep(.playground-container) {
  border: 1px solid rgba(148, 163, 184, 0.36);
  border-radius: 1.25rem;
  margin: 0;
}

.hero-playground :deep(.playground-header) {
  padding: 1rem;
}

.hero-playground :deep(.header-content h3) {
  font-size: 1.05rem;
}

.hero-playground :deep(.playground-description) {
  font-size: 0.9rem;
  line-height: 1.4;
}

.hero-playground :deep(.preview-header),
.hero-playground :deep(.console-accordion) {
  display: none;
}

/* Features Section */
.features {
  padding: 6rem 2rem;
  background: var(--card-bg);
}

.features-container {
  max-width: 1400px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 4rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
  align-items: start;
}

.feature-card {
  background: var(--bg-color);
  padding: 2.5rem;
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.dark .feature-card:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.feature-icon svg {
  width: 2rem;
  height: 2rem;
  color: white;
}

.feature-card h3 {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
  line-height: 1.3;
}

.feature-card p {
  color: var(--text-color-light);
  line-height: 1.6;
  font-size: 1rem;
  flex-grow: 1;
}

.section-description {
  text-align: center;
  font-size: 1.2rem;
  color: var(--text-color-light);
  margin-bottom: 4rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Code Example Section */
.code-example {
  padding: 6rem 2rem;
  background: var(--bg-color);
}

.code-showcase {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  max-width: 1000px;
  margin: 0 auto;
}

.code-block {
  background: #1e293b;
  border-radius: 1rem;
  padding: 2rem;
  overflow-x: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.code-block pre {
  margin: 0;
  color: #e2e8f0;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}

.code-description h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.code-description p {
  color: var(--text-color-light);
  line-height: 1.6;
  font-size: 1.1rem;
}

/* CTA Section */
.cta {
  padding: 6rem 2rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  text-align: center;
}

.cta-content h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.cta-content p {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta .btn-primary {
  background: white;
  color: var(--primary-color);
}

.cta .btn-primary:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
}

.cta .btn-outline {
  background: transparent;
  color: white;
  border-color: white;
}

.cta .btn-outline:hover {
  background: white;
  color: var(--primary-color);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 1rem;
  }
  
  .navbar-links {
    gap: 1rem;
  }
  
  .hero {
    padding: 6rem 1rem 4rem;
  }
  
  .hero-content {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 3rem;
  }
  
  .hero-title {
    align-items: center;
    font-size: 2.5rem;
  }

  .hero-playground {
    transform: none;
  }
  
  .code-showcase {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .feature-card {
    padding: 2rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .cta-content h2 {
    font-size: 2rem;
  }
  
  .cta-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-large {
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .navbar-links {
    gap: 0.5rem;
  }
  
  .nav-link {
    font-size: 0.9rem;
  }
  
  .hero {
    padding: 5rem 1rem 3rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .features {
    padding: 4rem 1rem;
  }

  .code-example {
    padding: 4rem 1rem;
  }
  
  .cta {
    padding: 4rem 1rem;
  }
}
</style> 
