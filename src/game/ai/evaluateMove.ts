import { dragonDeck, dragonEncounters, getSquareEffect, heroSpaces, ladders, type Hero } from '../rules/boardConfig';
import type { GameState } from '../engine/game';
import type { MoveEvaluation } from './types';

const values = { ladder: 95, dragon: 8, hero: 18, victory: 10000, danger: 1.35, progress: 7, exactLadder: 4 };

export function evaluateMove(state: GameState, playerId: number, die: number): MoveEvaluation {
  const player=state.players[playerId], destination=player.position+die;
  if(destination>100) return {die,destination,finalDestination:player.position,progress:0,exactLadder:0,passedLadders:[],dragon:null,heroEvent:null,victory:false,danger:35,resourceCost:0,score:-120};
  const effect=getSquareEffect(destination);
  const finalDestination=effect.kind==='ladder'?effect.destination:destination;
  const passedLadders=Object.keys(ladders).map(Number).filter(square=>square>player.position&&square<destination);
  const dragon=effect.kind==='dragon'?dragonDeck[effect.cardId].penalty:null;
  const heroEvent=effect.kind==='hero'?heroSpaces[destination]:null;
  const victory=destination===100;
  const danger=dragon??0;
  const score=(victory?values.victory:0)+(finalDestination-player.position)*values.progress
    +(effect.kind==='ladder'?values.ladder+ (finalDestination-destination)*values.exactLadder:0)
    +(heroEvent?values.hero:0)-(danger*values.danger)
    -(passedLadders.length?Math.min(player.fate*2, passedLadders.length):0);
  return {die,destination,finalDestination,progress:finalDestination-player.position,exactLadder:effect.kind==='ladder'?finalDestination-destination:0,passedLadders,dragon,heroEvent,victory,danger,resourceCost:0,score};
}

export function evaluateDice(state: GameState, playerId: number, dice: [number,number]) {
  return dice.map((die,index)=>({...evaluateMove(state,playerId,die),index:index as 0|1}));
}

export function dragonPenalty(state: GameState): number {
  const player=state.players[state.turn];
  return dragonEncounters[player.position]===undefined?0:dragonDeck[dragonEncounters[player.position]].penalty;
}
