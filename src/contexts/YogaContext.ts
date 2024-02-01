import { Yoga } from 'yoga-layout';

export let YogaContext: Yoga = null as unknown as Yoga;
export const setYoyaContext = (yoga: Yoga) => {
    YogaContext = yoga;
}