import {
    Subscription
} from "rxjs";
import type { Element } from "./reactive";

type MountFunction = (fn: (element: Element) => void | (() => void)) => void;

let currentSubscriptionsTracker: ((subscription) => void) | null = null;
let mountTracker: MountFunction | null = null;

export function mount(fn: MountFunction) {
  mountTracker?.(fn);
}

export function h(
  componentFunction,
  props = {},
  ...children
): Element | Promise<Element> {
  const allSubscriptions = new Set<Subscription>();
  const allMounts = new Set<MountFunction>();

  currentSubscriptionsTracker = (subscription) => {
    allSubscriptions.add(subscription);
  };

  mountTracker = (fn: any) => {
    allMounts.add(fn);
  };

  let component = componentFunction({ ...props, children });
  if (!component) {
    component = {};
  }
  component.effectSubscriptions = Array.from(allSubscriptions);
  component.effectMounts = Array.from(allMounts);

  currentSubscriptionsTracker = null;
  mountTracker = null;

  return component;
}