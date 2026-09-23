<template>
  <div class="ce-home">
    <nav class="ce-nav">
      <div class="ce-container ce-nav-inner">
        <a href="/" class="ce-brand"><span class="ce-brand-icon"><img src="/logo.png" alt="" /></span>CanvasEngine</a>
        <div class="ce-nav-links">
          <a href="/get_started/installation">Docs</a>
          <a href="/presets/weather">Presets</a>
          <a href="#showcase">Showcase</a>
          <a href="https://github.com/RSamaium/CanvasEngine" target="_blank">GitHub</a>
          <a href="https://discord.gg/W38yDyGfwC" target="_blank">Discord</a>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <header class="ce-hero">
      <div class="ce-container ce-hero-grid">
        <div class="ce-hero-copy">
          <p class="ce-eyebrow">Reactive 2D game engine · built on PixiJS</p>
          <h1>Build 2D games from <span>ready-made components</span>.</h1>
          <p class="ce-lead">
            CanvasEngine is more than a renderer. Describe your game as reactive <code>.ce</code> components,
            then plug in the systems it needs: tilemaps, cameras, controls, day &amp; night, weather,
            particles, shadows, sound and UI.
          </p>
          <div class="ce-actions">
            <a href="/get_started/start" class="ce-btn ce-btn-primary">Get started</a>
            <a href="#showcase" class="ce-btn ce-btn-ghost">See what it can do</a>
          </div>
          <div class="ce-install">
            <span>$</span>
            <code>npx degit RSamaium/CanvasEngine/starter my-game</code>
          </div>
        </div>

        <div class="ce-hero-visual">
          <div class="ce-slides">
            <figure v-for="(slide, index) in heroSlides" :key="slide.image" class="ce-slide" :style="{ animationDelay: `${index * 5}s` }">
              <img :src="slide.image" :alt="slide.label" />
              <figcaption>{{ slide.label }}</figcaption>
            </figure>
          </div>
          <div class="ce-hero-glow" aria-hidden="true"></div>
        </div>
      </div>

      <div class="ce-container">
        <ul class="ce-stats">
          <li v-for="stat in stats" :key="stat.label"><strong>{{ stat.value }}</strong><span>{{ stat.label }}</span></li>
        </ul>
      </div>
    </header>

    <!-- A scene is a component -->
    <section class="ce-section">
      <div class="ce-container ce-split">
        <div>
          <p class="ce-kicker">A scene is a component</p>
          <h2>A living world in a few lines</h2>
          <p class="ce-text">
            No render loop to write, no manual syncing between state and pixels. Each system is a component
            you place in the scene, configured with props that can be plain values or signals.
            Change the hour, the world follows.
          </p>
          <ul class="ce-checks">
            <li>Declarative <code>.ce</code> templates with <code>@if</code> / <code>@for</code></li>
            <li>Signals everywhere: props, positions, weather, time</li>
            <li>Directives for behavior: <code>controls</code>, <code>drag</code>, <code>sound</code>, <code>shake</code>…</li>
            <li>Plain Vite + TypeScript, hot reload included</li>
          </ul>
        </div>
        <div class="ce-code-card">
          <div class="ce-code-bar"><i></i><i></i><i></i><span>town.ce</span></div>
<pre class="ce-code"><code><span class="t">&lt;Canvas&gt;</span>
  <span class="t">&lt;Viewport</span> <span class="a">worldWidth</span>={1920} <span class="a">worldHeight</span>={1440}<span class="t">&gt;</span>
    <span class="t">&lt;Sprite</span> <span class="a">image</span>=<span class="s">"town.webp"</span> <span class="t">/&gt;</span>
    <span class="t">&lt;SpriteShadows</span> <span class="a">ambientLight</span>={sun} <span class="a">lights</span>={lamps} <span class="t">/&gt;</span>

    <span class="t">&lt;Sprite</span> <span class="a">image</span>=<span class="s">"hero.png"</span> <span class="a">x</span>={x} <span class="a">y</span>={y}
      <span class="a">controls</span>={keys} <span class="a">viewportFollow</span> <span class="a">shadowCaster</span> <span class="t">/&gt;</span>

    <span class="t">&lt;DayNightCycle</span> <span class="a">time</span>={clock.time} <span class="a">lights</span>={lamps} <span class="t">/&gt;</span>
  <span class="t">&lt;/Viewport&gt;</span>
  <span class="t">&lt;Weather</span> <span class="a">preset</span>=<span class="s">"autumnGust"</span> <span class="t">/&gt;</span>
