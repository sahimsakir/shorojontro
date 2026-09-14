'use client';
import {useEffect,useRef,useState} from 'react';
import type {Game} from '@/lib/game/engine';
import {card} from '@/lib/game/cards';
export function CharacterClip({clip}:{clip:NonNullable<Game['characterClip']>}){
 const video=useRef<HTMLVideoElement>(null),sound=useRef(false);
 const [flipped,setFlipped]=useState(false);
 const [needsTap,setNeedsTap]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{
  const el=video.current;if(!el)return;let cancelled=false,canPlay=false;
  const play=async()=>{if(!canPlay)return;el.muted=!sound.current;try{await el.play();if(!cancelled)setNeedsTap(false)}catch{if(cancelled)return;el.muted=true;if(sound.current)setNeedsTap(true);void el.play().catch(()=>{})}};
  const read=()=>{try{sound.current=JSON.parse(localStorage.getItem('sj-feedback-v1')??'{}').sound===true}catch{sound.current=false}};
  const changed=(event:Event)=>{if(event instanceof CustomEvent)sound.current=event.detail?.sound===true;else read();el.muted=!sound.current;if(!sound.current)setNeedsTap(false);else void play()};
  const start=()=>{el.currentTime=Math.max(0,(Date.now()-clip.at-1100)/1000);void play()};
  read();el.muted=!sound.current;
  window.addEventListener('sj-feedback-change',changed);window.addEventListener('storage',changed);
  setFlipped(false);setReady(false);
  const timer=window.setTimeout(()=>{canPlay=true;setFlipped(true);if(el.readyState>=1)start()},1100);
  el.addEventListener('loadedmetadata',start);
  return()=>{cancelled=true;window.clearTimeout(timer);window.removeEventListener('sj-feedback-change',changed);window.removeEventListener('storage',changed);el.removeEventListener('loadedmetadata',start);el.pause()};
 },[clip.id,clip.at]);
 const enableSound=()=>{const el=video.current;if(!el||!sound.current)return;el.muted=false;void el.play().then(()=>setNeedsTap(false)).catch(()=>{el.muted=true;setNeedsTap(true)})};
 return <div className={'character-clip'+(ready?' clip-ready':'')+(flipped?' clip-flipped':'')} role="status"><section className="clip-flip-stage"><div className="clip-flip-inner"><img className="clip-back" src="/cards/back.webp" alt="ষড়যন্ত্র কার্ডের পেছন"/><video ref={video} src={'/character-clips/'+clip.role+'.mp4'} poster={'/cards/'+clip.role+'.webp'} onPlaying={()=>setReady(true)} playsInline preload="auto" aria-label={card(clip.role).name+' চরিত্রের ভিডিও'}/></div></section><div><strong>{clip.actor}</strong><span>{card(clip.role).name} দাবি করেছে</span></div>{needsTap&&<button type="button" className="clip-sound-button" onClick={enableSound}>শব্দ শুনতে চাপুন</button>}</div>;
}
