import type { Element } from "canvasengine";
import { Container3D } from "@pixi/3d";
import { deepMerge, mergeVec3, type Vec3Input } from "./utils";

/** Props shared by every 3D node component. */
export interface Node3DProps {
  /** Position in world units: `[x, y, z]` or `{ x, y, z }` */
  position?: Vec3Input;
  x?: number;
  y?: number;
  z?: number;
  /** Euler rotation in radians: `[x, y, z]` or `{ x, y, z }` */
  rotation?: Vec3Input;
  /** Uniform number or per-axis scale */
  scale?: Vec3Input;
  /** Point the node at a world position (cameras and lights look down -Z, meshes face +Z) */
  lookAt?: Vec3Input;
  visible?: boolean;
  label?: string;
  /** Pointer events mode; set automatically to `'static'` when an event handler is given */
  eventMode?: "none" | "passive" | "auto" | "static" | "dynamic";
  [key: string]: any;
}

/** 3D pointer events forwarded from props to the node. */
export const EVENTS_3D = [
  "click",
  "pointertap",
  "pointerdown",
  "pointerup",
  "pointermove",
  "pointerover",
  "pointerout",
  "pointerenter",
  "pointerleave",
  "rightclick",
  "wheel",
];

/**
 * Finds the Container3D a child must attach to: the scene root of the nearest
 * `<View3D>`, or the nearest 3D node component.
 */
export function findParent3D(element: Element<any>): Container3D | null {
  let parent = element.parent;
  while (parent) {
    const target = (parent.componentInstance as any)?.childTarget3D;
    if (target) return target;
    parent = parent.parent;
  }
  return null;
}

/**
 * Mixin turning a `Container3D` subclass into a CanvasEngine component.
 *
 * It implements the engine lifecycle (`onInit`, `onMount`, `onUpdate`, `onDestroy`)
 * for 3D transforms, visibility and pointer events. Subclasses override
 * `applyProps3D` for their own props and call `super.applyProps3D`.
 */
export function Node3D(Base: new (...args: any[]) => Container3D): any {
  return class Node3DComponent extends Base {
    fullProps: Node3DProps = {};
    isMounted = false;
    element: Element<any> | null = null;
    _handlers = new Map<string, (...args: any[]) => void>();

    /** Children of this component attach here. */
    get childTarget3D(): Container3D {
      return this as unknown as Container3D;
    }

    onInit(props: Node3DProps) {
      this.fullProps = { ...props };
    }

    onMount(element: Element<any>, index?: number) {
      if ((this as any).destroyed) return;
      this.element = element;
      const parent3D = findParent3D(element);
      if (!parent3D) {
        console.warn(`<${element.tag}> must be placed inside a <View3D>`);
        return;
      }
      if (index !== undefined && index <= parent3D.children.length) {
        parent3D.addChildAt(this as unknown as Container3D, index);
      } else {
        parent3D.addChild(this as unknown as Container3D);
      }
      this.isMounted = true;
      this.applyProps3D(this.fullProps, true);
    }

    onUpdate(props: Node3DProps) {
      this.fullProps = deepMerge(this.fullProps, props);
      if (!this.isMounted) return;
      this.applyProps3D(props, false);
    }

    /**
     * Applies changed props. `initial` is true on mount, where `props` holds every prop.
     */
    applyProps3D(props: Node3DProps, initial: boolean) {
      const node = this as unknown as Container3D;

      const position = mergeVec3(node.position, props.position);
      if (position) node.position.set(position.x, position.y, position.z);
      if (props.x !== undefined) node.position.x = props.x;
      if (props.y !== undefined) node.position.y = props.y;
      if (props.z !== undefined) node.position.z = props.z;

      const rotation = mergeVec3(node.rotation, props.rotation);
      if (rotation) node.rotation.set(rotation.x, rotation.y, rotation.z);

      const scale = mergeVec3(node.scale, props.scale);
      if (scale) node.scale.set(scale.x, scale.y, scale.z);

      if (props.visible !== undefined) node.visible = props.visible;
      if (props.label !== undefined) node.label = props.label;

      // lookAt depends on the position: re-aim whenever one of them changes
      const lookAt = mergeVec3({ x: 0, y: 0, z: 0 }, this.fullProps.lookAt);
      if (lookAt && (initial || props.lookAt !== undefined || position || props.x !== undefined || props.y !== undefined || props.z !== undefined)) {
        node.lookAt(lookAt);
      }

      this._syncEvents(props);
    }

    _syncEvents(props: Node3DProps) {
      const node = this as any;
      let hasHandler = false;
      for (const name of EVENTS_3D) {
        if (!(name in props)) continue;
        const previous = this._handlers.get(name);
        if (previous) node.off(name, previous);
        const handler = props[name];
        if (typeof handler === "function") {
          node.on(name, handler);
          this._handlers.set(name, handler);
          hasHandler = true;
        } else {
          this._handlers.delete(name);
        }
      }
      if (props.eventMode !== undefined) {
        node.eventMode = props.eventMode;
      } else if (hasHandler && (node.eventMode === undefined || node.eventMode === "passive")) {
        node.eventMode = "static";
      }
    }

    onDestroy(_parent: Element<any>, afterDestroy?: () => void) {
      const node = this as any;
      for (const [name, handler] of this._handlers) node.off(name, handler);
      this._handlers.clear();
      this.element = null;
      afterDestroy?.();
      node.parent?.removeChild(node);
      if (!node.destroyed) node.destroy();
    }
  };
}
