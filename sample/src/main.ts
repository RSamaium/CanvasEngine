import { bootstrapCanvas } from 'canvasengine';
//import App from './test.ce'
// Uncomment to test shake directive examples:
// import App from './shake.ce'
// Uncomment to test global asset loader (simple):
// import App from './loader.ce'
// Uncomment to test global asset loader (with spritesheets):
// import App from './fogofwar.ce'
// import App from './sprite-shadows.ce'
// import App from './spritesheet.ce'
// import App from './cond-else-loop.ce'
import App from './fx.ce'

bootstrapCanvas(document.getElementById("root"), App).then(() => {
    console.log("CanvasEngine initialized");
});
