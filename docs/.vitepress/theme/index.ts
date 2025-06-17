import DefaultTheme from "vitepress/theme";
import CustomHome from "./components/CustomHome.vue";
import Playground from "./components/Playground.vue";
import Layout from "./Layout.vue";
import "./style.css";

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx);
    ctx.app.component('CustomHome', CustomHome);
    ctx.app.component('Playground', Playground);
  },
};
