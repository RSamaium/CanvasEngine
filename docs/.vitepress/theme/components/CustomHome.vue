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
          <a href="#" class="nav-link">Discord</a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <img src="/logo.png" alt="Canvas Engine" class="logo" />
          </h1>
          <p class="hero-subtitle">
            A reactive HTML5 Canvas management library built on top of PixiJS
          </p>
          <p class="hero-description">
            Component-oriented approach to canvas rendering, similar to modern frontend frameworks.
            Build interactive games and applications with ease.
          </p>
          <div class="hero-actions">
            <a href="/get_started/installation" class="btn btn-primary">
              Get Started
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
          <div class="canvas-preview">
            <div class="canvas-mock">
              <div class="canvas-element sprite"></div>
              <div class="canvas-element container">
                <div class="canvas-element text">Canvas Engine</div>
                <div class="canvas-element graphic"></div>
              </div>
              <div class="canvas-element particle"></div>
              <div class="canvas-element particle"></div>
              <div class="canvas-element particle"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="features-container">
        <h2 class="section-title">Why Canvas Engine?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h3>Reactive Components</h3>
            <p>Build interactive canvas applications with reactive components that automatically update when data changes.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h3>Flexbox in Canvas</h3>
            <p>Use familiar CSS Flexbox layout system directly in your canvas applications for responsive designs.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3>Easy Animations</h3>
            <p>Create smooth animations with a simple and intuitive animation system built for performance.</p>
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
            <h3>Input Controls</h3>
            <p>Support for keyboard, gamepad, and virtual joystick controls out of the box.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h3>Tiled Map Support</h3>
            <p>Seamless integration with Tiled Map Editor for creating complex game worlds and levels.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h3>Audio System</h3>
            <p>Built-in audio system with particle emitters for creating immersive gaming experiences.</p>
          </div>
        </div>
      </div>
    </section>

    <Playground 
      title="Playground"
      description="Draw on the canvas with Canvas Engine"
      :files
    /> 

  </div>
</template>

<script setup lang="ts">
import Playground from './Playground.vue'

const files = {
  'app.ce': `
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
<\/script>
  `,
  'hello.ce': `<Text text="Hello world" size={70} fontFamily="Helvetica" x={50} y={40} />`
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
  background: linear-gradient(135deg, var(--bg-color) 0%, #f1f5f9 100%);
  padding: 8rem 2rem 4rem;
  min-height: 70vh;
  display: flex;
  align-items: center;
}

.dark .hero {
  background: linear-gradient(135deg, var(--bg-color) 0%, #1e293b 100%);
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.gradient-text {
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 1rem;
  font-weight: 600;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--text-color-light);
  line-height: 1.6;
  margin-bottom: 2rem;
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

/* Canvas Preview */
.canvas-preview {
  perspective: 1000px;
}

.canvas-mock {
  width: 400px;
  height: 300px;
  background: #1a1a1a;
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
  transform: rotateY(-15deg) rotateX(5deg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: float 6s ease-in-out infinite;
}

.canvas-element {
  position: absolute;
  border-radius: 0.5rem;
}

.sprite {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  top: 50px;
  left: 50px;
  animation: bounce 2s ease-in-out infinite;
}

.container {
  width: 200px;
  height: 100px;
  border: 2px dashed #646cff;
  top: 100px;
  left: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.text {
  color: white;
  font-size: 14px;
  font-weight: bold;
  position: static;
  margin-bottom: 10px;
}

.graphic {
  width: 40px;
  height: 40px;
  background: #42b883;
  position: static;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.particle {
  width: 6px;
  height: 6px;
  background: #feca57;
  border-radius: 50%;
  animation: particle 3s linear infinite;
}

.particle:nth-child(4) {
  top: 200px;
  left: 100px;
  animation-delay: 0s;
}

.particle:nth-child(5) {
  top: 180px;
  left: 120px;
  animation-delay: 1s;
}

.particle:nth-child(6) {
  top: 220px;
  left: 80px;
  animation-delay: 2s;
}

@keyframes float {
  0%, 100% { transform: rotateY(-15deg) rotateX(5deg) translateY(0px); }
  50% { transform: rotateY(-15deg) rotateX(5deg) translateY(-20px); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes particle {
  0% { opacity: 1; transform: translateY(0px) scale(1); }
  100% { opacity: 0; transform: translateY(-50px) scale(0.5); }
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
    font-size: 2.5rem;
  }
  
  .canvas-mock {
    width: 300px;
    height: 225px;
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