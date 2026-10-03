import { describe,it,expect } from 'vitest';
import { BOARD, BOARD_GRID_BOUNDS, getBoardCell, getCellCenter, getSquareAtBoardCell, indexToSquare, ladders, squareToIndex } from '../src/game/rules/boardConfig';
import { choose, climb, deserialize, gainHero, ignoreDragon, moveStep, newGame, reroll, resolveLanding, roll, serialize, stealHero, sufferDragon } from '../src/game/engine/game';
describe('board',()=>{it('snakes through rows',()=>{expect(getCellCenter(1).x).toBeLessThan(getCellCenter(10).x);expect(getCellCenter(11).x).toBeGreaterThan(getCellCenter(20).x);expect(getCellCenter(100).y).toBeLessThan(getCellCenter(1).y)});it('uses measured inner grid bounds for cell centers',()=>{for(let square=1;square<=100;square++){const position=getCellCenter(square);expect(position.x).toBeGreaterThan(BOARD_GRID_BOUNDS.left);expect(position.x).toBeLessThan(BOARD_GRID_BOUNDS.right);expect(position.y).toBeGreaterThan(BOARD_GRID_BOUNDS.top);expect(position.y).toBeLessThan(BOARD_GRID_BOUNDS.bottom);}});it('maps every visible square to itself without an index shift',()=>{for(let square=1;square<=100;square++){expect(indexToSquare(squareToIndex(square))).toBe(square);expect(getSquareAtBoardCell(getBoardCell(square))).toBe(square);const position=getCellCenter(square);expect(position.x).toBeGreaterThan(BOARD.left);expect(position.y).toBeGreaterThan(BOARD.top);}});it('maps every printed ladder endpoint',()=>{expect(ladders).toEqual({8:34,17:36,22:58,46:85,50:70,79:98});});});
describe('game',()=>{it('rolls, selects and walks one square per step',()=>{let s=newGame(['A','B']);s=choose(roll(s,[2,5]),0);expect(s.phase).toBe('moving');s=moveStep(s);expect(s.players[0].position).toBe(2);s=moveStep(s);expect(s.players[0].position).toBe(3);expect(s.phase).toBe('fate')});it('keeps landing square 8 aligned with ladder detection',()=>{let s=newGame(['A','B']);s.players[0].position=5;s=choose(roll(s,[3,1]),0);s=moveStep(s);s=moveStep(s);s=moveStep(s);expect(s.traversedCells).toEqual([6,7,8]);expect(s.finalRolledCell).toBe(8);expect(s.players[0].position).toBe(8);expect(s.specialTileDetected).toBe('LADDER_START');expect(s.missedLadder).toBeNull();expect(resolveLanding(s).phase).toBe('climbing')});it('wins with an exact roll to 100',()=>{let s=newGame(['A','B']);s.players[0].position=98;s=choose(roll(s,[2,1]),0);s=moveStep(s);s=moveStep(s);expect(s.phase).toBe('victory');expect(s.players[0].position).toBe(100)});it('spends Fate for reroll',()=>{let s=roll(newGame(['A','B']),[1,2]);s=reroll(s,[3,4]);expect(s.players[0].fate).toBe(2);expect(s.dice).toEqual([3,4])});it('floors Dragon penalty at square 1',()=>{let s=newGame(['A','B']);s.players[0].position=4;s=resolveLanding({...s,phase:'fate'});s=sufferDragon(s);expect(s.players[0].position).toBe(1)});it('ignores Dragon with Fate or Frexia',()=>{let s=newGame(['A','B']);s.players[0].position=4;s=resolveLanding({...s,phase:'fate'});expect(ignoreDragon(s,'fate').players[0].fate).toBe(2);s.players[0].heroes=['frexia'];expect(ignoreDragon(s,'frexia').players[0].frexiaUsed).toBe(true)});it('gains heroes and steals with Thor',()=>{let s=newGame(['A','B']);s.players[0].position=9;s=gainHero({...s,phase:'hero'});expect(s.players[0].heroes).toContain('thor');s.players[1].heroes=['loki'];s.turn=0;s=stealHero(s,1,'loki');expect(s.players[0].heroes).toContain('loki');expect(s.players[1].heroes).toEqual([])});it('applies Loki to a second player',()=>{let s=newGame(['A','B']);s.players[0].position=52;s.players[0].heroes=['loki'];s.players[1].position=50;s=resolveLanding({...s,phase:'fate'});s=sufferDragon(s,1);expect(s.players[1].position).toBe(15)});it('climbs ladders',()=>{let s=newGame(['A','B']);s.players[0].position=17;s=resolveLanding({...s,phase:'fate'});s=climb(s);expect(s.players[0].position).toBe(36)});it('round trips a save',()=>{const s=newGame(['A','B']);expect(deserialize(serialize(s))).toEqual(s)})});
describe('player counts',()=>{
 it('supports three and four travelers with cyclic turns',()=>{
  for(const count of [3,4]){
   let s=newGame(Array.from({length:count},(_,i)=>`P${i}`));
   for(let i=0;i<count;i++){
    s=roll(s,[1,2]);s=choose(s,0);s=moveStep(s);s=resolveLanding(s);
    expect(s.turn).toBe((i+1)%count);
   }
  }
 });
});
describe('dragon escape at Asgard gate',()=>{
 it('offers the dragon again when a player at 99 misses the exact one',()=>{
  let s=newGame(['A','B']);s.players[0].position=99;s.phase='dragon';s.encounter=3;s.players[0].fate=1;
  s=ignoreDragon(s,'fate');expect(s.phase).toBe('roll');expect(s.turn).toBe(0);expect(s.escapedDragonSquare).toBe(99);expect(s.players[0].fate).toBe(0);
  s=roll(s,[2,4]);s=choose(s,0);expect(s.phase).toBe('dragon');expect(s.turn).toBe(0);expect(s.encounter).toBe(3);
 });
 it('clears the pending dragon when the player rolls exactly one',()=>{
  let s=newGame(['A','B']);s.players[0].position=99;s.phase='dragon';s.encounter=3;s.players[0].fate=1;
  s=ignoreDragon(s,'fate');s=roll(s,[1,6]);s=choose(s,0);s=moveStep(s);expect(s.phase).toBe('victory');expect(s.escapedDragonSquare).toBeNull();
 });
});
describe('ladder entry',()=>{
 it('does not offer a climb after passing an entry',()=>{
  let s=newGame(['A','B']);
  s.players[0].position=7;
  s=choose(roll(s,[3,1]),0);
  s=moveStep(s);s=moveStep(s);s=moveStep(s);
  expect(s.missedLadder).toBeNull();
  expect(s.players[0].position).toBe(10);
  expect(climb(s,true)).toEqual(s);
 });
});

