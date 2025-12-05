import '@pixi/layout/devtools';
import { bootstrapCanvas } from 'canvasengine';
import App from './controls-buttons.ce'
// Uncomment to test shake directive examples:
// import App from './shake.ce'

bootstrapCanvas(document.getElementById("root"), App).then(() => {
    console.log("CanvasEngine initialized");
});
