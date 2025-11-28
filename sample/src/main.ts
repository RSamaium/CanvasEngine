import '@pixi/layout/devtools';
import { bootstrapCanvas } from 'canvasengine';
import App from './benchmark.ce'

bootstrapCanvas(document.getElementById("root"), App).then(() => {
    console.log("CanvasEngine initialized");
});
