import type { Element } from "canvasengine";
import { Container3D, Mesh3D as PixiMesh3D, Plane, Vector3 } from "@pixi/3d";
import { deepMerge, mergeVec3, resolveObjectChanges, type Vec3Input } from "./utils";

/** Options of the `drag3d` prop. */
export interface Drag3DOptions {
  /**
   * Plane the node slides on: `"xz"` (ground, default), `"xy"` or `"yz"`, through the
   * node's position when the drag starts
   */
  plane?: "xz" | "xy" | "yz";
  /** Rounds the position to this grid step */
  snap?: number;
  start?: (event: any) => void;
  /** Called on each move with the new world position */
  move?: (position: { x: number; y: number; z: number }, event: any) => void;
  end?: (event: any) => void;
}

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
  /** CSS cursor shown over the node, such as `"pointer"` */
  cursor?: string;
  /** What the pointer hits: `"box"` (default for meshes), `"geometry"`, `"sphere"`, or a shape */
  hitVolume?: any;
  /** Drag the node on a plane with the pointer: `true` or options */
  drag3d?: boolean | Drag3DOptions;
  /** Draws an ink outline around the node's meshes; needs an `<Outline>` effect in the view */
  outlined?: boolean;
  /** Draws the node's meshes as lines; needs a `<Wireframe>` effect in the view */
  wireframe?: boolean;
  /** Inside a `<Model3D>`: name of the bone this node follows, such as `"Hand.R"` */
  bone?: string;
  [key: string]: any;
}

