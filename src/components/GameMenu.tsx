'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { isFinished } from '@/game/engine/game';
import { placeLabel } from './RaceResults';
import type { GameState } from '@/game/engine/game';
import { HERO_IMAGE } from '@/game/rules/boardConfig';

export type MenuView = 'menu' | 'players' | 'heroes' | 'history' | 'rules' | 'sound';
export function GameIcon({ name }: { name: 'back' | 'menu' | 'dice' | 'players' | 'heroes' | 'history' | 'rules' | 'sound' | 'close' }) {
 const paths = {
  back: <path d="m14 5-7 7 7 7" />,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  dice: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 8h.01M12 12h.01M16 16h.01" strokeWidth="3" /></>,
  players: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" /></>,
  heroes: <><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m9 12 2 2 4-5" /></>,
  history: <><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></>,
  rules: <><path d="M12 5v15M3 4c4-1 6 0 9 1 3-1 5-2 9-1v15c-4-1-6 0-9 1-3-1-5-2-9-1V4Z" /></>,
  sound: <><path d="m11 4-5 4H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
 };
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
type Props = {
 game: GameState; initialView: MenuView; onClose: () => void; onRestart: () => void; onExit: () => void;
 musicVolume: number; sfxVolume: number; musicMuted: boolean; sfxMuted: boolean;
 setMusicVolume: (v: number) => void; setSfxVolume: (v: number) => void;
 setMusicMuted: (v: boolean) => void; setSfxMuted: (v: boolean) => void; onEnableAudio: () => void;
 onSteal: () => void;
};
const titles = { menu: 'The journey', players: 'Travelers', heroes: 'Hero cards', history: 'Journey record', rules: 'How to play', sound: 'Sound' };
const heroPowers = { thor: 'Take one hero card from another traveler. Thor is spent when used.', loki: 'Send another traveler back with you in a Dragon encounter. Loki is spent when used.', frexia: 'Escape one Dragon encounter without spending Fate.' };
export function GameMenu(props: Props) {
 const [view, setView] = useState<MenuView>(props.initialView);
 const panel = useRef<HTMLElement>(null);
 const close = useRef(props.onClose); close.current = props.onClose;
 useEffect(() => {
  const previous = document.activeElement as HTMLElement | null;
  panel.current?.focus();
  const keydown = (event: KeyboardEvent) => {
   if (event.key === 'Escape') close.current();
   if (event.key !== 'Tab' || !panel.current) return;
   const items = [...panel.current.querySelectorAll<HTMLElement>('button:not(:disabled), input, a[href]')];
   const first = items[0], last = items[items.length - 1];
   if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
   else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first?.focus(); }
  };
  document.addEventListener('keydown', keydown);
  return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
 }, []);
 const player = props.game.players[props.game.turn];
 return <div className="mobile-menu-backdrop" onClick={props.onClose}>
  <motion.section ref={panel} tabIndex={-1} className="mobile-menu-sheet" role="dialog" aria-modal="true" aria-labelledby="game-menu-title" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: .32, ease: [.16, 1, .3, 1] }} onClick={event => event.stopPropagation()}>
   <div className="sheet-handle" aria-hidden="true" />
   <div className="sheet-heading">
    {view !== 'menu' && <button className="icon-button" onClick={() => setView('menu')} aria-label="Back to game menu"><GameIcon name="back" /></button>}
    <h2 id="game-menu-title">{titles[view]}</h2>
    <button className="icon-button" onClick={props.onClose} aria-label="Close game menu"><GameIcon name="close" /></button>
   </div>
   {view === 'menu' && <>
    <p className="menu-summary">{player.name}’s turn · Square {player.position}</p>
    {(['players', 'heroes', 'history', 'rules', 'sound'] as const).map(item => <button className="sheet-item" key={item} onClick={() => { setView(item); if (item === 'sound') props.onEnableAudio(); }}><GameIcon name={item} /><span>{titles[item]}</span><GameIcon name="back" /></button>)}
    <div className="menu-exit-actions"><button onClick={props.onRestart}>Restart game</button><button onClick={props.onExit}>Exit to realms</button></div>
   </>}
   {view === 'players' && <div className="roster-list">{props.game.players.map(p => <div className="roster-entry" key={p.id}><span className={`traveler-seal traveler-${p.id}`}>{p.name[0].toUpperCase()}</span><div><h3>{p.name}{isFinished(props.game,p.id)?<small>{placeLabel(props.game.finishOrder.indexOf(p.id))} · Finished</small>:p.id === player.id && <small>Current turn</small>}</h3><p>Square {p.position} · {p.fate} Fate · {p.heroes.length} hero cards</p></div></div>)}</div>}
   {view === 'heroes' && <div className="hero-hand"><p>{player.name}’s hand</p>{player.heroes.length === 0 ? <p className="menu-empty">No heroes yet. Land on a hero square to claim a card.</p> : player.heroes.map((hero, index) => <article key={`${hero}-${index}`}><img src={HERO_IMAGE[hero]} alt={`${hero} card artwork`} /><div><h3>{hero}</h3><p>{heroPowers[hero]}</p>{hero === 'frexia' && player.frexiaUsed && <span>Escape already used</span>}</div></article>)}{!isFinished(props.game,player.id) && player.heroes.includes('thor') && props.game.players.some(p => p.id !== player.id && !isFinished(props.game,p.id) && p.heroes.length > 0) && <button onClick={props.onSteal}>Use Thor to take a card</button>}</div>}
   {view === 'history' && (props.game.history.length ? <ol className="menu-history">{props.game.history.map((entry, index) => <li key={index}>{entry}</li>)}</ol> : <p className="menu-empty">Your journey has just begun.</p>)}
   {view === 'rules' && <div className="menu-rules"><h3>Reach Asgard</h3><p>Roll two dice and choose one. Move that many squares along the numbered path.</p><h3>An exact finish</h3><p>You must land exactly on square 100. Finished travelers leave the turn rotation. Play continues until only one traveler remains, then results show the finish order. A die that would take you past 100 leaves you where you are and ends your turn.</p><h3>Fate &amp; encounters</h3><p>Spend 1 Fate to reroll both dice or escape a Dragon. Landing on a ladder climbs automatically to its upper end. Landing on a hero square adds that card to your hand.</p><h3>Your heroes</h3>{Object.entries(heroPowers).map(([hero, power]) => <p key={hero}><strong>{hero}: </strong>{power}</p>)}</div>}
   {view === 'sound' && <div className="sound-controls">{(['music', 'sfx'] as const).map(kind => { const music = kind === 'music'; const volume = music ? props.musicVolume : props.sfxVolume, muted = music ? props.musicMuted : props.sfxMuted; return <div className="sound-channel" key={kind}><label htmlFor={`volume-${kind}`}>{music ? 'Realm music' : 'Voices & effects'}<output>{muted ? 'Muted' : `${volume}%`}</output></label><div><input id={`volume-${kind}`} type="range" min="0" max="100" value={volume} onChange={event => (music ? props.setMusicVolume : props.setSfxVolume)(Number(event.target.value))} /><button onClick={() => (music ? props.setMusicMuted : props.setSfxMuted)(!muted)} aria-label={`${muted ? 'Unmute' : 'Mute'} ${music ? 'music' : 'sound effects'}`}>{muted ? 'Unmute' : 'Mute'}</button></div></div>; })}</div>}
  </motion.section>
 </div>;
}