<span class="t">&lt;/Canvas&gt;</span>

<span class="t">&lt;script&gt;</span>
  <span class="k">const</span> clock = useGameClock({ time: <span class="n">18</span>, speed: <span class="n">10</span> })
  <span class="k">const</span> sun = computed(() =&gt; sunShadowAt(clock.time()))
<span class="t">&lt;/script&gt;</span></code></pre>
          <img class="ce-code-result" src="/showcase/town-autumn.webp" alt="Result: a town at dusk with falling leaves, walking characters and shadows" />
        </div>
      </div>
    </section>

    <!-- Layers -->
    <section class="ce-section ce-section-alt">
      <div class="ce-container">
        <p class="ce-kicker ce-center">From primitives to game systems</p>
        <h2 class="ce-center">Three layers, use as much as you need</h2>
        <p class="ce-text ce-center ce-narrow">
          Start low-level with reactive primitives, or build a whole RPG world from presets.
          Every layer is made of the same reusable components, so your own become first-class too.
        </p>
        <div class="ce-layers">
          <article v-for="layer in layers" :key="layer.step" class="ce-layer">
            <span class="ce-layer-step">{{ layer.step }}</span>
            <h3>{{ layer.title }}</h3>
            <p>{{ layer.text }}</p>
            <div class="ce-pills">
              <a v-for="item in layer.items" :key="item.label" :href="item.link">{{ item.label }}</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Showcase -->
    <section id="showcase" class="ce-section">
      <div class="ce-container">
        <p class="ce-kicker ce-center">Built-in, not bolted on</p>
        <h2 class="ce-center">Game systems ready to drop in</h2>
        <p class="ce-text ce-center ce-narrow">
          Every image below is rendered live by CanvasEngine presets, composed in a single scene.
        </p>
        <div class="ce-gallery">
          <a v-for="item in gallery" :key="item.image" :href="item.link" class="ce-tile" :class="{ 'ce-tile-wide': item.wide }">
            <img :src="item.image" :alt="item.title" loading="lazy" />
            <div class="ce-tile-body">
              <code>{{ item.tag }}</code>
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- Positioning -->
    <section class="ce-section ce-section-alt">
      <div class="ce-container">
        <p class="ce-kicker ce-center">Where it fits</p>
        <h2 class="ce-center">A game engine that feels like modern web development</h2>
        <div class="ce-compare">
          <article v-for="item in comparisons" :key="item.title">
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>
        <div class="ce-stack">
          <span>PixiJS v8 rendering</span>
          <span>TypeScript</span>
          <span>Vite &amp; HMR</span>
          <span>Tiled maps</span>
          <span>Keyboard · gamepad · touch</span>
          <span>Canvas + HTML UI</span>
          <span>MIT license</span>
        </div>
      </div>
    </section>

    <!-- Playable demo -->
    <section class="ce-section">
      <div class="ce-container">
        <p class="ce-kicker ce-center">Try it now</p>
        <h2 class="ce-center">Play, then read the code</h2>
        <p class="ce-text ce-center ce-narrow">A complete mini-game in one component. Use the arrow keys, then switch to the code view and change anything.</p>
        <div class="ce-playground">
          <Playground
            title="Crystal Rush"
            description="A playable CanvasEngine mini-game."
            :files="heroDemoFiles"
            :height="520"
            defaultViewMode="preview"
          />
        </div>
      </div>
    </section>

    <!-- AI -->
    <section class="ce-section ce-section-alt">
      <div class="ce-container ce-ai">
        <div>
          <p class="ce-kicker">Works great with AI</p>
          <h2>Your coding agent knows the engine</h2>
          <p class="ce-text">
            Install the CanvasEngine skill and your assistant writes idiomatic <code>.ce</code> scenes,
            controls, tilemaps and presets instead of guessing.
          </p>
        </div>
        <div class="ce-ai-card">
          <div class="ce-install ce-install-block"><span>$</span><code>npx skills add https://github.com/RSamaium/CanvasEngine</code></div>
          <p class="ce-prompt">“Create a top-down RPG village at dusk with a playable knight.”</p>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="ce-final">
      <div class="ce-container ce-center">
        <h2>Start with a scene. Grow it into a game.</h2>
        <div class="ce-actions ce-actions-center">
          <a href="/get_started/installation" class="ce-btn ce-btn-primary">Install CanvasEngine</a>
          <a href="https://github.com/RSamaium/CanvasEngine" target="_blank" class="ce-btn ce-btn-ghost">Star on GitHub</a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import Playground from './Playground.vue'

