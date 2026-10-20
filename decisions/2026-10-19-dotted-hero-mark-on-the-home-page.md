## 2026-10-19: Dotted hero mark on the home page

- **The home hero shows the tile mark drawn in dots** (`src/components/ParticleMark.astro`), inspired by si.gov. Dots assemble on load; near the cursor or a finger they scatter and glow Lamplight, then spring back.
- Plain canvas, no library. The animation sleeps when nothing moves or the hero is off screen; with reduced motion the mark is drawn once and stays still.
- The table illustration stays available: `<Hero art="table">` (the default for other pages) brings it back.
- **Update: the dots cycle through game pieces** (`src/lib/dot-shapes.ts`): the tile mark, a d20, a meeple, a chess knight, a fanned hand of cards, and a mahjong tile, then back to the mark. Generic pieces only, so no publisher art. Because the cycle runs indefinitely, the hero's pause button now shows for the dots too (WCAG 2.2.2). New shapes are one draw function each on the 64 by 64 grid.
