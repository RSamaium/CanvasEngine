import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms'

const guideMenu = [
  {
    text: "Quick Start",
    collapsed: false,
    items: [
      {
        text: "Installation",
        link: "/get_started/installation",
      },
      {
        text: "Start",
        link: "/get_started/start",
      }
    ],
  },
  {
    text: "Concepts",
    collapsed: false,
    items: [
      {
        text: "Template Syntax",
        link: "/concepts/template-syntax",
      },
      {
        text: "Reactivity",
        link: "/concepts/reactive",
      },
      {
        text: "Child Component",
        link: "/concepts/child-component",
      },
      {
        text: "Trigger",
        link: "/concepts/trigger",
      },
      {
        text: "Lifecycle",
        link: "/concepts/lifecycle",
      },
      {
        text: "Dependencies",
        link: "/concepts/dependencies",
      },
      {
        text: "Slot",
        link: "/concepts/slot",
      },
      {
        text: "Dynamic Components",
        link: "/concepts/dynamic-components",
      },
      {
        text: "Primitive Animation",
        link: "/concepts/animation",
      },
      {
        text: "Styling",
        link: "/concepts/styling",
      }
    ],
  },
  {
    text: "Components",
    collapsed: false,
    items: [
      {
        text: "Canvas",
        link: "/components/canvas",
      },
      {
        text: "Container",
        link: "/components/container",
      },
      {
        text: "Graphics",
        link: "/components/graphic",
      },
      {
        text: "Svg",
        link: "/components/svg",
      },
      {
        text: "Text",
        link: "/components/text",
      },
      {
        text: "Button",
        link: "/components/button",
      },
      {
        text: "Sprite",
        link: "/components/sprite",
      },
      {
        text: "NineSliceSprite",
        link: "/components/nine-slice-sprite",
      },
      {
        text: "Viewport",
        link: "/components/viewport",
      },
      {
        text: "TilingSprite",
        link: "/components/tiling-sprite",
      },
      {
        text: "Video",
        link: "/components/video",
      },
      {
        text: "Mesh",
        link: "/components/mesh",
      },
      {
        text: "DOMContainer",
        link: "/components/dom-container",
      },
      {
        text: "Navigation",
        link: "/components/navigation",
      },
      {
        text: "Joystick",
        link: "/components/joystick",
      }
    ],
  },
  {
    text: "Directives",
    collapsed: false,
    items: [
      {
        text: "Controls",
        link: "/directives/controls",
      },
      {
        text: "Drag",
        link: "/directives/drag",
      },
      {
        text: "Sound",
        link: "/directives/sound",
      },
      {
        text: "Flash",
        link: "/directives/flash",
      },
      {
        text: "Shake",
        link: "/directives/shake",
      }
    ],
  },
  {
    text: "Presets Components",
    collapsed: false,
    items: [
      {
        text: "Bar",
        link: "/presets/bar",
      },
      {
        text: "Loading",
        link: "/presets/loading",
      },
      {
        text: "Tilemap",
        link: "/presets/tilemap",
      },
      {
        text: "Weather",
        link: "/presets/weather",
      },
      {
        text: "NightAmbient",
        link: "/presets/night-ambiant",
      },
      {
        text: "Footprints",
        link: "/presets/footprints",
      },
      {
        text: "Fx",
        link: "/presets/fx",
      }
    ],
  },
  {
    text: "API",
    collapsed: false,
    items: [
      {
        text: "Element Object",
        link: "/api/element",
      },
      {
        text: "Context",
        link: "/api/context",
      },
      {
        text: "Testing",
        link: "/api/testing",
      },
      {
        text: "Use without Compiler",
        link: "/advanced/without-compiler",
      }
    ],
  },
];

export default defineConfig({
  title: "Canvas Engine Documentation",
  description: "Reactive Canvas Framework",
  themeConfig: {
    search: {
      provider: "local",
    },
    repo: "https://github.com/RSamaium/CanvasEngine",
    nav: [
      {
        text: "Home",
        link: "https://canvasengine.net",
      },
      {
        text: "Guide",
        link: "/get_started/installation",
      },
    ],
    sidebar: {
      "/": guideMenu,
      "/get_started/": guideMenu,
      "/components/": guideMenu,
      "/directives/": guideMenu,
      "/presets/": guideMenu,
      "/api/": guideMenu,
    },
  },
  vite: {
    plugins: [llmstxt()]
  },
})