const heroDemoFiles = {
  'app.ce': `
<Canvas backgroundColor="#101820" width="100%" height="100%" antialias="false">
  <Container width="100%" height="100%" sortableChildren={true}>
    <Rect x={0} y={0} width={760} height={430} color="#101820" />
    <Rect x={18} y={18} width={724} height={394} color="#172a2f" borderRadius={18} />
    <Rect x={42} y={70} width={676} height={306} color="#213d38" borderRadius={14} />

    @for (patch of grassPatches) {
      <Circle x={patch.x} y={patch.y} radius={patch.r} color={patch.color} alpha={patch.alpha} />
    }

    @for (star of stars) {
      <Circle x={star.x} y={star.y} radius={star.r} color="#f8e16c" alpha={twinkleAlpha} />
    }

    <Sprite image="/hero-portal.png" x={638} y={278} width={92} height={92} alpha={portalAlpha} zIndex={4} />

    @for (crystal of crystals) {
      <Sprite
        image="/hero-crystal.png"
        x={crystal.x}
        y={crystal.y}
        width={42}
        height={42}
        alpha={crystal.collected() ? 0.18 : crystalPulse}
        zIndex={5}
      />
    }

    @for (enemy of enemies) {
      <Sprite image="/hero-slime.png" x={enemy.x} y={enemy.y} width={58} height={58} zIndex={6} />
    }

    <Sprite
      x={playerX}
      y={playerY}
      zIndex={8}
      sheet={{
        definition: playerDefinition,
        playing: animation,
        params: { direction }
      }}
      controls={controls}
    />

    <Circle x={playerGlowX} y={playerGlowY} radius={32} color="#93f5d0" alpha={playerGlowAlpha} zIndex={3} />

    <Rect x={34} y={28} width={286} height={38} color="#061014" alpha={0.82} borderRadius={19} zIndex={20} />
    <Text text="Crystal Rush" x={50} y={38} color="#effff7" size={15} fontFamily="Arial" zIndex={21} />
    <Text text={scoreText} x={166} y={39} color="#93f5d0" size={14} fontFamily="Arial" zIndex={21} />
    <Text text={timeText} x={248} y={39} color="#f8e16c" size={14} fontFamily="Arial" zIndex={21} />

    @if (gameFinished) {
      <Rect x={0} y={0} width={760} height={430} color="#061014" alpha={0.58} zIndex={40} click={restart} />
      <Rect x={236} y={146} width={288} height={132} color="#f8fff7" alpha={0.94} borderRadius={14} zIndex={45} />
      <Text text={resultTitle} x={282} y={172} color="#0f2a26" size={22} fontFamily="Arial" zIndex={46} />
      <Text text={resultBody} x={292} y={208} color="#236f5a" size={15} fontFamily="Arial" zIndex={46} />
      <Text text="Click or press Space to restart" x={282} y={244} color="#0f2a26" size={13} fontFamily="Arial" zIndex={46} />
    }
  </Container>
</Canvas>

<script>
  import { signal, computed, tick } from "canvasengine";

  const arena = { left: 54, right: 668, top: 84, bottom: 336 };
  const targetScore = 7;
  const duration = 30;
  const playerX = signal(110);
  const playerY = signal(205);
  const clock = signal(0);
  const timeLeft = signal(duration);
  const state = signal("playing");
  const direction = signal("down");
  const animation = signal("stand");
  const speed = 8;

  const grassPatches = [
    { x: 98, y: 102, r: 36, color: "#2e6b45", alpha: 0.6 },
    { x: 180, y: 332, r: 44, color: "#315f42", alpha: 0.54 },
    { x: 348, y: 128, r: 52, color: "#2c7750", alpha: 0.46 },
    { x: 514, y: 340, r: 60, color: "#345c3d", alpha: 0.5 },
    { x: 642, y: 138, r: 48, color: "#2b6d60", alpha: 0.44 },
  ];

  const stars = [
    { x: 116, y: 126, r: 2 },
    { x: 214, y: 292, r: 2 },
    { x: 312, y: 182, r: 3 },
    { x: 462, y: 112, r: 2 },
    { x: 580, y: 306, r: 3 },
    { x: 684, y: 220, r: 2 },
  ];

  const crystals = [
    { x: 174, y: 118, collected: signal(false) },
    { x: 318, y: 96, collected: signal(false) },
    { x: 498, y: 128, collected: signal(false) },
    { x: 602, y: 206, collected: signal(false) },
    { x: 452, y: 292, collected: signal(false) },
    { x: 268, y: 300, collected: signal(false) },
    { x: 120, y: 244, collected: signal(false) },
  ];

  const enemyTime = (offset) => computed(() => clock() + offset);
  const enemies = [
    { x: computed(() => 222 + Math.sin(enemyTime(0)()) * 66), y: computed(() => 170 + Math.cos(enemyTime(0.4)()) * 38) },
    { x: computed(() => 430 + Math.sin(enemyTime(1.5)() * 0.9) * 76), y: computed(() => 238 + Math.cos(enemyTime(0.9)()) * 54) },
    { x: computed(() => 584 + Math.sin(enemyTime(2.1)()) * 46), y: computed(() => 150 + Math.cos(enemyTime(2.8)() * 0.85) * 42) },
  ];

  const playerDefinition = {
    id: "docs-crystal-rush-player",
    image: "/hero-player-fantasy.png",
    width: 288,
    height: 384,
    framesWidth: 3,
    framesHeight: 4,
    rectWidth: 96,
    rectHeight: 96,
    scale: [0.74, 0.74],
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

  const score = computed(() => crystals.filter((crystal) => crystal.collected()).length);
  const scoreText = computed(() => "Score " + score() + "/" + targetScore);
  const timeText = computed(() => "Time " + Math.max(0, Math.ceil(timeLeft())));
  const gameFinished = computed(() => state() !== "playing");
  const resultTitle = computed(() => state() === "won" ? "Portal opened" : "The slimes caught you");
  const resultBody = computed(() => state() === "won" ? "All crystals are safe." : "Try another crystal route.");
  const crystalPulse = computed(() => 0.72 + Math.sin(clock() * 5) * 0.22);
  const portalAlpha = computed(() => score() === targetScore ? 1 : 0.38 + Math.sin(clock() * 2) * 0.08);
  const twinkleAlpha = computed(() => 0.35 + Math.abs(Math.sin(clock() * 3.4)) * 0.45);
  const playerGlowX = computed(() => playerX() + 36);
  const playerGlowY = computed(() => playerY() + 58);
  const playerGlowAlpha = computed(() => state() === "playing" ? 0.12 + Math.abs(Math.sin(clock() * 3)) * 0.08 : 0.24);

  function rowFor(value) {
    return {
      down: 0,
      left: 1,
      right: 2,
      up: 3,
    }[value] ?? 0;
  }

  const markMove = (value) => {
    if (state() !== "playing") return;
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
        playerX.update((x) => clamp(x - speed, arena.left, arena.right));
      },
    },
    right: {
      repeat: true,
      bind: "right",
      keyDown(_, payload) {
        markMove("right");
        playerX.update((x) => clamp(x + speed * (payload?.power ?? 1), arena.left, arena.right));
      },
    },
    up: {
      repeat: true,
      bind: "up",
      keyDown() {
        markMove("up");
        playerY.update((y) => clamp(y - speed, arena.top, arena.bottom));
      },
    },
    down: {
      repeat: true,
      bind: "down",
      keyDown() {
        markMove("down");
        playerY.update((y) => clamp(y + speed, arena.top, arena.bottom));
      },
    },
    action: {
      repeat: false,
      bind: "space",
      keyDown() {
        if (state() !== "playing") restart();
      },
    },
    gamepad: {
      enabled: true,
      moveInterval: 36,
    },
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function restart() {
    playerX.set(110);
    playerY.set(205);
    timeLeft.set(duration);
    state.set("playing");
    direction.set("down");
    animation.set("stand");
    crystals.forEach((crystal) => crystal.collected.set(false));
  }

  function collectCrystals() {
    crystals.forEach((crystal) => {
      if (!crystal.collected() && overlaps(playerX() + 18, playerY() + 22, 34, 42, crystal.x + 8, crystal.y + 8, 28, 28)) {
        crystal.collected.set(true);
      }
    });
  }

  function checkEnemies() {
    const hit = enemies.some((enemy) =>
      overlaps(playerX() + 18, playerY() + 24, 34, 40, enemy.x() + 12, enemy.y() + 16, 34, 32)
    );
    if (hit) state.set("lost");
  }

  tick(({ deltaTime }) => {
    const delta = (deltaTime ?? 16.67) / 1000;
    clock.update((value) => value + delta);

    if (state() !== "playing") return;

    timeLeft.update((value) => Math.max(0, value - delta));
    collectCrystals();
    checkEnemies();

    if (score() >= targetScore && overlaps(playerX() + 18, playerY() + 24, 34, 40, 662, 306, 42, 54)) {
      state.set("won");
    } else if (timeLeft() <= 0) {
      state.set("lost");
    }
  });
<\/script>

<style>
<\/style>
`,
}

