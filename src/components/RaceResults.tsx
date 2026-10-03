import type { GameState } from '@/game/engine/game';

export const placeLabel = (index: number) => ['Winner', '2nd', '3rd'][index] ?? `${index+1}th`;

export function RaceResults({ game, onPlayAgain }: { game: GameState; onPlayAgain: () => void }) {
 return <section className="victory race-results" aria-labelledby="results-title">
  <h2 id="results-title">Journey results</h2>
  <ol className="finish-standings">{game.finishOrder.slice(0,game.players.length-1).map((id,index)=>{
   const player=game.players.find(p=>p.id===id)!;
   return <li key={id}><span className="finish-place">{placeLabel(index)}</span><span className={`traveler-seal traveler-${id}`}>{player.name[0].toUpperCase()}</span><strong>{player.name}</strong></li>;
  })}</ol>
  <button onClick={onPlayAgain}>Play again</button>
 </section>;
}
