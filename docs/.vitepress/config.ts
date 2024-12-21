import { defineConfig } from 'vitepress';

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
      }
    ],
  },
  {
    text: "Components",
    collapsed: false,
    items: [
      {
        text: "Common properties",
        link: "/components/display-object",
      },
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
  }
})