const heroSlides = [
  { image: '/showcase/town-night.webp', label: 'DayNightCycle · SpriteShadows · Weather' },
  { image: '/showcase/fx-limit.webp', label: 'Fx · limitBurst' },
  { image: '/showcase/forest-rays.webp', label: 'Weather · light rays' },
  { image: '/showcase/beach.webp', label: 'GroundEffects · Footprints' },
]

const stats = [
  { value: '20+', label: 'components' },
  { value: '55', label: 'FX presets' },
  { value: '39', label: 'weather presets' },
  { value: '15+', label: 'directives' },
]

const layers = [
  {
    step: '01',
    title: 'Reactive core',
    text: 'Signals, computed values, .ce single-file components, @if / @for templates, lifecycle hooks and a test bed. The glue that keeps game state and screen in sync.',
    items: [
      { label: 'Signals & reactivity', link: '/concepts/reactive' },
      { label: 'Template syntax', link: '/concepts/template-syntax' },
      { label: 'Triggers', link: '/concepts/trigger' },
      { label: 'Lifecycle', link: '/concepts/lifecycle' },
    ],
  },
  {
    step: '02',
    title: 'Game components',
    text: 'Everything a scene is made of, ready to compose: sprites and spritesheets, a camera viewport, text, graphics, layout, joystick, HTML overlays.',
    items: [
      { label: 'Sprite', link: '/components/sprite' },
      { label: 'Viewport', link: '/components/viewport' },
      { label: 'DOMContainer', link: '/components/dom-container' },
      { label: 'Joystick', link: '/components/joystick' },
      { label: 'controls', link: '/directives/controls' },
      { label: 'sound', link: '/directives/sound' },
    ],
  },
  {
    step: '03',
    title: 'Game systems',
    text: 'The part other renderers leave to you. Drop a preset in a scene and your world gets weather, light, shadows, particles and life.',
    items: [
      { label: 'Tilemap (Tiled)', link: '/presets/tilemap' },
      { label: 'Weather', link: '/presets/weather' },
      { label: 'Fx', link: '/presets/fx' },
      { label: 'DayNightCycle', link: '/presets/day-night' },
      { label: 'SpriteShadows', link: '/presets/sprite-shadows' },
      { label: 'GroundEffects', link: '/presets/ground-effects' },
      { label: 'Footprints', link: '/presets/footprints' },
      { label: 'FogOfWar', link: '/presets/fog-of-war' },
    ],
  },
]

