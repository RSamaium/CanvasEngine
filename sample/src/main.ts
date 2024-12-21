import App from './app.ce'
import { bootstrapCanvas } from 'canvasengine';

bootstrapCanvas(document.getElementById("root"), App).then(() => {
    console.log("CanvasEngine initialized");
});
