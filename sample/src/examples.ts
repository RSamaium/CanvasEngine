import type { ComponentFunction } from 'canvasengine'

export type ExampleDefinition = {
  slug: string
  title: string
  load: () => Promise<{ default: ComponentFunction<any> }>
}

export const DEFAULT_EXAMPLE_SLUG = 'sprite-shadows'

export const EXAMPLES: ExampleDefinition[] = [
  { slug: 'hud-hp-sp', title: 'HUD · HP / SP', load: () => import('./hud-hp-sp.ce') },
  { slug: 'app', title: 'App & DOM Container', load: () => import('./app.ce') },
  { slug: 'box', title: 'Dialog Box', load: () => import('./box.ce') },
  { slug: 'cond-else-loop', title: 'Conditional Else Loop', load: () => import('./cond-else-loop.ce') },
  { slug: 'control', title: 'Controls · Boot', load: () => import('./control.ce') },
  { slug: 'controls-buttons', title: 'Controls · Buttons', load: () => import('./controls-buttons.ce') },
  { slug: 'controls-rect', title: 'Controls · Rectangle', load: () => import('./controls-rect.ce') },
  { slug: 'dependencies', title: 'Async Dependencies', load: () => import('./dependencies.ce') },
  { slug: 'flash', title: 'Flash Directive', load: () => import('./flash.ce') },
  { slug: 'flex', title: 'Flex Layout', load: () => import('./flex.ce') },
  { slug: 'focus-navigation-dom', title: 'Focus Navigation · DOM', load: () => import('./focus-navigation-dom.ce') },
  { slug: 'fog-of-war', title: 'Fog of War', load: () => import('./fogofwar.ce') },
  { slug: 'footprints', title: 'Footprints', load: () => import('./footprints.ce') },
  { slug: 'freeze', title: 'Freeze System', load: () => import('./freeze.ce') },
  { slug: 'fx', title: 'FX Presets', load: () => import('./fx.ce') },
  { slug: 'layout-center', title: 'Layout · Centered GUI', load: () => import('./layout-center-gui.ce') },
  { slug: 'layout-overlay-resize', title: 'Layout · Overlay & Resize', load: () => import('./layout-overlay-resize-gui.ce') },
  { slug: 'layout-validation', title: 'Layout · Validation Lab', load: () => import('./layout-validation.ce') },
  { slug: 'light', title: 'Dynamic Light', load: () => import('./light.ce') },
  { slug: 'loader-spritesheet', title: 'Spritesheet Loader', load: () => import('./loader-spritesheet.ce') },
  { slug: 'loop-render-order', title: 'Loop Render Order', load: () => import('./loop-render-order.ce') },
  { slug: 'preset', title: 'Weather & Gamepad', load: () => import('./preset.ce') },
  { slug: 'pretext', title: 'Pretext Layout', load: () => import('./pretext.ce') },
  { slug: 'shake', title: 'Shake Directive', load: () => import('./shake.ce') },
  { slug: 'sprite-effects', title: 'Sprite Effects', load: () => import('./sprite-effects.ce') },
  { slug: 'sprite-moving-custom', title: 'Custom Sprite Animation', load: () => import('./sprite-moving-custom.ce') },
  { slug: 'sprite-shadows', title: 'Sprite Shadows', load: () => import('./sprite-shadows.ce') },
  { slug: 'spritesheet', title: 'Spritesheet', load: () => import('./spritesheet.ce') },
  { slug: 'spritesheet-2', title: 'Spritesheet · Reactive', load: () => import('./spritesheet2.ce') },
  { slug: 'dom-sprite', title: 'DOM Sprite', load: () => import('./test.ce') },
  { slug: 'tiled', title: 'Tiled Map', load: () => import('./tiled.ce') },
  { slug: 'weather', title: 'Weather · Preset Lab', load: () => import('./weather.ce') },
]

export function getExample(slug: string | null | undefined): ExampleDefinition {
  return EXAMPLES.find((example) => example.slug === slug)
    ?? EXAMPLES.find((example) => example.slug === DEFAULT_EXAMPLE_SLUG)!
}

export function getExampleUrl(slug: string, currentUrl: string): string {
  const url = new URL(currentUrl)
  url.searchParams.set('example', slug)
  return `${url.pathname}${url.search}${url.hash}`
}
