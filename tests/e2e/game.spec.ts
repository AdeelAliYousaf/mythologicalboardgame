import { test, expect } from '@playwright/test';
import { newGame, type GameState } from '../../src/game/engine/game';
test('start screen and playable dice flow', async ({page})=>{
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await expect(page.getByRole('heading',{name:'Dragon Ladder'})).toBeVisible();
 await page.screenshot({path:`test-results/start-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'New journey'}).click();
 await expect(page.getByRole('img',{name:/Original Dragon Ladder board artwork/})).toBeVisible();
 await page.getByRole('button',{name:'Roll the dice'}).click();
 await expect(page.getByRole('heading',{name:'Choose your fate'})).toBeVisible();
 await page.screenshot({path:`test-results/dice-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:/Choose die showing/}).first().click();
 await expect(page.getByText(/Square \d+ of 100/)).toBeVisible();
});
for(const phase of ['dragon','hero','victory'] as const){
 test(`${phase} scene`,async({page})=>{
  const state:GameState=newGame(['Adeel','Eman']);
  state.players[0].position=phase==='dragon'?52:phase==='hero'?54:100;
  state.phase=phase;
  state.encounter=phase==='dragon'?0:null;
  state.winner=phase==='victory'?0:null;
  await page.addInitScript(value=>localStorage.setItem('dragon-ladder-v1',value),JSON.stringify(state));
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Continue journey'}).click();
  await expect(page.getByRole('heading',{name:phase==='dragon'?'Dragon encounter':phase==='hero'?'A hero answers your call':'Journey results'})).toBeVisible();
  await page.screenshot({path:`test-results/${phase}-${test.info().project.name}.png`,fullPage:true});
 });
}
test('board fits tablet viewport',async({page})=>{
 await page.setViewportSize({width:768,height:1024});
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'New journey'}).click();
 const board=page.locator('.board');
 const box=await board.boundingBox();
 expect(box).not.toBeNull();
 expect(box!.width).toBeLessThanOrEqual(768);
 expect(Math.abs(box!.width/box!.height-1170/1560)).toBeLessThan(.01);
 await page.screenshot({path:`test-results/tablet-${test.info().project.name}.png`,fullPage:true});
});
test('small phone board and controls fit',async({page})=>{
 for(const width of [320,360,430]){
  await page.setViewportSize({width,height:780});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'New journey'}).click();
  const board=await page.locator('.board').boundingBox();
  const action=await page.getByRole('button',{name:'Roll the dice'}).boundingBox();
  expect(board).not.toBeNull();expect(action).not.toBeNull();
  expect(board!.x+board!.width).toBeLessThanOrEqual(width+1);
  expect(action!.x+action!.width).toBeLessThanOrEqual(width+1);
  await page.evaluate(()=>localStorage.removeItem('dragon-ladder-v1'));
 }
});
test('ladder climbs automatically',async({page})=>{
 const state=newGame(['Adeel','Eman']);state.players[0].position=17;state.phase='fate';state.missedLadder=17;
 await page.addInitScript(value=>localStorage.setItem('dragon-ladder-v1',value),JSON.stringify(state));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Continue journey'}).click();
 await expect(page.getByRole('button',{name:'Climb the ladder'})).toHaveCount(0);
 await expect(page.getByLabel('Adeel on square 36')).toBeVisible({timeout:10000});
});
test('offers Fate to catch a passed ladder',async({page})=>{
 const missed=newGame(['Adeel','Eman']);missed.players[0].position=10;missed.phase='ladder-choice';missed.missedLadder=8;
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.evaluate(value=>localStorage.setItem('dragon-ladder-v1',value),JSON.stringify(missed));
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Continue journey'}).click();
 await expect(page.getByRole('button',{name:/Catch the ladder/})).toBeVisible();
 await page.getByRole('button',{name:/Catch the ladder/}).click();
 await expect(page.getByLabel('Adeel on square 34')).toBeVisible({timeout:10000});
});
test('Dragon reveals printed penalty and moves backward',async({page})=>{
 const state=newGame(['Adeel','Eman']);state.players[0].position=52;state.phase='dragon';state.encounter=0;
 await page.addInitScript(value=>localStorage.setItem('dragon-ladder-v1',value),JSON.stringify(state));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Continue journey'}).click();
 await page.getByRole('button',{name:'Face the Dragon'}).click();
 await expect(page.getByRole('img',{name:'Move back 35 squares'})).toBeVisible();
 await expect(page.getByText('Square 20 · Fate')).toBeVisible({timeout:10000});
 await expect(page.getByLabel('Adeel on square 20')).toBeVisible({timeout:10000});
});
