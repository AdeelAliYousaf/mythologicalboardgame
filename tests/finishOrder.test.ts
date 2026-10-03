import { describe, expect, it } from 'vitest';
import { advanceTurn, choose, deserialize, moveStep, newGame, roll, serialize, stealHero, sufferDragon, type GameState } from '../src/game/engine/game';
function finish(state: GameState, index: number) {
 state={...state,turn:index,phase:'roll',players:state.players.map((p,i)=>i===index?{...p,position:99}:p)};
 return moveStep(choose(roll(state,[1,2]),0));
}
describe('finish order',()=>{
 it('continues until only one traveler remains, preserving the first winner',()=>{
  for(const count of [2,3,4]){
   let state=newGame(Array.from({length:count},(_,i)=>`P${i}`));
   const order=count===4?[2,0,3]:count===3?[1,2]:[1];
   for(const [place,index] of order.entries()){
    state=finish(state,index);expect(state.finishOrder).toEqual(order.slice(0,place+1));expect(state.winner).toBe(order[0]);
    expect(state.phase).toBe(place===count-2?'victory':'roll');
    if(state.phase==='roll') expect(state.finishOrder).not.toContain(state.players[state.turn].id);
   }
   expect(advanceTurn(state)).toEqual(state);
   expect(roll(state,[1,2])).toEqual(state);
  }
 });
 it('skips completed travelers in cyclic turns, including wrapping around player zero',()=>{
  let state=finish(newGame(['A','B','C','D']),0);state=finish(state,2);
  state={...state,turn:1};expect(advanceTurn(state).turn).toBe(3);
  state={...state,turn:3};expect(advanceTurn(state).turn).toBe(1);
 });
 it('round-trips finish order and resumes legacy first-win saves',()=>{
  const state=finish(newGame(['A','B','C','D']),2);
  expect(deserialize(serialize(state))).toEqual(state);
  const legacy: Partial<GameState>={...state,phase:'victory',turn:2};delete legacy.finishOrder;
  const resumed=deserialize(JSON.stringify(legacy))!;
  expect(resumed.phase).toBe('roll');expect(resumed.turn).toBe(3);expect(resumed.finishOrder).toEqual([2]);expect(resumed.winner).toBe(2);
 });
 it('keeps finishers at 100 and protects them from Loki and Thor',()=>{
  let state=finish(newGame(['A','B','C','D']),0);
  state.players[0].heroes=['frexia'];state.players[1].heroes=['loki','thor'];
  state={...state,turn:1,phase:'dragon',encounter:0};state.players[1].position=52;
  expect(sufferDragon(state,0)).toEqual(state);expect(stealHero(state,0,'frexia')).toEqual(state);
  state={...state,turn:0,phase:'roll'};expect(roll(state,[1,2])).toEqual(state);
 });
});
