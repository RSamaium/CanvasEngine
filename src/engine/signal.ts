import {
    Subscription
} from "rxjs";
import type { Element } from "./reactive";

type MountFunction = (fn: (element: Element) => void | (() => void)) => void;

// Define ComponentFunction type
export type ComponentFunction<P = {}> = (props: P) => Element | Promise<Element>;

export let currentSubscriptionsTracker: ((subscription: Subscription) => void) | null = null;
export let mountTracker: MountFunction | null = null;

export function mount(fn: MountFunction) {
  mountTracker?.(fn);
}

export function h<C extends ComponentFunction<any>>(
  componentFunction: C,
  props: Parameters<C>[0] = {} as Parameters<C>[0],
  ...children: any[]
): ReturnType<C> {
  const allSubscriptions = new Set<Subscription>();
  const allMounts = new Set<MountFunction>();

  currentSubscriptionsTracker = (subscription) => {
    allSubscriptions.add(subscription);
  };

  mountTracker = (fn: any) => {
    allMounts.add(fn);
  };

  if (children[0] instanceof Array) {
    children = children[0]
  }

  let component = componentFunction({ ...props, children });

  if (!component) {
    component = {};
  }

  component.effectSubscriptions = Array.from(allSubscriptions);
  component.effectMounts = [
    ...Array.from(allMounts),
    ...((component as any).effectMounts ?? [])
  ];

  currentSubscriptionsTracker = null;
  mountTracker = null;

  return component;
}