// Historical capture script for the previous token-position implementation.
// Run only against that implementation; current verification uses test:geometry.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
await page.route('https://fonts.googleapis.com/**', route => route.abort());
await page.route('https://fonts.gstatic.com/**', route => route.abort());
await page.addInitScript(() => localStorage.setItem('dragon-ladder-v1', JSON.stringify({
  players: [{ id: 0, name: 'Diagnostic', position: 14, fate: 3, heroes: [], frexiaUsed: false }, { id: 1, name: 'Other', position: 1, fate: 3, heroes: [], frexiaUsed: false }],
  turn: 0, phase: 'roll', dice: null, chosen: null, movementTarget: null, movementStart: null,
  traversedCells: [], finalRolledCell: null, specialTileDetected: null, dragonIndex: 0, encounter: null, missedLadder: null, history: [], winner: null,
})));
await page.goto(`${process.env.BOARD_AUDIT_URL ?? 'http://127.0.0.1:3100'}/?debugBoard=1`, { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Continue journey' }).click();
await page.locator('.token-anchor').first().waitFor();
const result = await page.evaluate(() => {
  const rect = selector => {
    const element = document.querySelector(selector), r = element.getBoundingClientRect(), s = getComputedStyle(element);
    return { left: r.left, top: r.top, width: r.width, height: r.height, transform: s.transform, objectFit: s.objectFit, padding: s.padding, margin: s.margin, border: s.border, zoom: s.zoom };
  };
  const ancestors = []; let node = document.querySelector('.board-art');
  while (node) { const s = getComputedStyle(node); ancestors.push({ tag: node.tagName, class: node.className, transform: s.transform, zoom: s.zoom, perspective: s.perspective }); node = node.parentElement; }
  return { boardShell: rect('.board'), boardImage: rect('.board-art'), tokenPosition: rect('.token-position'), tokenCluster: rect('.token-cluster'), tokenAnchor: rect('.token-anchor'), tokenVisual: rect('.token'), ancestors };
});
writeFileSync('docs/board-calibration/baseline.json', JSON.stringify(result, null, 2));
await page.screenshot({ path: 'docs/board-calibration/baseline-390.png' });
console.log(JSON.stringify(result));
await browser.close();
