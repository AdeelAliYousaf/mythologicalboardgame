import type { GameState, Player } from '../engine/game';
export function getOpponentThreat(state: GameState, player: Player): number {
  const distance=100-player.position;
  return (100-distance)*2+player.heroes.length*8+player.fate*3+(state.finishOrder.includes(player.id)?1000:0);
}