// Every finishing distance and die value, for every supported player count.
describe('exact finish',()=>{
 it('wins only on an exact roll; overshoots stay put and pass the turn',()=>{
  for(const count of [2,3,4]) for(let turn=0;turn<count;turn++) for(let square=94;square<=99;square++) for(let die=1;die<=6;die++) {
   let state=newGame(Array.from({length:count},(_,i)=>`P${i}`));
   state.turn=turn; state.players[turn].position=square;
   state=choose(roll(state,[die,die]),0);
   if(square+die>100){
    expect(state.players[turn].position).toBe(square); expect(state.phase).toBe('roll');
    expect(state.turn).toBe((turn+1)%count); expect(state.winner).toBeNull();
    expect(state.movementTarget).toBeNull(); expect(state.traversedCells).toEqual([]);
   }else{
    for(let step=0;step<die;step++) state=moveStep(state);
    expect(state.players[turn].position).toBe(square+die);
    expect(state.phase).toBe(square+die===100?(count===2?'victory':'roll'):'fate');
    expect(state.winner).toBe(square+die===100?turn:null);
   }
  }
 });
 it('rejects an overshooting movement target in a resumed game',()=>{
  const state=newGame(['A','B']);state.players[0].position=99;
  const next=moveStep({...state,phase:'moving',movementTarget:101});
  expect(next.players[0].position).toBe(99);expect(next.turn).toBe(1);expect(next.winner).toBeNull();
 });
});
