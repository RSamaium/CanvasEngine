import { isSignal } from "@signe/reactive";
import { Mesh as PixiMesh, Geometry, Shader, Texture, Assets, BLEND_MODES } from "pixi.js";
import { createComponent, Element, registerComponent } from "../engine/reactive";
import { ComponentInstance, DisplayObject } from "./DisplayObject";
import { DisplayObjectProps } from "./types/DisplayObject";
import { SignalOrPrimitive } from "./types";
import { ComponentFunction } from "../engine/signal";

/**
 * Interface defining the properties for a Mesh component.
 * Extends DisplayObjectProps to inherit common display object properties.
 */
interface MeshProps extends DisplayObjectProps {
  /** The geometry defining the mesh structure (vertices, indices, UVs, etc.) */
  geometry?: SignalOrPrimitive<Geometry>;
  /** The shader to render the mesh with */
  shader?: SignalOrPrimitive<Shader>;
  /** The texture to apply to the mesh */
  texture?: SignalOrPrimitive<Texture | string>;
  /** The image URL to load as texture */
  image?: SignalOrPrimitive<string>;
  /** The tint color to apply to the mesh */
  tint?: SignalOrPrimitive<number>;
  /** Whether to round pixels for sharper rendering */
  roundPixels?: SignalOrPrimitive<boolean>;
}

const resolveProp = <T>(value: SignalOrPrimitive<T> | undefined): T | undefined => {
  return isSignal(value as any) ? (value as any)() : value as T | undefined;
};

const isValidGeometry = (value: Geometry | undefined): value is Geometry => {
  if (!value) return false;
  if (value instanceof Geometry) return true;

  const geometry = value as any;
  return typeof geometry.on === 'function' && typeof geometry.off === 'function';
};

/**
 * Canvas Mesh component class that extends DisplayObject with PixiMesh functionality.
 * This component allows rendering of custom 3D meshes with shaders and textures.
 * 
 * @example
 * ```typescript
 * // Basic mesh with geometry and texture
 * const mesh = Mesh({
 *   geometry: myGeometry,
 *   texture: "path/to/texture.png",
 *   tint: 0xff0000
 * });
 * 
 * // Mesh with custom shader
 * const customMesh = Mesh({
 *   geometry: myGeometry,
 *   shader: myCustomShader,
 *   draw: (mesh) => {
 *     // Custom mesh manipulation
 *     mesh.rotation += 0.01;
 *   }
 * });
 * ```
 */
class CanvasMesh extends DisplayObject(PixiMesh) {
  /**
   * Constructor for the CanvasMesh component.
   * Initializes the PixiMesh with default geometry and shader to prevent errors.
   * 
   * @example
   * ```typescript
   * // This constructor is called internally by the engine
   * const mesh = new CanvasMesh();
   * ```
   */
  constructor() {
    // Call parent constructor with minimal options to prevent destructuring error
    // @ts-ignore - PixiMesh constructor expects options object but TypeScript doesn't recognize it
    super({
      geometry: new Geometry()
    });
  }

  /**
   * Initializes the mesh component with the provided properties.
   * This method is called before onUpdate to set up initial state.
   * 
   * @param props - The initial properties
   * @example
   * ```typescript
   * // This method is called internally when the component is created
   * mesh.onInit({
   *   geometry: myGeometry,
   *   texture: "texture.png"
   * });
   * ```
   */
  onInit(props: MeshProps) {
    super.onInit(props);

    // Set initial geometry if provided
    const geometry = resolveProp(props.geometry);
    if (isValidGeometry(geometry)) {
      try {
        this.geometry = geometry;
      } catch (error) {
        console.warn('Failed to set geometry:', error);
      }
    }
    
    // Set initial shader if provided
    const shader = resolveProp(props.shader);
    if (shader) {
      this.shader = shader;
    }
  }

  /**
   * Updates the mesh component when properties change.
   * Handles texture loading, shader updates, and other property changes.
   * 
   * @param props - The updated properties
   * @example
   * ```typescript
   * // This method is called internally when props change
   * mesh.onUpdate({
   *   tint: 0x00ff00,
   *   texture: "new-texture.png"
   * });
   * ```
   */
  async onUpdate(props: MeshProps) {
    super.onUpdate(props);

    // Handle geometry updates
    const geometry = resolveProp(props.geometry);
    if (isValidGeometry(geometry)) {
      try {
        this.geometry = geometry;
      } catch (error) {
        console.warn('Failed to update geometry:', error);
      }
    }

    // Handle shader/material updates
    const shader = resolveProp(props.shader);
    if (shader) {
      this.shader = shader;
    }

    // Handle texture updates
    const texture = resolveProp(props.texture);
    const image = resolveProp(props.image);
    if (texture) {
      if (typeof texture === 'string') {
        this.texture = await Assets.load(texture);
      } else {
        this.texture = texture;
      }
    } else if (image) {
      this.texture = await Assets.load(image);
    }

    // Handle tint updates
    if (props.tint !== undefined) {
      this.tint = props.tint;
    }

    // Handle blend mode updates
    if (props.blendMode !== undefined) {
      this.blendMode = props.blendMode;
    }

    // Handle round pixels updates
    if (props.roundPixels !== undefined) {
      this.roundPixels = props.roundPixels;
    }
  }

  /**
   * Called when the component is about to be destroyed.
   * Cleans up the draw effect subscription and calls the parent destroy method.
   * 
   * @param parent - The parent element
   * @param afterDestroy - Callback function to execute after destruction
   * @example
   * ```typescript
   * // This method is typically called by the engine internally
   * await mesh.onDestroy(parentElement, () => console.log('Mesh destroyed'));
   * ```
   */
  async onDestroy(parent: Element<ComponentInstance>, afterDestroy: () => void): Promise<void> {
    const _afterDestroyCallback = async () => {
      afterDestroy();
    };
    await super.onDestroy(parent, _afterDestroyCallback);
  }
}

// Register the component with the engine
registerComponent("Mesh", CanvasMesh);

/**
 * Creates a Mesh component with the specified properties.
 * This is the main function used to create mesh instances in your application.
 * 
 * @param props - The properties for the mesh component
 * @returns A mesh component element
 * @example
 * ```typescript
 * import { Mesh } from 'canvasengine';
 * 
 * // Create a basic textured mesh
 * const myMesh = Mesh({
 *   geometry: triangleGeometry,
 *   texture: "assets/texture.png",
 *   x: 100,
 *   y: 100,
 *   tint: 0xff0000
 * });
 * 
 * // Create a mesh with custom shader
 * const shaderMesh = Mesh({
 *   geometry: planeGeometry,
 *   shader: customShader,
 *   draw: (mesh) => {
 *     mesh.rotation += 0.01;
 *   }
 * });
 * ```
 */
export const Mesh: ComponentFunction<MeshProps> = (props) => {
  return createComponent("Mesh", props);
};

// Export the component class for advanced usage
export { CanvasMesh };

// Export the props interface for TypeScript users
export type { MeshProps };
