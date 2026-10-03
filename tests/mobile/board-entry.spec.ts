import { test, expect } from '@playwright/test';
import { newGame } from '../../src/game/engine/game';

for(const [width,height,resume] of [[390,844,false],[390,844,true],[320,568,false],[844,390,true],[1366,768,false]] as const){
 test(`board morph ${width}x${height} ${resume?'continue':'new'}`,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width,height});
  if(resume){const state=newGame(['Adeel','Eman']);state.players[0].position=14;state.players[1].position=74;await page.addInitScript(value=>localStorage.setItem('dragon-ladder-v1',value),JSON.stringify(state));}
  await page.addInitScript(()=>{
   const animate=Element.prototype.animate;
   Element.prototype.animate=function(...args:Parameters<typeof animate>){const animation=animate.apply(this,args);if(this.classList.contains('board-entry-art')){animation.pause();(window as unknown as {entryAnimation:Animation}).entryAnimation=animation;}return animation;};
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('.start-art img')).toBeVisible();
  const source=await page.locator('.start-art img').boundingBox();
  await page.getByRole('button',{name:resume?'Continue journey':'New journey',exact:true}).click();
  const overlay=page.locator('.board-entry-art');await expect(overlay).toHaveCount(1);
  const initial=await overlay.boundingBox();
  for(const key of ['x','y','width','height'] as const)expect(Math.abs(initial![key]-source![key])).toBeLessThan(.25);
  expect(await page.locator('.game-shell').evaluate(e=>e.hasAttribute('inert'))).toBe(true);
  await page.evaluate(async()=>{(window as unknown as {entryAnimation:Animation}).entryAnimation.currentTime=360;await new Promise(requestAnimationFrame);});
  if(width===390&&!resume)await page.screenshot({path:'test-results/board-entry-midpoint.png'});
  await page.evaluate(()=>(window as unknown as {entryAnimation:Animation}).entryAnimation.play());
  await expect(overlay).toHaveCount(0);await expect(page.getByRole('button',{name:'Roll the dice',exact:true})).toBeVisible();
  expect(await page.locator('.game-shell').evaluate(e=>e.hasAttribute('inert'))).toBe(false);
  const image=await page.locator('.board-art').boundingBox(),layer=await page.locator('.board-token-layer').boundingBox();expect(image).toEqual(layer);
  expect(await page.locator('.board').evaluate(e=>getComputedStyle(e).transform)).toBe('none');
  await page.screenshot({path:`test-results/board-entry-final-${width}-${resume}.png`});
 });
}
test('reduced motion enters the game without a spatial zoom',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'New journey',exact:true}).click();
 await expect(page.locator('.board-entry-art')).toHaveCount(0);await expect(page.getByRole('button',{name:'Roll the dice',exact:true})).toBeVisible();
});
test('resizing during the board morph reveals the responsive destination',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{const animate=Element.prototype.animate;Element.prototype.animate=function(...args:Parameters<typeof animate>){const result=animate.apply(this,args);if(this.classList.contains('board-entry-art'))result.pause();return result;};});
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'New journey',exact:true}).click();await expect(page.locator('.board-entry-art')).toHaveCount(1);
 await page.setViewportSize({width:844,height:390});await expect(page.locator('.board-entry-art')).toHaveCount(0);await expect(page.getByRole('button',{name:'Roll the dice',exact:true})).toBeVisible();
});
