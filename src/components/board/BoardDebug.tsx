'use client';

import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { COLUMN_EDGES_PX, ROW_EDGES_PX, IMAGE_WIDTH, IMAGE_HEIGHT, getCellCenter } from '@/game/rules/boardConfig';

export type RectMeasurement = { left: number; top: number; width: number; height: number };
export function measureRect(element: Element): RectMeasurement {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

export function BoardDebug({ boardRef, activePlayerId, square }: { boardRef: RefObject<HTMLDivElement | null>; activePlayerId: number; square: number }) {
  const [rects, setRects] = useState<Record<string, RectMeasurement>>({});
  const cell = getCellCenter(square);
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const update = () => {
      const targets: Record<string, Element | null> = {
        boardShell: board,
        boardImage: board.querySelector('.board-art'),
        tokenLayer: board.querySelector('.board-token-layer'),
        tokenAnchor: board.querySelector(`.token-anchor[data-player-id="${activePlayerId}"]`),
        tokenVisual: board.querySelector(`.token-anchor[data-player-id="${activePlayerId}"] .token-visual`),
      };
      const next: Record<string, RectMeasurement> = {};
      for (const [name, element] of Object.entries(targets)) if (element) next[name] = measureRect(element);
      setRects(next);
    };
    const observer = new ResizeObserver(update);
    observer.observe(board);
    update();
    // Debug-only sampling also measures visual transforms after Motion settles.
    const timer = window.setInterval(update, 250);
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, [boardRef, activePlayerId, square]);
  const image = rects.boardImage;
  const token = rects.tokenVisual;
  const screenX = image ? image.left + image.width * cell.normalizedX : null;
  const screenY = image ? image.top + image.height * cell.normalizedY : null;
  return <>
    <div className="board-debug-layer" aria-hidden="true">
      <svg className="board-debug-grid" viewBox={`0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}`} preserveAspectRatio="none">
        {COLUMN_EDGES_PX.map(x => <line key={`x-${x}`} x1={x} x2={x} y1={ROW_EDGES_PX[0]} y2={ROW_EDGES_PX[10]} />)}
        {ROW_EDGES_PX.map(y => <line key={`y-${y}`} y1={y} y2={y} x1={COLUMN_EDGES_PX[0]} x2={COLUMN_EDGES_PX[10]} />)}
        <rect className="debug-grid-boundary" x={COLUMN_EDGES_PX[0]} y={ROW_EDGES_PX[0]} width={COLUMN_EDGES_PX[10]-COLUMN_EDGES_PX[0]} height={ROW_EDGES_PX[10]-ROW_EDGES_PX[0]} />
        {Array.from({ length: 100 }, (_, index) => {
          const center = getCellCenter(index + 1);
          return <g key={center.square}>
            <path className="debug-crosshair" d={`M ${center.artworkX-6} ${center.artworkY} h 12 M ${center.artworkX} ${center.artworkY-6} v 12`} />
            <text x={center.artworkX} y={center.artworkY-10}>{center.square}</text>
          </g>;
        })}
      </svg>
      {Array.from({ length: 100 }, (_, index) => {
        const center = getCellCenter(index + 1);
        return <span key={center.square} className="cell-center" data-square={center.square} style={{ left: `${center.x}%`, top: `${center.y}%` }} />;
      })}
    </div>
    {image && typeof document !== 'undefined' && createPortal(<details className="board-debug-readout" open>
      <summary>Board geometry · square {square}</summary>
      <div>Logical row {cell.logicalRow} · visual row {cell.visualRow} · column {cell.visualColumn} (zero based)</div>
      <div>Artwork: {cell.artworkX}, {cell.artworkY}px</div>
      <div>Normalized: {cell.normalizedX.toFixed(9)}, {cell.normalizedY.toFixed(9)}</div>
      <div>Rendered local: {image ? (image.width*cell.normalizedX).toFixed(3) : '—'}, {image ? (image.height*cell.normalizedY).toFixed(3) : '—'}px</div>
      <div>Expected screen: {screenX?.toFixed(3)}, {screenY?.toFixed(3)}px</div>
      <div>Actual token center: {token ? (token.left+token.width/2).toFixed(3) : '—'}, {token ? (token.top+token.height/2).toFixed(3) : '—'}px</div>
      <div>Red boundary · cyan cells · yellow centers · white squares · magenta token center</div>
      <table><thead><tr><th>DOM rect</th><th>L</th><th>T</th><th>W</th><th>H</th></tr></thead><tbody>{Object.entries(rects).map(([name,rect]) => <tr key={name}><th>{name}</th>{Object.values(rect).map((value,index) => <td key={index}>{value.toFixed(3)}</td>)}</tr>)}</tbody></table>
    </details>, document.body)}
  </>;
}
