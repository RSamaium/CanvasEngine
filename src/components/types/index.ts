import { Signal } from "@signe/reactive";

export type SignalOrPrimitive<T> = T | Signal<T>;