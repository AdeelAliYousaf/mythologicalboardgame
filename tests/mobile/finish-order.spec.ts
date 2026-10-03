import { test, expect } from '@playwright/test';
import { newGame } from '../../src/game/engine/game';

for(const count of [2,3,4]) test(`${count} travelers continue in order and show the correct results`,async({page})=>{
 const names=['Adeel','Eman','Sigrid','Bjorn'].slice(0,count);
 const state=newGame(names);state.players.forEach(p=>p.position=99);state.phase='choose';state.dice=[1,2];
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(value=>{
  if(!localStorage.getItem('dragon-ladder-v1'))localStorage.setItem('dragon-ladder-v1',value);
  HTMLMediaElement.prototype.play=()=>Promise.resolve();
  // Deterministic fresh dice: both dice roll 1.
  crypto.getRandomValues=function<T extends ArrayBufferView|null>(array:T):T{if(array)new Uint32Array(array.buffer,array.byteOffset,array.byteLength/4).fill(0);return array;};
 },JSON.stringify(state));
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Continue journey'}).click();
 for(let place=0;place<count-1;place++){
  if(place>0){await page.getByRole('button',{name:'Roll the dice'}).click();}
  await page.getByRole('button',{name:'Choose die showing 1'}).first().click();
  await expect(page.getByLabel(`${names[place]} on square 100`,{exact:true})).toBeVisible();
  if(place<count-2){
   await expect(page.getByRole('button',{name:'Roll the dice'})).toBeVisible();
   await expect(page.getByRole('heading',{name:'Journey results'})).toHaveCount(0);
   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dragon-ladder-v1')!).turn)).toBe(place+1);
   await page.reload();await page.getByRole('button',{name:'Continue journey'}).click();
  }
 }
 await expect(page.getByRole('heading',{name:'Journey results'})).toBeVisible();
 const rows=page.locator('.finish-standings li');await expect(rows).toHaveCount(count-1);
 for(let index=0;index<count-1;index++){await expect(rows.nth(index)).toContainText(names[index]);await expect(rows.nth(index)).toContainText(['Winner','2nd','3rd'][index]);}
 await expect(page.getByRole('button',{name:'Roll the dice'})).toHaveCount(0);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dragon-ladder-v1')!));
 expect(saved.winner).toBe(0);expect(saved.finishOrder).toEqual(Array.from({length:count-1},(_,i)=>i));expect(saved.players[count-1].position).toBe(99);
 await page.screenshot({path:`test-results/results-${count}-players.png`});
 await page.reload();await page.getByRole('button',{name:'Continue journey'}).click();await expect(page.getByRole('heading',{name:'Journey results'})).toBeVisible();
});

for(const viewport of [{width:320,height:568},{width:844,height:390},{width:1366,height:768}])test(`final podium fits ${viewport.width}x${viewport.height}`,async({page})=>{
 const state=newGame(['Adeel','Eman','Sigrid','Bjorn']);state.players.slice(0,3).forEach(p=>p.position=100);state.finishOrder=[0,1,2];state.winner=0;state.turn=2;state.phase='victory';
 await page.setViewportSize(viewport);
 await page.addInitScript(value=>localStorage.setItem('dragon-ladder-v1',value),JSON.stringify(state));
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Continue journey'}).click();
 await expect(page.locator('.finish-standings li')).toHaveCount(3);
 await expect(page.getByRole('heading',{name:'Journey results'})).toBeInViewport();
 await expect(page.getByRole('button',{name:'Play again'})).toBeInViewport();
 await page.screenshot({path:`test-results/podium-${viewport.width}.png`});
});
