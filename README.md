# Dragon Ladder

A local, pass-and-play digital adaptation of the supplied Norse board game artwork.

## Setup

Requires Node.js 20.9 or newer. Run `npm install`, then `npm run dev` and open `http://localhost:3000`.

## Commands

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — serve production build
- `npm test` — Vitest rules suite

Deploy as a standard Next.js application. There is no backend; active games are saved in browser localStorage. Add `?debugBoard=1` to inspect board calibration.

## Structure

`src/game` contains pure rules and board coordinates. `src/components` contains the game interface. `public/assets` contains unchanged source artwork and derived card crops. `docs` records source mapping and interpretations.

## Board coordinate verification

The board uses measured, nonuniform grid edges from the unchanged source artwork. See [the coordinate report](docs/BOARD_COORDINATE_REPORT.md) for calibration, DOM measurements, and results.

- `npm run build`, then `npm run test:geometry` ? all 100 squares at 11 viewports, resize, shared camera transforms, visual scaling, clusters, and actual gameplay. Requires Microsoft Edge.
- `npm run report:board` ? summarize the captured verification evidence.
- `npm run measure:board` ? reproduce source-image measurements (optional; requires Python, Pillow, and NumPy).

The `/test-board` harness returns 404 unless `BOARD_GEOMETRY_TESTING=1`; the geometry runner sets this flag on its server.

## Gameplay refinements

Winning requires landing exactly on square 100. Choosing an overshooting die keeps the traveler in place and ends the turn. Hero introductions play on discovery; claiming a card does not activate its power.

Run `npm run build`, then `npm run test:mobile` for phone/landscape/desktop layout, card audio events, the mobile menu, and exact-finish browser checks.

Finish order is saved across reloads. The race continues after the first finisher until only one traveler remains. Completed travelers are skipped and cannot be targeted by hero powers. Results show the first `player count - 1` finishers.
