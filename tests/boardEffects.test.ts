import { describe, expect, it } from 'vitest';
import { choose, climb, deserialize, gainHero, ignoreDragon, moveStep, newGame, resolveLanding, roll, sufferDragon } from '../src/game/engine/game';
import { dragonDeck, dragonEncounters, dragonSpaces, getSquareEffect, heroSpaces, ladders } from '../src/game/rules/boardConfig';

// Independent transcription of all special squares from references/board.webp.
const artworkLadders: Record<number, number> = { 8:34, 17:36, 22:58, 46:85, 50:70, 79:98 };
const artworkDragons: Record<number, { card: number; penalty: number }> = {
 4:{card:1,penalty:17}, 15:{card:0,penalty:35}, 30:{card:2,penalty:26},
 37:{card:3,penalty:20}, 41:{card:1,penalty:17}, 52:{card:0,penalty:35},
 56:{card:0,penalty:35}, 61:{card:3,penalty:20}, 72:{card:1,penalty:17},
 78:{card:2,penalty:26}, 86:{card:0,penalty:35}, 93:{card:2,penalty:26}, 99:{card:3,penalty:20},
};
const artworkHeroes = { 9:'thor', 23:'thor', 54:'frexia', 71:'loki', 80:'frexia', 84:'loki' } as const;

describe('artwork-backed square effects',()=>{
 it('transcribes all six ladders, thirteen dragons and six heroes without overlaps',()=>{
  expect(ladders).toEqual(artworkLadders); expect(heroSpaces).toEqual(artworkHeroes);
  expect(dragonSpaces).toEqual(Object.keys(artworkDragons).map(Number));
  expect(dragonEncounters).toEqual(Object.fromEntries(Object.entries(artworkDragons).map(([square,entry])=>[square,entry.card])));
  const all=[...Object.keys(ladders),...Object.keys(artworkDragons),...Object.keys(heroSpaces)];
  expect(new Set(all).size).toBe(25);
 });
 it('resolves every square for every traveler in two-, three- and four-player games',()=>{
  for(const count of [2,3,4]) for(let turn=0;turn<count;turn++) for(let square=1;square<=100;square++){
   const state=newGame(Array.from({length:count},(_,i)=>`P${i}`));state.turn=turn;state.players[turn].position=square;
   const next=resolveLanding({...state,phase:'fate'});
   if(artworkLadders[square]){
    expect(getSquareEffect(square)).toEqual({kind:'ladder',destination:artworkLadders[square]});
    expect(next.phase).toBe('climbing');expect(next.turn).toBe(turn);
    const landed=resolveLanding(climb(next));
    expect(landed.players[turn].position).toBe(artworkLadders[square]);expect(landed.players[turn].fate).toBe(3);
    expect(landed.turn).toBe((turn+1)%count);expect(landed.phase).toBe('roll');
   }else if(artworkDragons[square]){
    expect(next.phase).toBe('dragon');expect(next.encounter).toBe(artworkDragons[square].card);
    expect(dragonDeck[next.encounter!].penalty).toBe(artworkDragons[square].penalty);
   }else if(artworkHeroes[square as keyof typeof artworkHeroes]){
    expect(next.phase).toBe('hero');const claimed=gainHero(next);
    expect(claimed.players[turn].heroes).toEqual([artworkHeroes[square as keyof typeof artworkHeroes]]);
    expect(claimed.turn).toBe((turn+1)%count);
   }else if(square===100){expect(next.phase).toBe(count===2?'victory':'roll');expect(next.winner).toBe(turn);expect(next.finishOrder).toEqual([turn]);}
   else{expect(getSquareEffect(square)).toEqual({kind:'none'});expect(next.phase).toBe('roll');expect(next.turn).toBe((turn+1)%count);}
  }
 });
 it('uses each pictured dragon and penalty regardless of previous encounter count',()=>{
  for(const [square,entry] of Object.entries(artworkDragons)) for(const prior of [0,1,7,12]){
   const state=newGame(['A','B']);state.players[0].position=Number(square);state.dragonIndex=prior;
   const encounter=resolveLanding({...state,phase:'fate'});
   const fallen=sufferDragon(encounter);expect(fallen.players[0].position).toBe(Math.max(1,Number(square)-entry.penalty));
   expect(fallen.turn).toBe(0);expect(fallen.phase).toBe('fate');
   expect(ignoreDragon(encounter,'fate').players[0].fate).toBe(2);
  }
 });
 it('resolves a dragon victim landing on another special square',()=>{
  const state=newGame(['A','B']);state.players[0].position=37;state.phase='dragon';state.encounter=3;
  const fallen=sufferDragon(state);
  expect(fallen.players[0].position).toBe(17);
  expect(resolveLanding(fallen).phase).toBe('climbing');
  expect(resolveLanding({...fallen,players:fallen.players.map(p=>p.id===0?{...p,position:41}:p)})).toMatchObject({phase:'dragon',encounter:1});
 });
 it('never triggers an effect on a square merely passed during a roll',()=>{
  for(const square of [...Object.keys(artworkLadders),...Object.keys(artworkDragons),...Object.keys(artworkHeroes)].map(Number).filter(s=>s<99)){
   const state=newGame(['A','B']);state.players[0].position=square-1;
   const passing=moveStep(choose(roll(state,[2,2]),0));
   expect(passing.players[0].position).toBe(square);expect(passing.phase).toBe('moving');expect(passing.specialTileDetected).toBeNull();
  }
 });
 it('updates resumed dragon encounters to the symbol printed at their square',()=>{
  const state=newGame(['A','B']);state.players[0].position=99;state.phase='dragon';state.encounter=0;
  expect(deserialize(JSON.stringify(state))?.encounter).toBe(3);
 });
});
