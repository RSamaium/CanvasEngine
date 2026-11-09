---
"canvasengine": patch
---

Sprite sheet animations are now time-based. The tick payload was read as the signal wrapper, so `deltaRatio` was always `undefined` and every animation advanced one tick per rendered frame (twice as slow at 30 fps). A sheet animation now lasts the time its frames say at any frame rate, skips several frames when a long frame passes them, and carries the extra time over when it loops.
