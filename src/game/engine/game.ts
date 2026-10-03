import { dragonDeck, dragonEncounters, getSquareEffect, getBoardCell, getSquareAtBoardCell, heroSpaces, ladders, type Hero } from '../rules/boardConfig';
export type Phase = 'roll' | 'choose' | 'moving' | 'fate' | 'climbing' | 'dragon' | 'hero' | 'victory';
export type Player = { id: number; name: string; position: number; fate: number; heroes: Hero[]; frexiaUsed: boolean };
export type SpecialTile = 'LADDER_START' | 'DRAGON' | 'HERO' | null;
export type GameState = { players: Player[]; turn: number; phase: Phase; dice: [number, number] | null; chosen: number | null; movementTarget: number | null; movementStart: number | null; traversedCells: number[]; finalRolledCell: number | null; specialTileDetected: SpecialTile; dragonIndex: number; encounter: number | null; missedLadder: number | null; escapedDragonSquare: number | null; history: string[]; winner: number | null; finishOrder: number[] };
export function newGame(names: string[]): GameState { if (names.length < 2 || names.length > 4) throw Error('Two to four players required'); return { players: names.map((name,id) => ({ id, name: name.trim() || `Player ${id + 1}`, position: 1, fate: 3, heroes: [], frexiaUsed: false })), turn: 0, phase: 'roll', dice: null, chosen: null, movementTarget:null, movementStart:null, traversedCells: [], finalRolledCell: null, specialTileDetected: null, dragonIndex: 0, encounter: null, missedLadder: null, escapedDragonSquare: null, history: [], winner: null, finishOrder: [] }; }
const log = (s: GameState, message: string): GameState => ({ ...s, history: [message, ...s.history].slice(0, 30) });
const replacePlayer = (s: GameState, id: number, change: Partial<Player>): GameState => ({...s, players: s.players.map(p => p.id === id ? {...p,...change} : p)});
export function roll(s: GameState, dice: [number, number]): GameState { if (s.phase !== 'roll' || isFinished(s,s.players[s.turn].id) || dice.some(d => d < 1 || d > 6 || !Number.isInteger(d))) return s; return log({...s, dice, phase: 'choose'}, `${s.players[s.turn].name} rolled ${dice[0]} and ${dice[1]}.`); }
export function reroll(s: GameState, dice: [number, number]): GameState { if (s.phase !== 'choose' || s.players[s.turn].fate < 1) return s; const p=s.players[s.turn]; return log(roll({...replacePlayer(s,p.id,{fate:p.fate-1}), phase:'roll'},dice),`${p.name} spent Fate to reroll.`); }
export function choose(s: GameState, index: number): GameState {
 if (s.phase !== 'choose' || isFinished(s,s.players[s.turn].id) || !s.dice || (index !== 0 && index !== 1)) return s;
 const player = s.players[s.turn], chosen = s.dice[index], destination = player.position + chosen;
 if (s.escapedDragonSquare === player.position && chosen !== 1) {
  const effect = getSquareEffect(player.position);
  return log({...s,phase:'dragon',dice:null,chosen:null,movementTarget:null,movementStart:null,specialTileDetected:'DRAGON',encounter:effect.kind==='dragon'?effect.cardId:null}, `${player.name} must face the Dragon again.`);
 }
 if (destination > 100) return advanceTurn(log(s, `${player.name} chose ${chosen}, but needs exactly ${100-player.position} to reach Asgard. Stays on square ${player.position}.`));
 return log({...s,escapedDragonSquare:null,chosen,movementStart:player.position,movementTarget:destination,traversedCells:[],finalRolledCell:null,specialTileDetected:null,phase:'moving'}, `${player.name} chose ${chosen}.`);
}
export function moveStep(s: GameState): GameState {
 if (s.phase !== 'moving' || s.movementTarget === null) return s;
 const p=s.players[s.turn],destination=s.movementTarget;
 if (destination > 100) return advanceTurn(log(s, `${p.name} needs an exact roll to reach Asgard. Stays on square ${p.position}.`));
 const nextSquare=Math.min(destination,p.position+1);
 if (p.position >= destination) return {...s,phase:'fate'};
 const traversedCells=[...s.traversedCells,nextSquare];
 const next=replacePlayer({...s,traversedCells},p.id,{position:nextSquare});
 if(nextSquare!==destination)return next;
 const effect=getSquareEffect(destination);
 const specialTileDetected: SpecialTile = effect.kind==='ladder'?'LADDER_START':effect.kind==='dragon'?'DRAGON':effect.kind==='hero'?'HERO':null;
 if (process.env.NODE_ENV !== 'test') console.table({logicalPosition: nextSquare, visualSquare: nextSquare, finalRolledCell: destination, renderedCell: getSquareAtBoardCell(getBoardCell(nextSquare)), specialTileDetected});
 const landed={...next,finalRolledCell:destination,specialTileDetected,phase:'fate' as const,missedLadder:null};
 return destination===100?recordFinish(landed):landed;
}
export function isFinished(s: GameState, playerId: number) { return s.finishOrder.includes(playerId); }
function recordFinish(s: GameState): GameState {
 const player=s.players[s.turn];
 if(isFinished(s,player.id)) return advanceTurn(s);
 const finishOrder=[...s.finishOrder,player.id];
 const ranked=log({...s,finishOrder,winner:finishOrder[0]},`${player.name} reached Asgard in place ${finishOrder.length}.`);
 if(s.players.length-finishOrder.length<=1) return {...ranked,phase:'victory',dice:null,chosen:null,movementTarget:null,movementStart:null};
 return advanceTurn(ranked);
}
export function advanceTurn(s: GameState): GameState {
 if(s.phase==='victory') return s;
 let turn=s.turn;
 for(let step=1;step<=s.players.length;step++){
  const index=(s.turn+step)%s.players.length;
  if(!isFinished(s,s.players[index].id)){turn=index;break;}
 }
 return {...s,turn,phase:'roll',dice:null,chosen:null,movementTarget:null,movementStart:null,traversedCells:[],finalRolledCell:null,specialTileDetected:null,encounter:null,missedLadder:null};
}
export function resolveLanding(s: GameState): GameState {
 if(s.phase !== 'fate') return s;
 const player=s.players[s.turn], effect=getSquareEffect(player.position);
 if(effect.kind==='finish') return recordFinish(s);
 if(effect.kind==='ladder') return {...s,phase:'climbing',specialTileDetected:'LADDER_START',missedLadder:null};
 if(effect.kind==='dragon') return {...s,phase:'dragon',specialTileDetected:'DRAGON',encounter:effect.cardId,missedLadder:null};
 if(effect.kind==='hero') return {...s,phase:'hero',specialTileDetected:'HERO',missedLadder:null};
 return advanceTurn(log(s,`${player.name} reached square ${player.position}.`));
}
export function climb(s: GameState, spend=false): GameState {
 // Kept as a guarded engine transition; the UI initiates it automatically.
 if((s.phase!=='climbing' && s.phase!=='fate') || spend) return s;
 const player=s.players[s.turn], destination=ladders[player.position];
 if(destination===undefined) return s;
 return log({...replacePlayer(s,player.id,{position:destination}),phase:'fate',missedLadder:null},`${player.name} climbed from ${player.position} to ${destination}.`);
}
export function ignoreDragon(s: GameState, using: 'fate'|'frexia'): GameState { if(s.phase!=='dragon') return s; const p=s.players[s.turn]; if(using==='fate' && p.fate<1 || using==='frexia' && (!p.heroes.includes('frexia') || p.frexiaUsed)) return s; const next=replacePlayer(s,p.id,using==='fate'?{fate:p.fate-1}:{frexiaUsed:true}); if(using==='fate' && p.position===99) return log({...next,phase:'roll',dice:null,chosen:null,encounter:null,escapedDragonSquare:99},`${p.name} used Fate to avoid the Dragon at square 99.`); return advanceTurn(log(next,`${p.name} avoided the Dragon.`)); }
export function sufferDragon(s: GameState, lokiTarget?: number): GameState { if(s.phase!=='dragon' || s.encounter===null || (lokiTarget!==undefined && isFinished(s,lokiTarget))) return s; const p=s.players[s.turn], card=dragonDeck[s.encounter]; let next=replacePlayer(s,p.id,{position:Math.max(1,p.position-card.penalty)}); if(lokiTarget!==undefined && p.heroes.includes('loki') && lokiTarget!==p.id && s.players[lokiTarget]) { const target=s.players[lokiTarget]; next=replacePlayer(next,target.id,{position:Math.max(1,target.position-card.penalty)}); next=replacePlayer(next,p.id,{heroes:p.heroes.filter((h,i)=>h!=='loki'||i!==p.heroes.indexOf('loki'))}); } return log({...next,phase:'fate',dragonIndex:s.dragonIndex+1},`${p.name} met ${card.name} and fell ${card.penalty} squares.`); }
export function gainHero(s: GameState): GameState { if(s.phase!=='hero') return s; const p=s.players[s.turn], hero=heroSpaces[p.position]; if(!hero) return s; return advanceTurn(log(replacePlayer(s,p.id,{heroes:[...p.heroes,hero]}),`${p.name} obtained ${hero}.`)); }
export function stealHero(s: GameState, targetId: number, hero: Hero): GameState { const p=s.players[s.turn], target=s.players[targetId]; if(s.phase==='victory' || !p || isFinished(s,p.id) || isFinished(s,targetId) || !p.heroes.includes('thor') || !target || target.id===p.id || !target.heroes.includes(hero)) return s; let next=replacePlayer(s,p.id,{heroes:[...p.heroes.filter((h,i)=>h!=='thor'||i!==p.heroes.indexOf('thor')),hero]}); next=replacePlayer(next,targetId,{heroes:target.heroes.filter((h,i)=>h!==hero||i!==target.heroes.indexOf(hero))}); return log(next,`${p.name} used Thor to take ${hero} from ${target.name}.`); }
export function serialize(s: GameState) { return JSON.stringify(s); }
export function deserialize(raw: string): GameState | null {
 try {
  const parsed: unknown=JSON.parse(raw);
  if(!parsed || typeof parsed!=='object' || !('players' in parsed) || !Array.isArray(parsed.players) || parsed.players.length<2 || parsed.players.length>4) return null;
  const saved=parsed as Partial<GameState>, players=saved.players!;
  const supplied=Array.isArray(saved.finishOrder)?saved.finishOrder:[];
  const finishOrder=[...new Set(supplied.filter(id=>players.some(player=>player.id===id && player.position===100)))];
  // Preserve legacy winner first; older saves only recorded the first finisher.
  if(finishOrder.length===0 && saved.winner!==null && saved.winner!==undefined && players.some(p=>p.id===saved.winner && p.position===100)) finishOrder.push(saved.winner);
  for(const player of players) if(player.position===100 && !finishOrder.includes(player.id)) finishOrder.push(player.id);
  let state={...saved,players,finishOrder,winner:finishOrder[0]??null,escapedDragonSquare:saved.escapedDragonSquare===99?99:null,traversedCells:saved.traversedCells??[],finalRolledCell:saved.finalRolledCell??null,specialTileDetected:saved.specialTileDetected??null,encounter:saved.phase==='dragon' && dragonEncounters[players[saved.turn??0]?.position]!==undefined?dragonEncounters[players[saved.turn??0].position]:saved.encounter??null} as GameState;
  if(players.length-finishOrder.length<=1) state={...state,phase:'victory'};
  else if(state.phase==='victory' || isFinished(state,players[state.turn].id)) state=advanceTurn({...state,phase:'roll'});
  return state;
 } catch { return null; }
}
