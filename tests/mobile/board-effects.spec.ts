import { test, expect, type Page } from '@playwright/test';
import { newGame } from '../../src/game/engine/game';

async function landOn(page: Page, square: number) {
 const state=newGame(['Adeel','Eman']);state.players[0].position=square-1;state.phase='choose';state.dice=[1,2];
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(value=>{
  localStorage.setItem('dragon-ladder-v1',value);
  (window as unknown as {playedAudio:string[]}).playedAudio=[];
  HTMLMediaElement.prototype.play=function(){(window as unknown as {playedAudio:string[]}).playedAudio.push(this.src);return Promise.resolve();};
 },JSON.stringify(state));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Continue journey'}).click();
 await page.getByRole('button',{name:'Choose die showing 1'}).click();
}
for(const [from,to] of [[8,34],[17,36],[22,58],[46,85],[50,70],[79,98]]){
 test(`landing on ladder ${from} automatically climbs to ${to}`,async({page})=>{
  await landOn(page,from);
  await expect(page.getByLabel(`Adeel on square ${to}`,{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Roll the dice'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Climb the ladder/})).toHaveCount(0);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dragon-ladder-v1')!));
  expect(saved.players[0].position).toBe(to);expect(saved.players[0].fate).toBe(3);expect(saved.turn).toBe(1);
  if(from===79)await page.screenshot({path:'test-results/automatic-ladder-79-98.png'});
 });
}
for(const [square,name,penalty] of [
 [4,'Serpent Dragon',17],[15,'Spiral Dragon',35],[30,'Winged Dragon',26],[37,'Golden Beast',20],
 [41,'Serpent Dragon',17],[52,'Spiral Dragon',35],[56,'Spiral Dragon',35],[61,'Golden Beast',20],[72,'Serpent Dragon',17],
 [78,'Winged Dragon',26],[86,'Spiral Dragon',35],[93,'Winged Dragon',26],[99,'Golden Beast',20],
] as const){
 test(`dragon square ${square} reveals ${name} with penalty ${penalty}`,async({page})=>{
  await landOn(page,square);
  await expect(page.getByRole('heading',{name:'Dragon encounter'})).toBeVisible();
  await expect(page.getByRole('img',{name:`${name} original artwork`})).toBeVisible();
  await expect(page.locator('.dragon-prompt')).toContainText(`Move back ${penalty} squares`);
  if(square===99)await page.screenshot({path:'test-results/dragon-square-99.png'});
  await page.getByRole('button',{name:'Face the Dragon'}).click();
  const fallen=Math.max(1,square-penalty);
  const chainedDragon=[4,41,52].includes(fallen);
  const chainedLadder={17:36,79:98}[fallen as 17|79];
  if(chainedDragon){
   await expect(page.getByRole('heading',{name:'Dragon encounter'})).toBeVisible();
  }else{
   await expect(page.getByLabel(`Adeel on square ${chainedLadder??fallen}`,{exact:true})).toBeVisible();
   await expect(page.getByRole('button',{name:'Roll the dice'})).toBeVisible();
  }
 });
}
for(const [square,hero] of [[9,'Thor'],[23,'Thor'],[54,'Frexia'],[71,'Loki'],[80,'Frexia'],[84,'Loki']] as const){
 test(`hero square ${square} awards ${hero} and its introduction`,async({page})=>{
  await landOn(page,square);
  await expect(page.getByRole('dialog',{name:'Hero card found'})).toBeVisible();
  await expect(page.getByRole('img',{name:`${hero.toLowerCase()} original card artwork`})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {playedAudio:string[]}).playedAudio.filter(src=>src.includes('/VoiceOvers/')))).toEqual([`http://127.0.0.1:3100/VoiceOvers/${hero}.mp3`]);
  await page.getByRole('button',{name:'Claim card'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dragon-ladder-v1')!));
  expect(saved.players[0].heroes).toEqual([hero.toLowerCase()]);expect(saved.turn).toBe(1);
  expect(await page.evaluate(()=>(window as unknown as {playedAudio:string[]}).playedAudio.some(src=>src.includes('PowerActivated')))).toBe(false);
 });
}