const gallery = [
  { image: '/showcase/town-dusk.webp', title: 'Day & night', tag: '<DayNightCycle>', text: 'Time of day grades the whole scene. Lamps light up one by one, windows follow their own schedule.', link: '/presets/day-night', wide: true },
  { image: '/showcase/fx-holy.webp', title: 'Spells & attacks', tag: '<Fx name="holyPillar">', text: '55 presets: slashes, limit breaks, elemental magic, auras, status effects. Recolor them in one prop.', link: '/presets/fx' },
  { image: '/showcase/forest-embers.webp', title: 'Weather', tag: '<Weather preset="eruptionEmbers">', text: 'Rain, snow, fog, clouds, light rays, embers, leaves, fireflies, sandstorms.', link: '/presets/weather' },
  { image: '/showcase/beach.webp', title: 'Sprites that live in their terrain', tag: 'groundCaster', text: 'Characters wade into water, disappear into tall grass and leave prints on sand, read straight from the map.', link: '/presets/ground-effects', wide: true },
  { image: '/showcase/shadows.webp', title: 'Projected shadows', tag: '<SpriteShadows>', text: 'Each sprite casts its real silhouette away from every light: sun, torches, street lamps.', link: '/presets/sprite-shadows' },
  { image: '/showcase/fx-sigil.webp', title: 'Magic at night', tag: '<Fx name="summonSigil">', text: 'Effects and lighting compose: a summoning circle glowing in a sleeping town.', link: '/presets/fx' },
  { image: '/showcase/beach-clouds.webp', title: 'Clouds & sky', tag: '<Weather effect="cloud">', text: 'Fluffy cumulus seen from above, with their shadows sliding over the ground.', link: '/presets/weather' },
  { image: '/showcase/footprints.webp', title: 'Footprints', tag: 'footprintCaster', text: 'Boots, bare feet, paws and hooves that sink into snow, sand and mud, then slowly fade.', link: '/presets/footprints' },
  { image: '/showcase/town-snow.webp', title: 'Seasons', tag: '<Weather preset="winterSnow">', text: 'Same town, new season: switch one preset and the afternoon turns into a snowfall.', link: '/presets/weather' },
  { image: '/showcase/fx-crystal.webp', title: 'Recolor any effect', tag: 'customizeFx()', text: 'Presets are data: change colors, scale, timing or layers and make them your own.', link: '/presets/fx' },
]

