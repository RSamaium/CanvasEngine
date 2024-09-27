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





bootstrapCanvas(document.getElementById("root"), Test());
