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
        text: "Text",
        link: "/components/text",
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
        link: "/components/tilling-sprite",
      },
      {
        text: "Video",
        link: "/components/video",
      },
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
      }
    ],
  },
  {
    text: "Presets Components",
    collapsed: false,
    items: [
      {
        text: "Joystick",
        link: "/presets/joystick",
      },
      {
        text: "Bar",
        link: "/presets/bar",
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
    ],
  },
];

export default defineConfig({
  title: "Canvas Engine Documentation",
  description: "Reactive Canvas Framework",
  ignoreDeadLinks: true,
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
        link: "/guide/get-started",
      },
    ],
    sidebar: {
      "/": guideMenu,
      "/guide/": guideMenu,
      "/components/": guideMenu,
      "/directives/": guideMenu,
    },
  },
  vite: {
    plugins: [llmstxt()]
  },
})
