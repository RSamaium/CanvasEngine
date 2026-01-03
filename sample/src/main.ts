import { bootstrapCanvas } from 'canvasengine';
//import App from './test.ce'
// Uncomment to test shake directive examples:
// import App from './shake.ce'
// Uncomment to test global asset loader (simple):
// import App from './loader.ce'
// Uncomment to test global asset loader (with spritesheets):
import App from './test.ce'

bootstrapCanvas(document.getElementById("root"), App).then(() => {
    console.log("CanvasEngine initialized");
});
