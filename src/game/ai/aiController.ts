import { dragonDeck, dragonEncounters, type Hero } from '../rules/boardConfig';
import { choose, gainHero, ignoreDragon, reroll, roll, sufferDragon, stealHero, type GameState, type Player } from '../engine/game';
import { evaluateDice, evaluateMove } from './evaluateMove';
import { getOpponentThreat } from './opponentThreat';
import type { AIAction, MoveEvaluation } from './types';

export function isAI(player: Player) { return player.controller==='ai'; }
export function chooseDie(state: GameState, dice: [number,number]): 0|1 {
  const evaluations=evaluateDice(state,state.turn,dice);
  if(evaluations[1].score>evaluations[0].score)return 1;
  return 0;
}
export function shouldReroll(state: GameState, dice: [number,number]): boolean {
  const player=state.players[state.turn]; if(player.fate<1||player.difficulty==='easy')return false;
  const choices=evaluateDice(state,state.turn,dice), best=Math.max(...choices.map(c=>c.score));
  return best<35 && (player.difficulty==='hard'||best<0);
}
export function shouldSpendFateForLadder(state: GameState, evaluation: MoveEvaluation): boolean {
  const player=state.players[state.turn]; return player.fate>0 && evaluation.passedLadders.length>0 &&
    (evaluation.finalDestination-player.position>=20 || evaluation.score>150 || player.position>=90);
}
export function shouldIgnoreDragon(state: GameState): 'fate'|'frexia'|null {
  const player=state.players[state.turn], penalty=dragonEncounters[player.position]===undefined?0:dragonDeck[dragonEncounters[player.position]].penalty;
  if(!penalty)return null;
  const severe=penalty>=20 || player.position>=85;
  if(player.heroes.includes('frexia')&&!player.frexiaUsed&&severe)return 'frexia';
  if(player.fate>0&&severe)return 'fate';
  return null;
}
export function chooseLokiTarget(state: GameState): number|undefined {
  const eligible=state.players.filter(p=>p.id!==state.turn&&!state.finishOrder.includes(p.id));
  return eligible.sort((a,b)=>getOpponentThreat(state,b)-getOpponentThreat(state,a))[0]?.id;
}
export function chooseThorTarget(state: GameState): {targetId:number;hero:Hero}|undefined {
  const player=state.players[state.turn];
  const candidates=state.players.filter(p=>p.id!==player.id&&!state.finishOrder.includes(p.id)&&p.heroes.length);
  const target=candidates.sort((a,b)=>getOpponentThreat(state,b)-getOpponentThreat(state,a))[0];
  if(!target)return undefined;
  return {targetId:target.id,hero:[...target.heroes].sort((a,b)=>({loki:3,frexia:2,thor:1}[b]-({loki:3,frexia:2,thor:1}[a])))[0]};
}
export function nextAIAction(state: GameState, _diceRoll: [number,number]): AIAction|null {
  const player=state.players[state.turn]; if(!isAI(player)||state.phase==='moving'||state.phase==='fate')return null;
  const thor=player.heroes.includes('thor')&&state.phase==='roll'?chooseThorTarget(state):undefined;
  if(thor)return {type:'thor',...thor};
  if(state.phase==='roll')return {type:'roll'};
  if(state.phase==='choose'&&state.dice){
    if(shouldReroll(state,state.dice))return {type:'reroll'};
    return {type:'choose',index:chooseDie(state,state.dice)};
  }
  if(state.phase==='climbing')return null;
  if(state.phase==='dragon'){
    const escape=shouldIgnoreDragon(state); if(escape)return {type:escape==='fate'?'dragon-fate':'dragon-frexia'};
    const target=player.heroes.includes('loki')?chooseLokiTarget(state):undefined;
    return {type:'dragon-face',targetId:target};
  }
  if(state.phase==='hero')return {type:'claim-hero'};
  return null;
}

export function dispatchAIAction(state: GameState, action: AIAction, dice: [number,number]): GameState {
  const player=state.players[state.turn];
  if(!isAI(player))return state;
  switch(action.type){
    case 'roll': return roll(state,dice);
    case 'reroll': return reroll(state,dice);
    case 'choose': return choose(state,action.index);
    case 'ladder-fate': return choose(state,0); // ladder climbing is automatic; this action is only a phase marker.
    case 'dragon-fate': return ignoreDragon(state,'fate');
    case 'dragon-frexia': return ignoreDragon(state,'frexia');
    case 'dragon-face': return sufferDragon(state,action.targetId);
    case 'claim-hero': return gainHero(state);
    case 'thor': return stealHero(state,action.targetId,action.hero);
  }
}
