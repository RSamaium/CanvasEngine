import { bootstrapCanvas } from 'canvasengine';
//import App from './test.ce'
// Uncomment to test shake directive examples:
// import App from './shake.ce'
// Uncomment to test global asset loader (simple):
// import App from './loader.ce'
// Uncomment to test global asset loader (with spritesheets):
// import App from './fogofwar.ce'
import DefaultApp from './sprite-shadows.ce'
import LayoutCenterGui from './layout-center-gui.ce'
import LayoutOverlayResizeGui from './layout-overlay-resize-gui.ce'
// import App from './spritesheet.ce'
// import App from './cond-else-loop.ce'
// import App from './app.ce'
//import App from './sprite-effects.ce'
// import App from './sprite-moving-custom.ce'
// import App from './loop-render-order.ce'

const examples = {
    'layout-center': LayoutCenterGui,
    'layout-overlay-resize': LayoutOverlayResizeGui,
}
const example = new URLSearchParams(window.location.search).get('example')
const App = examples[example] ?? DefaultApp

bootstrapCanvas(document.getElementById("root"), App).then(() => {
    console.log("CanvasEngine initialized");
});
