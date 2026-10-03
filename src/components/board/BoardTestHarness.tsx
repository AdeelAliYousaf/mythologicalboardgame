'use client';

import { useEffect, useState } from 'react';
import { Board } from './Board';
import { newGame } from '@/game/engine/game';

type TestPlacement = { square: number; count?: number; cluster?: boolean; scale?: number; camera?: { zoom: number; x: number; y: number } };

export function BoardTestHarness() {
  const [placement, setPlacement] = useState<TestPlacement>({ square: 14, count: 1, cluster: false, scale: 1, camera: { zoom: 1, x: 0, y: 0 } });
  useEffect(() => {
    const place = (event: Event) => {
      const value = (event as CustomEvent<TestPlacement>).detail;
      if (!Number.isInteger(value.square) || value.square < 1 || value.square > 100) return;
      setPlacement(previous => ({ ...previous, ...value }));
    };
    window.addEventListener('board-test-place', place);
    document.body.classList.add('game-active');
    document.documentElement.dataset.boardTestReady = '1';
    return () => { window.removeEventListener('board-test-place', place); document.body.classList.remove('game-active'); delete document.documentElement.dataset.boardTestReady; };
  }, []);
  const game = newGame(Array.from({ length: Math.max(2, placement.count ?? 1) }, (_, index) => `Test ${index + 1}`));
  const renderedGame = { ...game, players: game.players.slice(0, placement.count ?? 1).map(player => ({ ...player, position: placement.square })) };
  const camera = placement.camera ?? { zoom: 1, x: 0, y: 0 };
  return <main className="game-shell board-test-page">
    <header className="game-header"><div><h1>Board calibration</h1></div></header>
    <div className="game-layout"><aside className="hud"><h2>Test travelers</h2></aside><section className="board-section"><div className="board-test-camera" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}>
      <Board game={renderedGame} debug visualPositions={{}} visualCoordinates={{}} ladderActive={null} dragonFlying={false} clusteringEnabled={placement.cluster} instantPositioning visualScale={placement.scale} />
    </div></section><aside className="actions"><div className="board-test-controls">
      <label>Test square <input aria-label="Test square" type="number" min="1" max="100" value={placement.square} onChange={event => setPlacement(value => ({ ...value, square: Math.max(1,Math.min(100,Number(event.target.value))) }))} /></label>
      <label><input type="checkbox" checked={placement.cluster} onChange={event => setPlacement(value => ({ ...value, cluster: event.target.checked }))} />Clustering</label>
      <label>Test players <input aria-label="Test players" type="number" min="1" max="4" value={placement.count} onChange={event => setPlacement(value => ({ ...value, count: Math.max(1,Math.min(4,Number(event.target.value))) }))} /></label>
    </div></aside></div>
  </main>;
}
