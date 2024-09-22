import { ImageMap } from "./src/components/DrawMap";
import { Sprite } from "./src/components/Sprite";
import {
  h,
  Canvas,
  Container,
  signal,
  Viewport,
  Graphics,
} from "./src";
import "./src/directives";
import { animatedSignal } from "./src/engine/animation";
import { bootstrapCanvas } from "./src/engine/bootstrap";
import * as filters from "pixi-filters";
import { Joystick } from "./src/composition/Joystick";


const scale = animatedSignal(1);

const minScale = 1;
const maxScale = 1.2; // Reduced max scale for subtler effect
const scintillationSpeed = 0.001; // Significantly reduced for slower scintillation

const animate = () => {
  // Use time-based animation for smoother, slower scintillation
  const time = Date.now() * scintillationSpeed;

  // Combine multiple sine waves for a more natural, less predictable effect
  const scintillationFactor =
    (Math.sin(time) + Math.sin(time * 1.3) + Math.sin(time * 0.7)) / 3;

  // Map the scintillation factor to the scale range
  const newScale =
    minScale + (maxScale - minScale) * (scintillationFactor * 0.5 + 0.5);

  scale.update(() => newScale);

  requestAnimationFrame(animate);
};

animate();


bootstrapCanvas(document.getElementById("root"), Test());
