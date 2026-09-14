'use client';
import {useEffect,useRef} from 'react';
import type {Game} from '@/lib/game/engine';
import {card} from '@/lib/game/cards';
export function CharacterClip({clip}:{clip:NonNullable<Game['characterClip']>}){
 const video=useRef<HTMLVideoElement>(null);
 useEffect(()=>{const el=video.current;if(!el)return;const start=()=>{el.currentTime=Math.max(0,(Date.now()-clip.at)/1000);void el.play().catch(()=>{})};el.addEventListener('loadedmetadata',start);if(el.readyState>=1)start();return()=>{el.removeEventListener('loadedmetadata',start);el.pause()}},[clip.id,clip.at]);
 return <div className="character-clip" role="status"><video ref={video} src={'/character-clips/'+clip.role+'.mp4'} poster={'/cards/'+clip.role+'.webp'} autoPlay muted playsInline preload="auto" aria-label={card(clip.role).name+' চরিত্রের ভিডিও'}/><div><strong>{clip.actor}</strong><span>{card(clip.role).name} দাবি করেছে</span></div></div>;
}