const comparisons = [
  {
    title: 'Compared to PixiJS alone',
    text: 'Same fast WebGL renderer underneath. CanvasEngine adds the missing layer: a component model, reactivity, input, audio, cameras and ready-made game systems.',
  },
  {
    title: 'Compared to classic JS game frameworks',
    text: 'Scenes are declarative components instead of imperative update code: state lives in signals, the screen follows. Presets bring RPG-grade visuals out of the box.',
  },
  {
    title: 'Compared to full editors',
    text: 'No editor, no export step: it lives in your Vite + npm stack, mixes freely with HTML UI, and ships as a regular web app.',
  },
]

</script>

<style scoped>
.ce-home {
  --ce-bg: #0b0f1a;
  --ce-bg-alt: #0f1524;
  --ce-card: #141b2d;
  --ce-border: rgba(148, 163, 184, 0.14);
  --ce-text: #e6ebf5;
  --ce-muted: #9aa7bd;
  --ce-accent: #7c83ff;
  --ce-accent-2: #3fd6a0;
  --ce-warm: #ffc070;
  background: var(--ce-bg);
  color: var(--ce-text);
  font-family: var(--vp-font-family-base);
  min-height: 100vh;
}

.ce-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.ce-center { text-align: center; }
.ce-narrow { max-width: 680px; margin-left: auto; margin-right: auto; }

code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  background: rgba(124, 131, 255, 0.12);
  color: #c7caff;
  padding: 0.1em 0.4em;
  border-radius: 6px;
}

