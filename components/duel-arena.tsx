'use client';
import {useEffect,useState} from 'react';
import {Swords} from 'lucide-react';
import type {Game} from '@/lib/game/engine';
export function DuelArena({active,room,players,challenge,waiting}:{active:boolean;room:string;players:{id:string;name:string;left?:boolean;cards:{alive:boolean}[]}[];challenge?:Game['challenge'];waiting:boolean}){
 const [intro,setIntro]=useState(false);
 useEffect(()=>{if(!active){setIntro(false);return}const key='sj-duel:'+room;try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1')}catch{}setIntro(true);const t=setTimeout(()=>setIntro(false),2800);return()=>clearTimeout(t)},[active,room]);
 if(!active)return null;
 const finalists=players.filter(p=>!p.left&&p.cards.some(c=>c.alive));
 const name=(id:string)=>players.find(p=>p.id===id)?.name??'';
 return <><div className="duel-heading" role="status"><Swords size={16}/><strong>Duel · শেষ লড়াই</strong><span>পালা ৩০ সেকেন্ড</span></div>{intro&&<div className="duel-intro" role="status"><Swords/><strong>Duel শুরু</strong><span>{finalists[0]?.name} <b>বনাম</b> {finalists[1]?.name}</span><small>শেষ পর্যন্ত টিকে থাকুন</small></div>}{waiting&&challenge&&<div className="duel-challenge" role="status">{name(challenge.challenger)} → {name(challenge.claimant)}<strong>চ্যালেঞ্জ · {challenge.truthful?'দাবি সত্যি':'ব্লাফ ধরা পড়েছে'}</strong></div>}</>;
}
