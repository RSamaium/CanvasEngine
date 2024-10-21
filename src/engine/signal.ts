import {
    Subscription
} from "rxjs";
import type { Element } from "./reactive";
import { Tick } from "../directives/Scheduler";

type MountFunction = (fn: (element: Element) => void) => void;

// Define ComponentFunction type
export type ComponentFunction<P = {}> = (props: P) => Element | Promise<Element>;

export let currentSubscriptionsTracker: ((subscription: Subscription) => void) | null = null;
export let mountTracker: MountFunction | null = null;

export function mount(fn: (element: Element) => void) {
  mountTracker?.(fn);
}

export function tick(fn: (tickValue: Tick, element: Element) => void) {
  mount((el: Element) => {
    const { context } = el.props
    let subscription: Subscription | undefined
    if (context.tick) {
      subscription = context.tick.observable.subscribe(({ value }) => {
          fn(value, el)
      })
    }
    return () => {
      subscription?.unsubscribe()
    }
  })
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

  // call mount hook for root component
  if (component instanceof Promise) {
    component.then((component) => {
      if (component.props.isRoot) {
        allMounts.forEach((fn) => fn(component));
      }
    })
  }

  currentSubscriptionsTracker = null;
  mountTracker = null;

  return component;
}