/* Nav */
.ce-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(11, 15, 26, 0.82);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--ce-border);
}
.ce-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.ce-brand { display: flex; align-items: center; gap: 10px; color: #fff; font-weight: 800; font-size: 18px; letter-spacing: -0.01em; text-decoration: none; }
.ce-brand-icon { width: 25px; height: 30px; overflow: hidden; flex: none; }
.ce-brand-icon img { height: 30px; max-width: none; display: block; margin-left: -3px; }
.ce-nav-links { display: flex; gap: 28px; }
.ce-nav-links a { color: var(--ce-muted); font-weight: 500; font-size: 15px; text-decoration: none; transition: color 0.2s; }
.ce-nav-links a:hover { color: var(--ce-text); }

/* Hero */
.ce-hero {
  position: relative;
  overflow: hidden;
  padding: 72px 0 40px;
  background:
    radial-gradient(900px 500px at 85% 10%, rgba(124, 131, 255, 0.18), transparent 60%),
    radial-gradient(700px 400px at 5% 90%, rgba(63, 214, 160, 0.12), transparent 60%);
}
.ce-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 56px; align-items: center; }
.ce-eyebrow {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ce-accent-2);
  background: rgba(63, 214, 160, 0.1);
  border: 1px solid rgba(63, 214, 160, 0.25);
  padding: 6px 12px;
  border-radius: 999px;
  margin: 0 0 22px;
}
.ce-hero h1 {
  font-size: clamp(40px, 5.4vw, 64px);
  line-height: 1.04;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 22px;
  color: #fff;
}
.ce-hero h1 span {
  background: linear-gradient(90deg, var(--ce-accent) 0%, var(--ce-accent-2) 60%, var(--ce-warm) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.ce-lead { font-size: 18px; line-height: 1.65; color: var(--ce-muted); margin: 0 0 30px; max-width: 560px; }
.ce-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; }
.ce-actions-center { justify-content: center; margin-top: 28px; }
.ce-btn {
  display: inline-flex;
  align-items: center;
  padding: 13px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
}
.ce-btn:hover { transform: translateY(-2px); }
.ce-btn-primary { background: linear-gradient(135deg, var(--ce-accent), #5b63f0); color: #fff; box-shadow: 0 10px 30px rgba(124, 131, 255, 0.35); }
.ce-btn-ghost { color: var(--ce-text); border: 1px solid var(--ce-border); background: rgba(255, 255, 255, 0.03); }
.ce-btn-ghost:hover { background: rgba(255, 255, 255, 0.07); }
.ce-install {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #070a12;
  border: 1px solid var(--ce-border);
  border-radius: 10px;
  padding: 10px 14px;
  max-width: 100%;
  overflow-x: auto;
}
.ce-install, .ce-code { scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, 0.3) transparent; }
.ce-install span { color: var(--ce-accent-2); font-family: var(--vp-font-family-mono); }
.ce-install code { background: none; padding: 0; color: #d7dcea; white-space: nowrap; }

.ce-hero-visual { position: relative; }
.ce-slides {
  position: relative;
  aspect-ratio: 3 / 2;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--ce-border);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  background: #070a12;
}
.ce-slide {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  animation: ce-slide 20s infinite;
}
.ce-slide:first-child { opacity: 1; }
.ce-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ce-slide figcaption {
  position: absolute;
  left: 16px;
  bottom: 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: #fff;
  background: rgba(7, 10, 18, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 6px 10px;
  border-radius: 8px;
  backdrop-filter: blur(6px);
}
@keyframes ce-slide {
  0% { opacity: 0; transform: scale(1.04); }
  4% { opacity: 1; }
  25% { opacity: 1; transform: scale(1); }
  29% { opacity: 0; }
  100% { opacity: 0; }
}
.ce-hero-glow {
  position: absolute;
  inset: -40px;
  z-index: -1;
  background: radial-gradient(closest-side, rgba(255, 192, 112, 0.18), transparent);
  filter: blur(20px);
}

.ce-stats {
  list-style: none;
  padding: 0;
  margin: 56px 0 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--ce-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
}
.ce-stats li { padding: 20px; text-align: center; }
.ce-stats li + li { border-left: 1px solid var(--ce-border); }
.ce-stats strong { display: block; font-size: 30px; font-weight: 800; color: #fff; }
.ce-stats span { color: var(--ce-muted); font-size: 14px; }

/* Sections */
.ce-section { padding: 96px 0; }
.ce-section-alt { background: var(--ce-bg-alt); border-top: 1px solid var(--ce-border); border-bottom: 1px solid var(--ce-border); }
.ce-kicker { color: var(--ce-accent-2); font-weight: 700; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 12px; }
.ce-section h2, .ce-final h2, .ce-ai h2 { font-size: clamp(28px, 3.4vw, 42px); line-height: 1.15; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 18px; color: #fff; }
.ce-text { color: var(--ce-muted); font-size: 17px; line-height: 1.7; margin: 0 0 20px; }

.ce-split { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: 56px; align-items: center; }
.ce-checks { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.ce-checks li { position: relative; padding-left: 28px; color: var(--ce-text); line-height: 1.5; }
.ce-checks li::before { content: ""; position: absolute; left: 0; top: 7px; width: 14px; height: 8px; border-left: 2px solid var(--ce-accent-2); border-bottom: 2px solid var(--ce-accent-2); transform: rotate(-45deg); }

.ce-code-card { background: #070a12; border: 1px solid var(--ce-border); border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45); }
.ce-code-bar { display: flex; align-items: center; gap: 7px; padding: 12px 16px; border-bottom: 1px solid var(--ce-border); }
.ce-code-bar i { width: 11px; height: 11px; border-radius: 50%; background: #2a3247; }
.ce-code-bar span { margin-left: 10px; color: var(--ce-muted); font-size: 13px; font-family: var(--vp-font-family-mono); }
.ce-code { margin: 0; padding: 18px 20px; font-size: 13px; line-height: 1.65; overflow-x: auto; color: #d7dcea; }
.ce-code code { background: none; padding: 0; color: inherit; font-size: inherit; }
.ce-code .t { color: #7c83ff; }
.ce-code .a { color: #3fd6a0; }
.ce-code .s { color: #ffc070; }
.ce-code .k { color: #f472b6; }
.ce-code .n { color: #fbbf24; }
.ce-code-result { display: block; width: 100%; border-top: 1px solid var(--ce-border); aspect-ratio: 16 / 7; object-fit: cover; }

/* Layers */
.ce-layers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
.ce-layer {
  position: relative;
  background: var(--ce-card);
  border: 1px solid var(--ce-border);
  border-radius: 18px;
  padding: 28px;
  transition: border-color 0.2s, transform 0.2s;
}
.ce-layer:hover { border-color: rgba(124, 131, 255, 0.45); transform: translateY(-3px); }
.ce-layer:nth-child(3) { background: linear-gradient(160deg, rgba(124, 131, 255, 0.16), var(--ce-card) 55%); }
.ce-layer-step { font-family: var(--vp-font-family-mono); color: var(--ce-accent); font-size: 13px; font-weight: 700; }
.ce-layer h3 { font-size: 21px; margin: 10px 0 10px; color: #fff; }
.ce-layer p { color: var(--ce-muted); line-height: 1.65; margin: 0 0 18px; font-size: 15px; }
.ce-pills { display: flex; flex-wrap: wrap; gap: 8px; }
.ce-pills a {
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
  color: var(--ce-text);
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--ce-border);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color 0.2s, color 0.2s;
}
.ce-pills a:hover { color: #fff; border-color: var(--ce-accent); }

/* Gallery */
.ce-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 40px; }
.ce-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--ce-card);
  border: 1px solid var(--ce-border);
  border-radius: 18px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.ce-tile:hover { transform: translateY(-4px); border-color: rgba(124, 131, 255, 0.5); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45); }
.ce-tile-wide { grid-column: span 2; }
.ce-tile img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; transition: transform 0.5s; }
.ce-tile-wide img { aspect-ratio: 16 / 7.5; }
.ce-tile:hover img { transform: scale(1.03); }
.ce-tile-body { padding: 18px 20px 22px; }
.ce-tile-body code { font-size: 12px; }
.ce-tile-body h3 { font-size: 18px; margin: 10px 0 6px; color: #fff; }
.ce-tile-body p { margin: 0; color: var(--ce-muted); font-size: 14px; line-height: 1.6; }

/* Comparison */
.ce-compare { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 36px; }
.ce-compare article { background: var(--ce-card); border: 1px solid var(--ce-border); border-radius: 16px; padding: 26px; }
.ce-compare h3 { font-size: 17px; margin: 0 0 10px; color: #fff; }
.ce-compare p { margin: 0; color: var(--ce-muted); line-height: 1.65; font-size: 15px; }
.ce-stack { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 32px; }
.ce-stack span { font-size: 13px; color: var(--ce-muted); border: 1px solid var(--ce-border); border-radius: 999px; padding: 6px 14px; }

/* Playground */
.ce-playground { margin-top: 36px; border-radius: 18px; overflow: hidden; border: 1px solid var(--ce-border); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4); }

/* AI */
.ce-ai { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 48px; align-items: center; }
.ce-ai-card { background: var(--ce-card); border: 1px solid var(--ce-border); border-radius: 18px; padding: 24px; }
.ce-install-block { display: flex; width: 100%; box-sizing: border-box; }
.ce-prompt { margin: 18px 0 0; color: var(--ce-text); font-style: italic; font-size: 16px; }

/* Final */
.ce-final { padding: 110px 0; background: radial-gradient(700px 300px at 50% 100%, rgba(124, 131, 255, 0.22), transparent 70%); }

/* Responsive */
@media (max-width: 1000px) {
  .ce-hero-grid, .ce-split, .ce-ai { grid-template-columns: minmax(0, 1fr); }
  .ce-layers, .ce-compare { grid-template-columns: minmax(0, 1fr); }
  .ce-gallery { grid-template-columns: repeat(2, 1fr); }
  .ce-tile-wide { grid-column: span 2; }
}
@media (max-width: 640px) {
  .ce-nav-links { gap: 16px; }
  .ce-nav-links a:nth-child(n + 2):not(:nth-child(4)) { display: none; }
  .ce-hero { padding-top: 40px; }
  .ce-container { padding: 0 16px; }
  .ce-lead { font-size: 16px; }
  .ce-btn { padding: 12px 18px; font-size: 15px; }
  .ce-stats { grid-template-columns: repeat(2, 1fr); }
  .ce-stats li:nth-child(3) { border-left: none; }
  .ce-stats li:nth-child(n + 3) { border-top: 1px solid var(--ce-border); }
  .ce-gallery { grid-template-columns: minmax(0, 1fr); }
  .ce-tile-wide { grid-column: auto; }
  .ce-section { padding: 64px 0; }
}
@media (prefers-reduced-motion: reduce) {
  .ce-slide { animation: none; }
  .ce-slide:not(:first-child) { display: none; }
}
</style>
