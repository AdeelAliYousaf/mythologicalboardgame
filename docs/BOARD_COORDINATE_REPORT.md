# Measured board coordinate report

## Source calibration

The unchanged source image is **1170 × 1560px**. Its SHA-256 is `69b3137ef83efb0648818ccc3ada9946b8d2b98df1f5dd5dd85009e9e263f27a`; the served board has the same hash.

Playable bounds in source pixels: **left=62, top=219, right=1107, bottom=1353**.

Normalized bounds (0–1): left=0.052991453, top=0.140384615, right=0.946153846, bottom=0.867307692.

Grid model: **measured row-column edges (nonuniform)**.

`COLUMN_EDGES_PX = [62, 174, 268, 355, 450, 591, 733, 829, 914, 997, 1107]`

`ROW_EDGES_PX = [219, 300, 427, 558, 648, 773, 917, 1013, 1131, 1252, 1353]`

Column widths: [112, 94, 87, 95, 141, 142, 96, 85, 83, 110]px. Row heights: [81, 127, 131, 90, 125, 144, 96, 118, 121, 101]px. Equal interpolation would be incorrect.

The measurements identify peak raster boundary samples. Thin lines are antialiased over approximately 1–3 source pixels; original vector coordinates are unavailable. Interior lines are detected by median local contrast across the grid, rather than glyphs. Outer boundaries use the strongest median transition in each border region. Run `python scripts/measure-board-grid.py` to reproduce the scan. Pillow and NumPy are required for this optional measurement script. See `source-grid-overlay.png` for all measured boundaries and 100 centers over the original artwork.

## Root cause and transformation audit

Two separate transformations introduced the drift:

1. The previous geometry divided an approximately measured rectangle into equal tenths. The source grid has unequal widths and heights. Square 14's old canonical screen point was (247.312500, 452.625000) at 390×844, versus the measured cell center (260.333333, 455.166667).
2. A lone token was assigned `cluster-0`, adding (-7.02px, -7.02px) in that viewport. Its actual center was (240.292496, 445.605011), around 20.041px left and 9.562px above the true cell center.

The old negative-half-size anchor itself centered the inner token at the already displaced cluster origin. Motion did **not** overwrite a centering transform in the measured baseline. The old image used `object-fit: fill`, with no image padding, margin, border, or letterboxing. Image and shell rectangles matched exactly. All measured gameplay ancestors had `transform: none`, `zoom: 1`, and `perspective: none`. Neither object-fit nor ancestor transforms caused the baseline drift.

The new `getCellCenter(square)` is the only coordinate function. It retains the existing pure serpentine mapping, then averages adjacent measured edges. CSS positions a sized anchor and applies `translate(-50%, -50%)`. A separate cluster child applies symmetric offsets; a singleton has zero offset. Motion owns only the visual child. The active outline and magenta center dot share that visual's center. Image, token, atmosphere, effect, and debug layers use the same absolute inset rectangle.

## Actual gameplay DOM measurements

These captures record the layout at the time of the coordinate audit. The subsequent mobile UI refinement changes the rendered board rectangle while retaining the measured source edges and token coordinate architecture. `npm run test:mobile` checks layer equality, aspect ratio, and squares 14/74 in the current layout.

At **390×844**, with no camera transform:

| Element | Left | Top | Width | Height |
|---|---:|---:|---:|---:|
| boardShell (square 14) | 0.000000 | 58.000000 | 390.000000 | 520.000000 |
| boardImage (square 14) | 0.000000 | 58.000000 | 390.000000 | 520.000000 |
| tokenLayer (square 14) | 0.000000 | 58.000000 | 390.000000 | 520.000000 |
| tokenAnchor (square 14) | 252.921875 | 447.750000 | 14.812500 | 14.812500 |
| tokenVisual (square 14) | 252.921875 | 447.750000 | 14.812500 | 14.812500 |

| Square | Artwork center | Expected screen center | Actual anchor center | Actual visual center |
|---|---|---|---|---|
| 14 | (781, 1191.5) | (260.333333, 455.166667) | (260.328125, 455.156250) | (260.328125, 455.156250) |
| 74 | (781, 492.5) | (260.333333, 222.166667) | (260.328125, 222.156250) | (260.328125, 222.156250) |

Square 14: logical row 1, visual row 8, visual column 6; normalized center (781/1170, 1191.5/1560). Square 74: logical row 7, visual row 2, visual column 6; normalized center (781/1170, 492.5/1560). These are cell centers, not number-glyph centers.

## Verification results

- **1100 square/viewport cases:** every square 1–100 at all 11 requested viewports: 320x568, 360x800, 375x667, 390x844, 393x852, 412x915, 430x932, 768x1024, 1024x768, 1366x768, 1920x1080.
- **242 rendered grid-line checks:** all 11 column boundaries and 11 row boundaries per viewport, independently projected from source measurements.
- **50 additional scenarios:** orientation changes for squares 1, 14, 40, 74, 100; common zoom/pan/camera-follow transforms; Motion scale 1.4; clusters of 1–4 on 14 and 74; and actual gameplay pages on 14 and 74.
- **1162 total token-anchor checks**, or **2324 X/Y assertions**. Each requires less than 1px error.
- Maximum observed anchor X error: **0.015625000px**.
- Maximum observed anchor Y error: **0.014903846px**.
- Maximum unclustered visual X/Y error: **0.015625000 / 0.014903846px**.
- Maximum cluster centroid X/Y error: **0.005208333 / 0.010416667px**.

The production game has no zoom/pan camera. The isolated harness tests a shared camera ancestor at scale 1, 1.35, and 1.2 with translations, confirming that image and token layers remain coincident under those transforms. Portrait→landscape→portrait tests use 390×844→844×390→390×844.

Use `?debugBoard=1` in the game for red outer bounds, cyan grid lines, yellow crosshairs, white square labels, magenta actual token centers, and DOM rectangle readouts. Clustering is disabled in this calibration mode. Normal gameplay enables symmetric clustering.

Run `npm run build`, then `npx playwright test --config playwright.geometry.config.ts` and `node scripts/summarize-board-geometry.mjs`. The harness URL is `/test-board` and returns 404 unless `BOARD_GEOMETRY_TESTING=1`; Playwright sets that flag on its server. No game rules or original artwork were changed. The service-worker cache version was advanced to discard cached app code using the previous geometry.

Full measurements are in `board-calibration/verification-summary.json`, `gameplay-dom.json`, and the per-viewport JSON files. Debug captures are in the same directory.
