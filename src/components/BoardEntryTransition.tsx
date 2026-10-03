'use client';
import { useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';

export type BoardPortrait = { centerX: number; centerY: number; width: number; rotation: number };
export function measureHomeBoard(image: HTMLImageElement): BoardPortrait {
 const rect=image.getBoundingClientRect(), style=getComputedStyle(image);
 const scale=Math.min(parseFloat(style.width)/1170,parseFloat(style.height)/1560);
 const matrix=new DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform);
 return {centerX:rect.left+rect.width/2,centerY:rect.top+rect.height/2,width:1170*scale,rotation:Math.atan2(matrix.b,matrix.a)*180/Math.PI};
}

export function BoardEntryTransition({ from, onComplete }: { from: BoardPortrait; onComplete: () => void }) {
 const targetRef=useRef<HTMLImageElement>(null);
 // The destination is measured after the mobile viewport class is applied.
 useLayoutEffect(()=>{
  const target=document.querySelector<HTMLImageElement>('.board-art');
  const overlay=targetRef.current;
  if(!target || !overlay){onComplete();return;}
  const rect=target.getBoundingClientRect();
  overlay.style.left=`${rect.left}px`;overlay.style.top=`${rect.top}px`;
  overlay.style.width=`${rect.width}px`;overlay.style.height=`${rect.height}px`;
  const x=from.centerX-(rect.left+rect.width/2),y=from.centerY-(rect.top+rect.height/2),scale=from.width/rect.width;
  const animation=overlay.animate([
   {transform:`translate(${x}px,${y}px) rotate(${from.rotation}deg) scale(${scale})`},
   {transform:'translate(0,0) rotate(0deg) scale(1)'},
  ],{duration:720,easing:'cubic-bezier(0.16,1,0.3,1)',fill:'both'});
  let complete=false;
  const finish=()=>{if(!complete){complete=true;onComplete();}};
  animation.onfinish=finish;
  window.addEventListener('resize',finish,{once:true});
  return()=>{complete=true;animation.cancel();window.removeEventListener('resize',finish);};
 },[from,onComplete]);
 return <motion.img ref={targetRef} className="board-entry-art" src="/assets/board.webp" alt="" aria-hidden="true" width="1170" height="1560" />;
}
