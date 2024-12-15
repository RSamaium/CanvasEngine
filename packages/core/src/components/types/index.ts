import { Signal } from "@signe/reactive";
import { AnimatedSignal } from "../../engine/animation";

export type SignalOrPrimitive<T> = T | Signal<T> | AnimatedSignal<T>;