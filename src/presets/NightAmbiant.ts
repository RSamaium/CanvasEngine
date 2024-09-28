import { Container, Graphics } from "../components";
import { h, mount } from "../engine/signal";
import { animatedSignal } from "../engine/animation";
import { RadialGradient } from "../utils/RadialGradient";
import { effect, isSignal, signal } from "@signe/reactive";
import { useProps } from "../hooks/useProps";
import { isObservable } from "rxjs";

export function LightSpot(opts) {
  const { radius } = useProps(opts);
  const scale = animatedSignal(1);

  const minScale = 1;
  const maxScale = 2; // Reduced max scale for subtler effect
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

  const draw = (g) => {
    const size = radius() * 2;
    const gradient = new RadialGradient(size, size, 0, size, size, 0);
    gradient.addColorStop(0, "rgba(255, 255, 0, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 0, 0.3)");
    gradient.addColorStop(0.8, "rgba(255, 255, 0, 0)");

    const translate = size / 2;

    g.rect(-translate, -translate, size, size).fill(
      gradient.render({ translate: { x: translate, y: translate } })
    );
  };

  return h(Graphics, {
    draw,
    ...opts,
    scale,
  });
}

export function NightAmbiant(props) {
  const { children } = props;
  let el
  const width = signal(0);
  const height = signal(0);
  let subscription
  const draw = (rectAndHole) => {
    const margin = 80
    rectAndHole.rect(-margin, -margin, width() + margin*2, height() + margin*2);
    rectAndHole.fill(0x000000);
    const applyChildren = (child) => {
      const x = isSignal(child.propObservables.x)
        ? child.propObservables.x()
        : child.props.x;
      const y = isSignal(child.propObservables.y)
        ? child.propObservables.y()
        : child.props.y;
      const radius = isSignal(child.propObservables.radius)
        ? child.propObservables.radius()
        : child.props.radius;
      rectAndHole.circle(x, y, radius);
      rectAndHole.cut();
    }
    for (let child of children) {
      if (isObservable(child)) {
        if (subscription) {
          subscription.unsubscribe()
        }
        subscription = child.subscribe((event) => {
           for (let child of event.fullElements) {
            applyChildren(child)
           }
        })
        return
      }
      applyChildren(child)
    }
  };

  mount((el) => {
    effect(() => {
      const { displayWidth, displayHeight } = el.componentInstance
      const w = +displayWidth()
      const h = +displayHeight()
      setTimeout(() => {
        width.update(() => w)
        height.update(() => h)
      }, 0) // hack
    });
  });

  return h(
    Container,
    {
      width: "100%",
      height: "100%",
      ...props,
    },
    h(Graphics, {
      draw,
      alpha: 0.8,
      blur: 80,
    }),
    ...children
  );
}
