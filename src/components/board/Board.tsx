'use client';

import { useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { dragonDeck, getCellCenter, ladders } from '@/game/rules/boardConfig';
import type { GameState } from '@/game/engine/game';
import { BoardDebug } from './BoardDebug';
import { getTokenClusterOffsets } from './tokenLayout';

const colors = ['#d89943', '#b64c2e', '#e5d49c', '#8b9a68'];

export type BoardProps = {
  game: GameState;
  debug: boolean;
  visualPositions: Record<number, number>;
  visualCoordinates: Record<number, { x: number; y: number }>;
  ladderActive: number | null;
  dragonFlying: boolean;
  clusteringEnabled?: boolean;
  instantPositioning?: boolean;
  visualScale?: number;
};

export function Board({ game, debug, visualPositions, visualCoordinates, ladderActive, dragonFlying, clusteringEnabled = !debug, instantPositioning = false, visualScale = 1 }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const activePlayer = game.players[game.turn];
  const activeSquare = visualPositions[activePlayer.id] ?? activePlayer.position;
  const dragonOrigin = getCellCenter(activeSquare);
  return <div ref={boardRef} className={`board ${instantPositioning ? 'board-instant' : ''} ${dragonFlying ? 'board-shake' : ''} ${game.phase === 'victory' ? 'board-victory' : ''}`} aria-label="Dragon Ladder board, squares 1 through 100">
    <img className="board-art" src="/assets/board.webp" alt="Original Dragon Ladder board artwork" width="1170" height="1560" />
    <div className="board-atmosphere-layer" aria-hidden="true"><div className="asgard-glow" /><div className="helheim-glow" />
      {ladderActive !== null && <svg className="ladder-glow" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line className="ladder-glow-aura" x1={getCellCenter(ladderActive).x} y1={getCellCenter(ladderActive).y} x2={getCellCenter(ladders[ladderActive]).x} y2={getCellCenter(ladders[ladderActive]).y} />
        <line className="ladder-glow-body" x1={getCellCenter(ladderActive).x} y1={getCellCenter(ladderActive).y} x2={getCellCenter(ladders[ladderActive]).x} y2={getCellCenter(ladders[ladderActive]).y} />
        <line className="ladder-glow-shimmer" x1={getCellCenter(ladderActive).x} y1={getCellCenter(ladderActive).y} x2={getCellCenter(ladders[ladderActive]).x} y2={getCellCenter(ladders[ladderActive]).y} />
      </svg>}
    </div>
    <div className="board-token-layer">
      {game.players.map(player => {
        const square = visualPositions[player.id] ?? player.position;
        const center = visualCoordinates[player.id] ?? getCellCenter(square);
        const sharing = game.players.filter(other => (visualPositions[other.id] ?? other.position) === square);
        const index = sharing.findIndex(other => other.id === player.id);
        const offset = clusteringEnabled ? getTokenClusterOffsets(sharing.length)[index] : { x: 0, y: 0 };
        return <div key={player.id} className="token-anchor" data-player-id={player.id} data-square={square} style={{ left: `${center.x}%`, top: `${center.y}%` }}>
          <div className="token-cluster" style={{ '--cluster-x': offset.x, '--cluster-y': offset.y } as CSSProperties}>
            <motion.div className={`token token-visual ${game.turn === player.id ? 'token-active' : ''} ${game.phase === 'climbing' && game.turn === player.id ? 'token-climbing' : ''}`} style={{ '--token-color': colors[player.id] } as CSSProperties} animate={{ scale: visualScale }} transition={{ duration: instantPositioning ? 0 : .24, ease: [.22, 1, .36, 1] }} title={`${player.name}, square ${square}`} aria-label={`${player.name} on square ${square}`}>
              {player.name.slice(0, 1).toUpperCase()}
              {debug && <span className="token-center-dot" aria-hidden="true" />}
            </motion.div>
          </div>
        </div>;
      })}
    </div>
    <div className="board-effect-layer">
      {dragonFlying && <div className="embers" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${(i*37)%100}%`, animationDelay: `${i*.07}s` }} />)}</div>}
      <AnimatePresence>{dragonFlying && <motion.img className="penalty-reveal" src={`/assets/derived/penalty-${dragonDeck[game.encounter ?? 0].penalty}.webp`} alt={`Move back ${dragonDeck[game.encounter ?? 0].penalty} squares`} initial={{ opacity: 0, scale: .65, rotateY: -80 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} exit={{ opacity: 0, scale: 1.15 }} transition={{ delay: .85, duration: .45 }} />}</AnimatePresence>
      <AnimatePresence>{dragonFlying && <motion.img className="flying-dragon" src={`/assets/derived/dragon-flight-${game.encounter ?? 0}.png`} alt="" style={{ left: `${dragonOrigin.x}%`, top: `${dragonOrigin.y}%` }} initial={{ scale: .25, opacity: 0, rotate: -18, x: '-20%' }} animate={{ scale: [.3,1.5,2.1], opacity: [0,1,1], rotate: [-18,8,-10], x: ['-20%','-65%','75%'], y: ['0%','-120%','-180%'] }} exit={{ opacity: 0, scale: 2.4 }} transition={{ duration: 1.5, ease: 'easeInOut' }} />}</AnimatePresence>
    </div>
    {debug && <BoardDebug boardRef={boardRef} activePlayerId={activePlayer.id} square={activeSquare} />}
  </div>;
}
