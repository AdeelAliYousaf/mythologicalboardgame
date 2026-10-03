# Board effect audit

Checked directly against the unchanged native `references/board.webp`, `dragon-cards.webp`, and `hero-cards.webp`.

- Six ladders climb automatically after landing, without a confirmation or Fate cost. The current turn remains locked during the climb animation and advances once at completion.
- Corrected two ladder bases and one upper endpoint: **39 -> 58 becomes 22 -> 58**, and **82 -> 99 becomes 79 -> 98**. The rail feet are below the row boundaries at 1013px and 427px, inside squares 22 and 79. The upper rail ends of the latter are in square 98, inside measured column bounds 268-355px and row bounds 219-300px. Squares 39 and 82 lie along the ladder shafts, not at their feet.
- Thirteen dragon squares use the card matching their pictured silhouette. Penalties are Spiral 35, Serpent 17, Winged 26, and Golden Beast 20. Previous encounter count cannot change a square's card.
- Six hero squares reveal their corresponding original card and introduction voice. Claiming adds the card to the correct traveler's hand and ends the turn without power activation audio.
- Passing a special square during movement does not activate it. Square 100 retains the exact-roll finish rule.
- Old saved Dragon encounters are normalized to the card printed at their current square; old pending ladder prompts resume as automatic climbs.

The native crops `board-calibration/upper-ladder.png` and `middle-ladder.png` show the ladder feet against cyan measured row boundaries.

## Ladder routes

| Foot square | Upper-end square |
|---:|---:|
| 8 | 34 |
| 17 | 36 |
| 22 | 58 |
| 46 | 85 |
| 50 | 70 |
| 79 | 98 |

## All 100 squares

| Square | Landing effect |
|---:|---|
| 1 | Normal square; next turn |
| 2 | Normal square; next turn |
| 3 | Normal square; next turn |
| 4 | Serpent Dragon: back 17 |
| 5 | Normal square; next turn |
| 6 | Normal square; next turn |
| 7 | Normal square; next turn |
| 8 | Automatic ladder to 34 |
| 9 | Hero card: Thor |
| 10 | Normal square; next turn |
| 11 | Normal square; next turn |
| 12 | Normal square; next turn |
| 13 | Normal square; next turn |
| 14 | Normal square; next turn |
| 15 | Spiral Dragon: back 35 |
| 16 | Normal square; next turn |
| 17 | Automatic ladder to 36 |
| 18 | Normal square; next turn |
| 19 | Normal square; next turn |
| 20 | Normal square; next turn |
| 21 | Normal square; next turn |
| 22 | Automatic ladder to 58 |
| 23 | Hero card: Thor |
| 24 | Normal square; next turn |
| 25 | Normal square; next turn |
| 26 | Normal square; next turn |
| 27 | Normal square; next turn |
| 28 | Normal square; next turn |
| 29 | Normal square; next turn |
| 30 | Winged Dragon: back 26 |
| 31 | Normal square; next turn |
| 32 | Normal square; next turn |
| 33 | Normal square; next turn |
| 34 | Normal square; next turn |
| 35 | Normal square; next turn |
| 36 | Normal square; next turn |
| 37 | Golden Beast: back 20 |
| 38 | Normal square; next turn |
| 39 | Normal square; next turn |
| 40 | Normal square; next turn |
| 41 | Serpent Dragon: back 17 |
| 42 | Normal square; next turn |
| 43 | Normal square; next turn |
| 44 | Normal square; next turn |
| 45 | Normal square; next turn |
| 46 | Automatic ladder to 85 |
| 47 | Normal square; next turn |
| 48 | Normal square; next turn |
| 49 | Normal square; next turn |
| 50 | Automatic ladder to 70 |
| 51 | Normal square; next turn |
| 52 | Normal square; next turn |
| 53 | Normal square; next turn |
| 54 | Hero card: Frexia |
| 55 | Spiral Dragon: back 35 |
| 56 | Normal square; next turn |
| 57 | Normal square; next turn |
| 58 | Normal square; next turn |
| 59 | Normal square; next turn |
| 60 | Normal square; next turn |
| 61 | Golden Beast: back 20 |
| 62 | Normal square; next turn |
| 63 | Normal square; next turn |
| 64 | Normal square; next turn |
| 65 | Normal square; next turn |
| 66 | Normal square; next turn |
| 67 | Normal square; next turn |
| 68 | Normal square; next turn |
| 69 | Normal square; next turn |
| 70 | Normal square; next turn |
| 71 | Hero card: Loki |
| 72 | Serpent Dragon: back 17 |
| 73 | Normal square; next turn |
| 74 | Normal square; next turn |
| 75 | Normal square; next turn |
| 76 | Spiral Dragon: back 35 |
| 77 | Normal square; next turn |
| 78 | Winged Dragon: back 26 |
| 79 | Automatic ladder to 98 |
| 80 | Hero card: Frexia |
| 81 | Normal square; next turn |
| 82 | Normal square; next turn |
| 83 | Normal square; next turn |
| 84 | Hero card: Loki |
| 85 | Normal square; next turn |
| 86 | Spiral Dragon: back 35 |
| 87 | Normal square; next turn |
| 88 | Normal square; next turn |
| 89 | Normal square; next turn |
| 90 | Normal square; next turn |
| 91 | Normal square; next turn |
| 92 | Normal square; next turn |
| 93 | Winged Dragon: back 26 |
| 94 | Normal square; next turn |
| 95 | Normal square; next turn |
| 96 | Normal square; next turn |
| 97 | Normal square; next turn |
| 98 | Normal square; next turn |
| 99 | Golden Beast: back 20 |
| 100 | Record finish place (exact landing); continue until one traveler remains |

## Verification

`tests/boardEffects.test.ts` independently transcribes the artwork and checks all 100 square resolutions for all nine traveler contexts (2 + 3 + 4), all pictured dragon penalties across four prior encounter counts, and passing-square behavior.

`tests/mobile/board-effects.spec.ts` exercises actual one-step dice landings on all six ladders, thirteen dragons, and six hero squares, including automatic climbs, backward movement, introduction audio calls, and card ownership.

Run `npm test`, then `npm run build` and `npm run test:mobile`.
