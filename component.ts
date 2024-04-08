import { Sprite, h } from "./packages";
export { Component } from "./lazy";

export function MoveableSprite(props) {
    return h(Sprite, { image: 'hero.png', y: 0, x: 0, alpha: 0.1 })
} 