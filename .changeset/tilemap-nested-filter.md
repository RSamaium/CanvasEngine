---
"@canvasengine/tilemap": patch
"@canvasengine/presets": patch
---

Fix: tilemaps are no longer drawn at the wrong position after a nested filter inside a filtered parent. `TilemapPipe` read the last entry of `globalUniforms._activeUniforms`, which is a per-frame pool and not a stack, so it picked up the nested filter pass. It now uses the current global uniform data (#76). `@canvasengine/tilemap` is now vendored in `packages/tilemap`.
