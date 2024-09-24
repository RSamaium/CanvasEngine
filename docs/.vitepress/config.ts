const guideMenu = [
  {
    text: "Quick Start",
    collapsed: false,
    items: [],
  },
  {
    text: "Components",
    collapsed: false,
    items: [
      {
        text: "Common Components",
        link: "/components/display-object",
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
        text: "Viewport",
        link: "/components/viewport",
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

export default {
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
      "/guide/": guideMenu,
      "/components/": guideMenu,
      "/directives/": guideMenu,
    },
  },
};
