import { Application, ApplicationOptions } from "pixi.js";
import { Observable, Subscription } from "rxjs";
import { ComponentFunction, h } from "./signal";
import { useProps } from '../hooks/useProps';
import { registerAllComponents, registerComponent } from './reactive';

// Import all components to ensure they are registered
// This is done here (not in reactive.ts) to avoid circular dependencies
// Components register themselves when their modules are imported
import '../components/Canvas';
import '../components/Container';
import '../components/Sprite';
import '../components/Text';
import '../components/Graphic';
import '../components/Mesh';
import '../components/Viewport';
import '../components/TilingSprite';
import '../components/NineSliceSprite';
import '../components/DOMContainer';
import '../components/DOMElement';
import '../components/ParticleEmitter';

/**
 * Extended options for bootstrapCanvas that includes component registration configuration.
 * 
 * @property components - Optional mapping of component names to their classes (can include mocks for testing)
 * @property autoRegister - If true (default), registers all default components before applying custom components. If false, only registers the specified components.
 */
export interface BootstrapOptions extends ApplicationOptions {
  components?: {
    [name: string]: any; // ComponentClass
  };
  autoRegister?: boolean; // true by default if components is not provided
  enableLayout?: boolean; // true by default
}

type BootstrapResult = {
  canvasElement: any;
  app: Application;
  hmrSubscription?: Subscription;
};

/**
 * Bootstraps a canvas element and renders it to the DOM.
 * 
 * @param rootElement - The HTML element where the canvas will be rendered. Can be null.
 * @param canvas - A Promise that resolves to an Element representing the canvas component.
 * @param options - Optional bootstrap options including ApplicationOptions and component registration configuration.
 * @returns A Promise that resolves to the rendered canvas element.
 * @throws {Error} If the provided element is not a Canvas component.
 * 
 * @example
 * ```typescript
 * // Default: all components registered automatically
 * await bootstrapCanvas(rootElement, MyComponent, {
 *   width: 800,
 *   height: 600
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // With mocks for testing
 * import { mockComponents } from '@canvasengine/testing';
 * await bootstrapCanvas(rootElement, MyComponent, {
 *   components: mockComponents,
 *   autoRegister: false
 * });
 * ```
 */
export const bootstrapCanvas = async (rootElement: HTMLElement | null, canvas: ComponentFunction<any>, options?: BootstrapOptions): Promise<BootstrapResult> => {
  // Extract component registration options
  const { components, autoRegister, enableLayout, ...appOptions } = options ?? {};
  const layoutOptions = (appOptions as ApplicationOptions & {
    layout?: { throttle?: number };
  }).layout;
  if (enableLayout !== false) {
    await import('@pixi/layout');
  }
  
  // Handle component registration
  if (components) {
    if (autoRegister !== false) {
      // Register all default components first, then override with custom ones
      registerAllComponents();
    }
    // Register the specified components (overriding defaults if autoRegister is true)
    Object.entries(components).forEach(([name, componentClass]) => {
      registerComponent(name, componentClass);
    });
  } else {
    // Default behavior: register all components
    registerAllComponents();
  }
  
  const app = new Application();
  const initOptions = {
    resizeTo: rootElement,
    autoStart: false,
    antialias: true,
    ...appOptions,
    layout: {
      throttle: 0,
      ...(layoutOptions ?? {}),
    },
  } as unknown as Partial<ApplicationOptions>;
  await app.init(initOptions);

  const renderCanvasElement = (canvasElement: any) => {
    if (canvasElement.tag != 'Canvas') {
      throw new Error('Canvas is required');
    }
    canvasElement.render(rootElement, app);

    const { backgroundColor } = useProps(canvasElement.props, {
      backgroundColor: 'black'
    });

    app.renderer.background.color = backgroundColor()

    return {
      canvasElement,
      app
    };
  };

  const canvasElement = h(canvas) as any;

  if (canvasElement instanceof Observable) {
    return new Promise<BootstrapResult>((resolve, reject) => {
      let resolved = false;
      let hmrSubscription: Subscription;

      hmrSubscription = canvasElement.subscribe({
        next(value: any) {
          try {
            const nextCanvasElement = value?.elements?.[0] ?? value;
            if (!nextCanvasElement) return;

            const result = renderCanvasElement(nextCanvasElement);

            if (!resolved) {
              resolved = true;
              Promise.resolve().then(() => {
                resolve({
                  ...result,
                  hmrSubscription
                });
              });
            }
          } catch (error) {
            reject(error);
          }
        },
        error: reject
      });
    });
  }

  return renderCanvasElement(await canvasElement);
};
