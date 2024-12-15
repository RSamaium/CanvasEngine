import App from './components/app.ce'
import { bootstrapCanvas } from 'canvasengine';

await bootstrapCanvas(document.getElementById("root"), App);
