---
"canvasengine": patch
---

Fix: `GamepadControls` now unsubscribes from joypad.js when it is destroyed, so a closed UI no longer answers to the gamepad (#77). It no longer throws on init when the Gamepad API is missing (`window.joypad = {}`) (#78). New optional `stepInterval` gamepad option to limit how often a stick direction is applied while the stick stays pushed, so a menu cursor does not race through its entries (#79).
