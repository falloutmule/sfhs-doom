# P06 V12 Physical 4:3 Presentation Repair

## Decision

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` for DOOM-P6-060.

## Presentation ownership

V11 had two presentation owners. SDL configured the canvas, while a JavaScript
MutationObserver restored its attributes and a second scale path transformed
it. Samsung exposed the resulting mismatch as a cropped/enlarged frame with
about 146 unused rows in a nominal 576x432 region.

V12 removes the observer and all attribute rewriting. The engine logical frame,
SDL output, and CSS display rectangle are treated separately. SDL initializes
the natural 320x200 canvas. Only after Doom begins does CSS transform the whole
surface to the portrait 4:3 region. No native, renderer-projection, simulation,
HUD, input, or shared-controls code changes.

## Strong coverage gate

`browser-tests/support/full-frame-coverage.mjs` decodes the canvas screenshot,
classifies every row and column, reports occupied bounds, samples seven rows and
columns, and measures the longest blank band. The focused gate requires at
least 92% vertical/horizontal occupied span and no blank band over 12%.

The synthetic photographed failure (576x432 with only the upper 286 rows
occupied) fails with a 66.20% span and 146-row band. The complete fixture passes.
Live automatic coverage is 100% at 400x300 and live compatibility coverage is
100% at 400x300. The physical-size 576x432 stable sample covers 99.54% of rows;
the next captured frame covers 100%.

## Preserved architecture

Native diagnostics remain effective world 320x200, screenblocks 11, and
internal status inactive. The authentic HUD remains 320x32 with its palette,
face, ammo, and gameplay updates. The V11 minimap-region editor is unchanged;
automation still proves zero intersection with the control deck and all editor
features. Protected V8-V11 candidates are byte-identical.

## Physical boundary

Desktop Chromium, native compilation, package checks, and regression tests
cannot establish Samsung Chrome composition or hands-on editor ergonomics.
V12 therefore remains pending until the exact Pages bytes are operated on the
device. Physical acceptance must explicitly check full top-to-bottom world
fill, absence of crop/black band, editor drag/resize Save/Cancel behavior,
controls, HUD, minimap, and speaker audio.
