'use client';
import {useEffect,useState} from 'react';
import {Swords,Skull,Zap} from 'lucide-react';
import {card,type Role} from '@/lib/game/cards';
import {REACTIONS} from '@/lib/game/social';
import type {Game} from '@/lib/game/engine';

export function TableCard({role,alive}:{role:Role|null;alive:boolean}){
 return <div className={'table-card '+(!alive?'is-revealed':'')} aria-label={alive?(role?card(role).name:'গোপন কার্ড'):card(role!).name+' — নষ্ট'}><div className="table-card-inner"><img className="card-hidden-face" src="/cards/back.webp" alt=""/><img className="card-revealed-face" src={'/cards/'+(role??'back')+'.webp'} alt=""/></div>{!alive&&<span className="destroyed-label">নষ্ট</span>}</div>;
}

export function TableEffects({attacks=[],reactions=[]}:{attacks?:Game['attacks'];reactions?:Game['reactions']}){
 const [now,setNow]=useState(0);
 useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(timer)},[]);
 const attack=attacks.filter(a=>now-a.at<3000).at(-1);
 const visible=reactions.filter(r=>now-r.at<6000).slice(-3);
 return <><div className="table-reactions" aria-live="polite">{visible.map(r=>{const item=REACTIONS.find(i=>i.id===r.reaction);return item?<div key={r.id}><span>{item.emoji}</span><strong>{r.name}</strong><span>{item.text}</span></div>:null})}</div>{attack&&<div key={attack.id} className={'table-attack attack-'+attack.kind} role="status"><span className="attack-symbol">{attack.kind==='brahma'?<Skull/>:attack.kind==='betal'?<Zap/>:<Swords/>}</span><strong>{attack.actorName} → {attack.targetName}</strong><span>{attack.kind==='brahma'?'ব্রহ্মদত্তের ঘাড় মটকানো':attack.kind==='betal'?'বেতালের হত্যা':'সাধারণ হত্যা'}</span></div>}</>;
}
