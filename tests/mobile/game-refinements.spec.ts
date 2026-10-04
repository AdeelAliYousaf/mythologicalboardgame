import { test, expect, type Page } from '@playwright/test';
import { newGame, type GameState } from '../../src/game/engine/game';
import { getCellCenter } from '../../src/game/rules/boardConfig';

async function resume(page: Page, game: GameState) {
 await page.addInitScript(value => {
  localStorage.setItem('dragon-ladder-v1', value);
  (window as unknown as { playedAudio: string[] }).playedAudio = [];
  HTMLMediaElement.prototype.play = function () { (window as unknown as { playedAudio: string[] }).playedAudio.push(this.src); return Promise.resolve(); };
 }, JSON.stringify(game));
 await page.goto('/', { waitUntil: 'domcontentloaded' });
 await page.getByRole('button', { name: 'Continue journey' }).click();
}
function savedGame() { const s = newGame(['Adeel', 'Eman', 'Sigrid', 'Bjorn']); s.players[0].position = 14; s.players[1].position = 74; return s; }

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 844, height: 390 }, { width: 1366, height: 768 }]) {
 test(`gameplay fits ${viewport.width}x${viewport.height}`, async ({ page }) => {
  await page.setViewportSize(viewport); await resume(page, savedGame());
  const button = page.getByRole('button', { name: 'Roll the dice', exact: true });
  await expect(button).toBeVisible();
  const bounds = await button.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  if (viewport.width < 1000) expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
  const geometry = await page.evaluate(() => {
   const rect = (selector: string) => { const r = document.querySelector(selector)!.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
   return { image: rect('.board-art'), layer: rect('.board-token-layer'), anchors: [rect('.token-anchor[data-player-id="0"]'), rect('.token-anchor[data-player-id="1"]')], overflow: document.documentElement.scrollWidth > innerWidth };
  });
  expect(geometry.overflow).toBe(false); expect(geometry.image).toEqual(geometry.layer); expect(geometry.image.width / geometry.image.height).toBeCloseTo(.75, 3);
  for (const [index, square] of [14, 74].entries()) {
   const c = getCellCenter(square), a = geometry.anchors[index], image = geometry.image;
   expect(Math.abs(a.x+a.width/2-(image.x+image.width*c.normalizedX))).toBeLessThan(1);
   expect(Math.abs(a.y+a.height/2-(image.y+image.height*c.normalizedY))).toBeLessThan(1);
  }
  await page.screenshot({ path: `test-results/refined-roll-${viewport.width}.png` });
  await button.click(); await expect(page.getByRole('heading', { name: 'Choose your fate' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Choose die showing/ }).first()).toBeInViewport();
  const afterRoll = await page.locator('.board-art').boundingBox();
  expect(afterRoll!.y).toBeCloseTo(geometry.image.y, 0);
  expect(afterRoll!.height).toBeCloseTo(geometry.image.height, 0);
  await page.screenshot({ path: `test-results/refined-dice-${viewport.width}.png` });
  await page.getByRole('button', { name: /Choose die showing/ }).first().click();
  const afterChoice = await page.locator('.board-art').boundingBox();
  expect(afterChoice!.y).toBeCloseTo(geometry.image.y, 0);
  expect(afterChoice!.height).toBeCloseTo(geometry.image.height, 0);
 });
}
for (const [square, hero] of [[9, 'Thor'], [54, 'Frexia'], [71, 'Loki']] as const) {
 test(`${hero} acquisition plays introduction without activation`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = savedGame(); state.players[0].position = square; state.phase = 'hero';
  await resume(page, state);
  await expect(page.getByRole('dialog', { name: 'Hero card found' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { playedAudio: string[] }).playedAudio.filter(src => src.includes('/VoiceOvers/')))).toEqual([`http://127.0.0.1:3100/VoiceOvers/${hero}.mp3`]);
  if (hero === 'Frexia') await page.screenshot({ path: 'test-results/refined-hero-390.png' });
  await page.getByRole('button', { name: 'Claim card' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const voices = await page.evaluate(() => (window as unknown as { playedAudio: string[] }).playedAudio.filter(src => src.includes('/VoiceOvers/')));
  expect(voices).toEqual([`http://127.0.0.1:3100/VoiceOvers/${hero}.mp3`]);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dragon-ladder-v1')!));
  expect(saved.players[0].heroes).toContain(hero.toLowerCase());
 });
}
test('mobile menu opens real content, sound controls and keyboard dismissal', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 }); const state = savedGame(); state.players[0].heroes = ['thor']; state.history = ['Adeel obtained thor.']; await resume(page, state);
 await page.getByRole('button', { name: 'Open game menu' }).click();
 const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
 await page.getByRole('button', { name: 'Travelers', exact: true }).click(); await expect(dialog.getByRole('heading', { name: 'Bjorn' })).toBeVisible();
 await page.getByRole('button', { name: 'Back to game menu' }).click(); await page.getByRole('button', { name: 'Hero cards', exact: true }).click(); await expect(dialog.getByRole('heading', { name: 'thor', exact: true })).toBeVisible();
 await page.getByRole('button', { name: 'Back to game menu' }).click(); await page.getByRole('button', { name: 'Journey record', exact: true }).click(); await expect(dialog.getByText('Adeel obtained thor.')).toBeVisible();
 await page.getByRole('button', { name: 'Back to game menu' }).click(); await page.getByRole('button', { name: 'How to play', exact: true }).click(); await expect(dialog.getByText(/must land exactly on square 100/)).toBeVisible();
 await page.getByRole('button', { name: 'Back to game menu' }).click(); await page.getByRole('button', { name: 'Sound', exact: true }).click(); await page.getByLabel('Realm music').fill('30');
 await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('dragon-ladder-audio-v1')!).musicVolume)).toBe(30);
 await page.screenshot({ path: 'test-results/refined-menu-390.png' }); await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
});
for (const die of [1, 2, 6]) test(`square 99 with ${die} ${die === 1 ? 'wins' : 'passes turn without movement'}`, async ({ page }) => {
 const state = savedGame(); state.players[0].position = 99; state.phase = 'choose'; state.dice = [die, die]; await page.setViewportSize({ width: 390, height: 844 }); await resume(page, state);
 await page.getByRole('button', { name: `Choose die showing ${die}` }).first().click();
 if (die === 1) { await expect(page.getByRole('status')).toContainText('Adeel reached Asgard'); await expect(page.getByRole('button', { name: 'Roll the dice' })).toBeVisible(); }
 else { await expect(page.getByRole('button', { name: 'Roll the dice' })).toBeVisible(); const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dragon-ladder-v1')!)); expect(saved.players[0].position).toBe(99); expect(saved.turn).toBe(1); expect(saved.winner).toBeNull(); }
});

for (const hero of ['thor', 'loki'] as const) test(`${hero} activation voice plays when its power is used`, async ({ page }) => {
 const state = savedGame(); state.players[0].heroes = [hero]; state.players[1].heroes = ['frexia'];
 if (hero === 'loki') { state.phase = 'dragon'; state.encounter = 0; state.players[0].position = 52; }
 await page.setViewportSize({ width: 390, height: 844 }); await resume(page, state);
 if (hero === 'thor') {
  await page.getByRole('button', { name: 'View hero cards, 1 in hand' }).click();
  await page.getByRole('button', { name: 'Use Thor to take a card' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Eman.*frexia/ }).click();
 } else await page.getByRole('button', { name: 'Use Loki with Eman' }).click();
 await expect.poll(() => page.evaluate(() => (window as unknown as { playedAudio: string[] }).playedAudio.filter(src => src.includes('/VoiceOvers/')))).toEqual([`http://127.0.0.1:3100/VoiceOvers/${hero === 'thor' ? 'Thor' : 'Loki'}-PowerActivated.mp3`]);
});

test('restarting a resumed game preserves all four travelers', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 }); await resume(page, savedGame());
 await page.getByRole('button', { name: 'Open game menu' }).click();
 await page.getByRole('button', { name: 'Restart game', exact: true }).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dragon-ladder-v1')!));
 expect(saved.players.map((p: { name: string }) => p.name)).toEqual(['Adeel', 'Eman', 'Sigrid', 'Bjorn']);
 expect(saved.players.every((p: { position: number }) => p.position === 1)).toBe(true);
});
