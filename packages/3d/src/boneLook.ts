import { Container3D, Matrix4, Mesh3D as PixiMesh3D, Quaternion, Vector3, type Model3D as PixiModel3D } from "@pixi/3d";
import { toVec3, type Vec3Input } from "./utils";

export interface LookAtBone {
  /** Name of the bone to turn, such as `"Head"` */
  bone: string;
  /** World point to look at: `[x, y, z]` */
  target: Vec3Input;
  /** 0 keeps the animation, 1 looks straight at the target. Default 1 */
  weight?: number;
  /** Largest turn away from the animated pose, in radians. Default 1.2 (about 70°) */
  maxAngle?: number;
  /** How fast the bone turns toward the target: higher is snappier, 0 is instant. Default 8 */
  speed?: number;
  /** Direction the bone faces, in the model's axes, when the model looks ahead. Default `[0, 0, 1]` (+Z) */
  forward?: Vec3Input;
}

/** Where a bone lives: a scene node, or an index in a skeleton drawn by a skinned mesh. */
type BoneRef =
  | { kind: "node"; node: Container3D }
  | { kind: "skeleton"; skeleton: any; index: number; skinned: Container3D };

/** Finds a bone by name: a scene node first, then a skeleton bone. */
export function resolveBone(model: PixiModel3D, name: string): BoneRef | null {
  const node = model.getChildByLabel(name, true) as Container3D | null;
  if (node) return { kind: "node", node };
  for (const skeleton of model.skeletons ?? []) {
    const index = (skeleton as any)._labelToIndex?.[name];
    if (index === undefined) continue;
    let skinned: Container3D | null = null;
    model.traverse((child: any) => {
      if (!skinned && child instanceof PixiMesh3D && child.skeleton === skeleton) skinned = child;
    });
    if (skinned) return { kind: "skeleton", skeleton, index, skinned };
  }
  return null;
}

const matrix = new Matrix4();
const parentMatrix = new Matrix4();
const scratchPosition = new Vector3();
const scratchScale = new Vector3();
const parentRotation = new Quaternion();
const IDENTITY = new Quaternion();

/**
 * Turns one bone toward a target on top of the animation. Each frame it starts from
 * the pose the animation gave the bone, so the turn never accumulates.
 */
export class BoneLook {
  /** The bone's local rotation before the turn, kept when no clip rewrites it */
  #base = new Quaternion();
  /** The local rotation written last frame, to tell whether a clip rewrote it since */
  #lastApplied: Quaternion | null = null;
  /** The bone's facing, in its own space, found on the first frame */
  #forwardLocal: Vector3 | null = null;
  /** The smoothed turn, in world space */
  #turn = new Quaternion();

  constructor(private readonly ref: BoneRef) {}

  /** Reads the local rotation the bone has now. */
  #readLocal(out: Quaternion): Quaternion {
    if (this.ref.kind === "node") return out.copyFrom(this.ref.node.quaternion);
    const r = this.ref.skeleton.localRotation;
    const i = this.ref.index * 4;
    return out.set(r[i], r[i + 1], r[i + 2], r[i + 3]);
  }

  #writeLocal(q: Quaternion) {
    if (this.ref.kind === "node") {
      this.ref.node.quaternion.copyFrom(q);
      return;
    }
    const r = this.ref.skeleton.localRotation;
    const i = this.ref.index * 4;
    r[i] = q.x;
    r[i + 1] = q.y;
    r[i + 2] = q.z;
    r[i + 3] = q.w;
    this.ref.skeleton.dirty = true;
  }

  /** World position of the bone and world rotation of its parent. */
  #readFrames(position: Vector3, parentRot: Quaternion) {
    if (this.ref.kind === "node") {
      const node = this.ref.node;
      node.getGlobalTransform(matrix).decompose(position, scratchRotation, scratchScale);
      if (node.parent) node.parent.getGlobalTransform(parentMatrix).decompose(scratchPosition, parentRot, scratchScale);
      else parentRot.identity();
      return;
    }
    const { skeleton, index, skinned } = this.ref;
    skeleton.updateWorld();
    const skinnedWorld = skinned.getGlobalTransform();
    matrix.fromArray(skeleton._nodeWorldMatrix, index * 16);
    matrix.premultiply(skinnedWorld).decompose(position, scratchRotation, scratchScale);
    const parent = skeleton.parent[index];
    if (parent >= 0) parentMatrix.fromArray(skeleton._nodeWorldMatrix, parent * 16).premultiply(skinnedWorld);
    else parentMatrix.copyFrom(skinnedWorld);
    parentMatrix.decompose(scratchPosition, parentRot, scratchScale);
  }

  /**
   * Applies the turn for this frame. `modelRotation` is the model's world rotation,
   * which gives the model's forward axis in the world.
   */
  update(settings: LookAtBone, modelRotation: Quaternion, deltaSeconds: number) {
    const local = this.#readLocal(new Quaternion());
    // A clip that ran this frame rewrote the bone: that is the new base. Otherwise keep the old one.
    if (!this.#lastApplied || !nearlyEqual(local, this.#lastApplied)) this.#base.copyFrom(local);

    const position = new Vector3();
    this.#readFrames(position, parentRotation);
    const baseWorld = parentRotation.clone().multiply(this.#base);

    if (!this.#forwardLocal) {
      // On the first frame the bone faces the model's forward: remember it in the bone's space
      const forward = toVec3(settings.forward) ?? { x: 0, y: 0, z: 1 };
      const forwardWorld = new Vector3(forward.x, forward.y, forward.z).applyQuaternion(modelRotation).normalize();
      this.#forwardLocal = forwardWorld.applyQuaternion(baseWorld.clone().inverse());
    }
    const facing = this.#forwardLocal.clone().applyQuaternion(baseWorld).normalize();
    const target = toVec3(settings.target) ?? { x: 0, y: 0, z: 0 };
    const toTarget = new Vector3(target.x - position.x, target.y - position.y, target.z - position.z);
    if (toTarget.magnitude() < 1e-6) return;
    toTarget.normalize();

    // The turn from where the animation points the bone to the target, limited and weighted
    const wanted = new Quaternion().setFromUnitVectors(facing, toTarget);
    const angle = 2 * Math.acos(Math.min(1, Math.abs(wanted.w)));
    const maxAngle = settings.maxAngle ?? 1.2;
    if (angle > maxAngle) wanted.copyFrom(IDENTITY.clone().slerp(wanted, maxAngle / angle));
    const weight = Math.min(1, Math.max(0, settings.weight ?? 1));
    if (weight < 1) wanted.copyFrom(IDENTITY.clone().slerp(wanted, weight));

    const speed = settings.speed ?? 8;
    if (speed <= 0) this.#turn.copyFrom(wanted);
    else this.#turn.slerp(wanted, 1 - Math.exp(-speed * deltaSeconds));

    // New world rotation = turn * base world; back to the parent's space
    const result = parentRotation.clone().inverse().multiply(this.#turn).multiply(baseWorld);
    this.#writeLocal(result);
    this.#lastApplied = result.clone();
  }

  /** Puts the animated pose back. */
  restore() {
    if (this.#lastApplied) this.#writeLocal(this.#base);
    this.#lastApplied = null;
  }
}

const scratchRotation = new Quaternion();

function nearlyEqual(a: Quaternion, b: Quaternion): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.z - b.z) < 1e-6 && Math.abs(a.w - b.w) < 1e-6;
}
