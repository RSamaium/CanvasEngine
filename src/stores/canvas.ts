import { atom } from 'nanostores'

export const $pixiApp = atom(null)
export const $changeLayout = atom(0)

export function setPixiApp(app) {
    $pixiApp.set(app)
}

export function setChangeLayout() {
    $changeLayout.set($changeLayout.get() + 1)
}