/** 3D pointer events forwarded from props to the node. */
export const EVENTS_3D = [
  "click",
  "pointertap",
  "pointerdown",
  "pointerup",
  "pointerupoutside",
  "pointermove",
  "globalpointermove",
  "pointerover",
  "pointerout",
  "pointerenter",
  "pointerleave",
  "pointercancel",
  "rightclick",
  "rightdown",
  "rightup",
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

/** Finds the nearest ancestor component instance matching `test`. */
export function findAncestor<T = any>(element: Element<any> | null, test: (instance: any) => boolean): T | null {
  let parent = element?.parent;
  while (parent) {
    if (test(parent.componentInstance)) return parent.componentInstance as T;
    parent = parent.parent;
  }
  return null;
}

/** The `<View3D>` component holding an element. */
export function findViewComponent(element: Element<any> | null): any {
  return findAncestor(element, (instance) => !!instance?.isView3DComponent);
}

/** Calls `fn` on every Mesh3D of a subtree, the node included. */
export function forEachMesh(node: Container3D, fn: (mesh: PixiMesh3D) => void) {
  node.traverse((child: Container3D) => {
    if (child instanceof PixiMesh3D) fn(child);
  });
}

const PLANE_NORMALS = {
  xz: new Vector3(0, 1, 0),
  xy: new Vector3(0, 0, 1),
  yz: new Vector3(1, 0, 0),
};

/**
 * Mixin turning a `Container3D` subclass into a CanvasEngine component.
 *
 * It implements the engine lifecycle (`onInit`, `onMount`, `onUpdate`, `onDestroy`)
 * for 3D transforms, visibility, pointer events, dragging and render passes.
 * Subclasses override `applyProps3D` for their own props and call `super.applyProps3D`.
 */
export function Node3D(Base: new (...args: any[]) => Container3D): any {
  return class Node3DComponent extends Base {
    fullProps: Node3DProps = {};
    isMounted = false;
    element: Element<any> | null = null;
    _handlers = new Map<string, (...args: any[]) => void>();
    _dragCleanup: (() => void) | null = null;
    _boneOwner: any = null;

    /** Children of this component attach here. */
    get childTarget3D(): Container3D {
      return this as unknown as Container3D;
    }

    onInit(props: Node3DProps) {
      this.fullProps = resolveObjectChanges({ ...props }, {});
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
      props = resolveObjectChanges(props, this.fullProps);
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
      if (props.cursor !== undefined) (node as any).cursor = props.cursor;
      if (props.hitVolume !== undefined) (node as any).hitVolume = props.hitVolume;

      // lookAt depends on the position: re-aim whenever one of them changes
      const lookAt = mergeVec3({ x: 0, y: 0, z: 0 }, this.fullProps.lookAt);
      if (lookAt && (initial || props.lookAt !== undefined || position || props.x !== undefined || props.y !== undefined || props.z !== undefined)) {
        node.lookAt(lookAt);
      }

      this._syncEvents(props);
      if ("drag3d" in props) this._syncDrag();
      if (initial || props.outlined !== undefined) this.applyPassFlag("outline", this.fullProps.outlined);
      if (initial || props.wireframe !== undefined) this.applyPassFlag("wireframe", this.fullProps.wireframe);
      if (initial || "bone" in props) this._syncBone();
    }

    /** Turns an opt-in render pass on or off for every mesh of this node. */
    applyPassFlag(pass: string, enabled: boolean | undefined) {
      if (enabled === undefined) return;
      forEachMesh(this as unknown as Container3D, (mesh) => {
        if (enabled) mesh.enablePass(pass);
        else mesh.disablePass(pass);
      });
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
      } else if (hasHandler) {
        this._ensurePickable();
      }
    }

    _ensurePickable() {
      const node = this as any;
      if (node.eventMode === undefined || node.eventMode === "passive" || node.eventMode === "none") {
        node.eventMode = "static";
      }
    }

    /** Pointer dragging on a plane through the node, with `drag3d`. */
    _syncDrag() {
      this._dragCleanup?.();
      this._dragCleanup = null;
      const value = this.fullProps.drag3d;
      if (!value) return;
      const options: Drag3DOptions = value === true ? {} : value;
      const node = this as any;
      this._ensurePickable();
      if (node.cursor === undefined && this.fullProps.cursor === undefined) node.cursor = "grab";

      const point = new Vector3();
      const onDown = (event: any) => {
        const view = this.element ? findViewComponent(this.element)?.view : null;
        if (!view) return;
        // Keeps an orbit camera from turning during the drag
        event.stopPropagation();
        const normal = PLANE_NORMALS[options.plane ?? "xz"];
        const origin = node.position;
        const plane = new Plane(normal, -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z));
        if (!view.screenToWorld(event.global, plane, point)) return;
        const offset = { x: origin.x - point.x, y: origin.y - point.y, z: origin.z - point.z };
        const id = event.pointerId;
        options.start?.(event);

        const onMove = (move: any) => {
          if (move.pointerId !== id || !view.screenToWorld(move.global, plane, point)) return;
          const snap = (v: number) => (options.snap ? Math.round(v / options.snap) * options.snap : v);
          const next = {
            x: snap(point.x + offset.x),
            y: snap(point.y + offset.y),
            z: snap(point.z + offset.z),
          };
          node.position.set(next.x, next.y, next.z);
          options.move?.(next, move);
        };
        const onEnd = (end: any) => {
          if (end.pointerId !== id) return;
          stop();
          options.end?.(end);
        };
        const stop = () => {
          node.off("globalpointermove", onMove);
          node.off("pointerup", onEnd);
          node.off("pointerupoutside", onEnd);
        };
        node.on("globalpointermove", onMove);
        node.on("pointerup", onEnd);
        node.on("pointerupoutside", onEnd);
      };
      node.on("pointerdown", onDown);
      this._dragCleanup = () => node.off("pointerdown", onDown);
    }

    /** Follows a bone of the nearest `<Model3D>` ancestor, with the `bone` prop. */
    _syncBone() {
      this._boneOwner?.detachFromBone?.(this);
      this._boneOwner = null;
      const bone = this.fullProps.bone;
      if (!bone || !this.element) return;
      const owner = findAncestor(this.element, (instance) => typeof instance?.attachToBone === "function");
      if (!owner) {
        console.warn(`bone="${bone}" needs a <Model3D> ancestor`);
        return;
      }
      owner.attachToBone(this, bone);
      this._boneOwner = owner;
    }

    onDestroy(_parent: Element<any>, afterDestroy?: () => void) {
      const node = this as any;
      for (const [name, handler] of this._handlers) node.off(name, handler);
      this._handlers.clear();
      this._dragCleanup?.();
      this._boneOwner?.detachFromBone?.(this);
      this._boneOwner = null;
      this.element = null;
      afterDestroy?.();
      node.parent?.removeChild(node);
      if (!node.destroyed) node.destroy();
    }
  };
}
