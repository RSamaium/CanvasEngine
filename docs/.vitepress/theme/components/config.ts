const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'

/**
 * Configuration map for external dependencies
 * Ensures all CanvasEngine exports from the compiler are always available
 */
export const dependencyConfig = {
    'canvasengine': {
      globalName: 'CanvasEngine',
      url: isDev ? 'http://localhost:3000/packages/core/dist/index.global.js' : 'https://cdn.jsdelivr.net/npm/canvasengine@latest/dist/index.global.js'
    },
    '@canvasengine/presets': {
      globalName: 'CanvasEnginePresets',
      url: isDev ? 'http://localhost:3000/packages/presets/dist/index.global.js' : 'https://cdn.jsdelivr.net/npm/@canvasengine/presets@latest/dist/index.global.js'
    },
    'pixi.js': {
      globalName: 'PIXI',
      url: 'https://cdn.jsdelivr.net/npm/pixi.js@latest/dist/pixi.min.js'
    }
  }
  
  /**
   * List of primitive components that should always be available
   * Matches the PRIMITIVE_COMPONENTS from the compiler
   */
  export const PRIMITIVE_COMPONENTS = [
    "Canvas",
    "Sprite", 
    "Text",
    "Viewport",
    "Graphics",
    "Container",
    "ImageMap",
    "NineSliceSprite",
    "Rect",
    "Circle",
    "Ellipse",
    "Triangle",
    "TilingSprite",
    "svg",
    "Video",
    "Mesh",
    "Svg",
    "DOMContainer",
    "DOMElement"
  ]
  
  /**
   * Core functions that should always be available
   * Matches the required imports from the compiler
   */
  export const CORE_FUNCTIONS = [
    "h",
    "computed", 
    "cond",
    "loop",
    "useProps",
    "useDefineProps",
    "bootstrapCanvas"
  ]
  