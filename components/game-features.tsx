'use client';
import {useEffect,useRef,useState} from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {bn,card,type Role} from '@/lib/game/cards';
import type {ClaimRecord,Game,Series} from '@/lib/game/engine';
import {seriesResult} from '@/lib/game/series';
import {LESSONS,tutorialGame,tutorialMove} from '@/lib/game/tutorial';

export function ClaimHistory({claims,players,selected,onSelect}:{claims:ClaimRecord[];players:{id:string;name:string}[];selected:string;onSelect:(v:string)=>void}){
 const rows=claims.filter(c=>!selected||c.actor===selected||c.challenger===selected).slice().reverse();
 return <section className="claim-history"><label>খেলোয়াড় অনুযায়ী দেখুন<select value={selected} onChange={e=>onSelect(e.target.value)}><option value="">সব খেলোয়াড়</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><p className="small-note">বর্তমান রাউন্ডের সর্বশেষ ৩০০ দাবি। মেনে নেওয়া দাবি সত্যি প্রমাণিত নয়; প্রমাণের পর কার্ড বদলাতেও পারে।</p>{rows.length?rows.map(c=><article key={c.id} className={'claim-entry '+c.outcome}><img src={'/cards/'+c.role+'.webp'} alt={card(c.role).name}/><div><small>রাউন্ড {bn(c.round)} · পালা {bn(c.turn)}</small><strong>{c.name} → {card(c.role).name}</strong><p>{c.kind==='block'?'ব্লকের দাবি':c.kind==='share'?'ভাগ পাওয়ার দাবি':'ক্ষমতার দাবি'}{c.targetName?' · লক্ষ্য: '+c.targetName:''}</p>{c.challengerName&&<p>{c.challengerName} → {c.name}: চ্যালেঞ্জ</p>}<b>{({withdrawn:'দাবিকারী রুম ছেড়েছে · দাবি বাতিল',pending:'জবাবের অপেক্ষা',accepted:'চ্যালেঞ্জ ছাড়াই গৃহীত',proven:'সত্যি প্রমাণিত · চ্যালেঞ্জকারী হেরেছে',bluff:'ব্লাফ ধরা পড়েছে · দাবিকারী হেরেছে'})[c.outcome]}</b></div></article>):<p>এখনো কোনো দাবি নেই।</p>}</section>;
}

export function SeriesScore({series}:{series?:Series}){
 if(!series)return <p>পরের রাউন্ড থেকে আসরের স্কোর শুরু হবে।</p>;
 const ranked=series.scores.slice().sort((a,b)=>b.wins-a.wins);
 const completed=seriesResult(series).complete;
 const best=ranked[0]?.wins??0;
 const leaders=ranked.filter(p=>p.wins===best&&best>0).map(p=>p.name);
 return <section className="series-score"><h3>{completed?'আসর শেষ':`আসর · ${bn(series.total)} রাউন্ড`}</h3><p>প্রতি জয়ে ১ পয়েন্ট। বাকি রাউন্ডে আর কেউ ধরতে না পারলে আগেই আসর জয়। সমান সর্বোচ্চ স্কোর হলে যৌথ চ্যাম্পিয়ন।</p>{completed&&<p className="series-champion">{leaders.length?(leaders.length>1?'যৌথ চ্যাম্পিয়ন: ':'আসরের চ্যাম্পিয়ন: ')+leaders.join(', '):'এই আসরে কোনো বিজয়ী নেই।'}</p>}<table><thead><tr><th>খেলোয়াড়</th><th>জয় / পয়েন্ট</th></tr></thead><tbody>{ranked.map(p=><tr key={p.id}><td>{p.name}</td><td>{bn(p.wins)}</td></tr>)}</tbody></table>{!ranked.length&&<p>প্রথম রাউন্ড শুরু হলে স্কোরবোর্ড তৈরি হবে।</p>}<div className="round-results">{series.results.map(r=><p key={r.round}>রাউন্ড {bn(r.round)} <strong>{r.name}{r.winner?' জয়ী':''}</strong></p>)}</div></section>;
}

export function ChallengeAnimation({challenge,room,players,waiting,reveals=[]}:{challenge?:Game['challenge'];room:string;players:{id:string;name:string}[];waiting:{type:string;actor:string}|null;reveals?:NonNullable<Game['reveals']>}){
 const seen=useRef(new Set<string>()),queue=useRef<NonNullable<Game['reveals']>>([]);
 const [shown,setShown]=useState<NonNullable<Game['reveals']>[number]|null>(null);
 const [pulse,setPulse]=useState(0);
 useEffect(()=>{seen.current.clear();queue.current=[];setShown(null)},[room]);
 useEffect(()=>{for(const r of reveals){if(!seen.current.has(r.id)){seen.current.add(r.id);if(Date.now()-r.at<12000)queue.current.push(r)}}if(!shown&&queue.current.length)setShown(queue.current.shift()!);},[reveals,shown,pulse]);
 useEffect(()=>{if(!shown)return;const t=setTimeout(()=>{setShown(null);setPulse(v=>v+1)},2800);return()=>clearTimeout(t)},[shown?.id]);
 const awaiting=waiting?.type==='loss';
 if(!shown&&(!challenge||!awaiting))return null;
 const name=(id:string)=>players.find(p=>p.id===id)?.name??'খেলোয়াড়';
 const role=shown?.role??(challenge?.truthful?challenge.role:'back');
 return <aside className={'challenge-reveal '+(shown?'selected-reveal':challenge?.truthful?'truth':'bluff')} role="status" aria-live="polite"><div className="proof-flip" key={shown?.id??'proof-'+challenge?.id}><img src={'/cards/'+role+'.webp'} alt={role==='back'?'গোপন কার্ড':card(role!).name}/></div><div>{shown?<><strong>{shown.name} এই কার্ডটি প্রকাশ করেছে</strong><b>{card(shown.role).name} · জীবন হারিয়েছে</b><small>নষ্ট কার্ড ডেকে ফেরত যায় না।</small></>:<><strong>{name(challenge!.challenger)} → {name(challenge!.claimant)}</strong><p>{card(challenge!.role).name} দাবিতে চ্যালেঞ্জ</p><b>{challenge!.truthful?'দাবি সত্যি!':'ব্লাফ ধরা পড়েছে!'}</b><small>{name(waiting!.actor)} কার্ড বেছে নিচ্ছে…</small></>}</div></aside>;
}

export function Tutorial({open,onClose}:{open:boolean;onClose:()=>void}){
 const [lesson,setLesson]=useState(0),[game,setGame]=useState<Game|null>(null),[done,setDone]=useState(false),[kept,setKept]=useState<number[]>([]),[error,setError]=useState('');
 useEffect(()=>{if(open){setLesson(0);setGame(tutorialGame(0));setDone(false);setKept([]);setError('')}},[open]);
 const choose=(choice:string)=>{if(!game||done)return;try{const r=tutorialMove(game,lesson,choice,kept);setGame(r.game);setDone(r.done);setError('')}catch(e){setError((e as Error).message)}};
 const next=()=>{const n=lesson+1;setLesson(n);setGame(tutorialGame(n));setDone(false);setKept([]);setError('')};
 const step=LESSONS[lesson];
 return <Dialog open={open} onOpenChange={v=>!v&&onClose()}><DialogContent className="game-dialog tutorial-dialog"><DialogHeader><DialogTitle>হাতে-কলমে শিখুন · {bn(lesson+1)}/{bn(LESSONS.length)}</DialogTitle><DialogDescription>সাজানো অনুশীলন; রুম বা আসরের স্কোরে যোগ হবে না। এখানে সময়সীমা নেই।</DialogDescription></DialogHeader><progress value={lesson+(done?1:0)} max={LESSONS.length} aria-label="অনুশীলনের অগ্রগতি"/><h3>{step.title}</h3><p>{step.text}</p>{game&&<><div className="tutorial-table">{game.players.map(p=><section key={p.id}><strong>{p.name} · {bn(p.coins)} কয়েন</strong><div className="tutorial-hand">{p.cards.map((c,i)=><img key={i} className={c.alive?'':'lost'} src={'/cards/'+(p.id==='you'||!c.alive?c.role:'back')+'.webp'} alt={p.id==='you'||!c.alive?card(c.role).name:'গোপন কার্ড'}/>)}</div><small>{bn(p.cards.filter(c=>c.alive).length)} জীবন</small></section>)}</div><div className="tutorial-feedback" aria-live="polite">{done?step.done:game.waiting?.message??'নিচের চালটি দিন।'}</div>{!done&&<div className="tutorial-actions">{lesson===0&&<button className="primary" onClick={()=>choose('income')}>সাধারণ আয় · +১ কয়েন</button>}{lesson===1&&<button className="primary" onClick={()=>choose('bir')}>বীরবিক্রম দাবি · +৩ কয়েন</button>}{lesson===2&&<button className="danger" onClick={()=>choose('challenge')}>সঙ্গীকে চ্যালেঞ্জ করুন</button>}{lesson===3&&(game.waiting?.type==='block'?<button className="primary" onClick={()=>choose('block')}>কালু ডাকাত দাবি করে ব্লক</button>:<button className="secondary" onClick={()=>choose('pass')}>ডাকাতির দাবি মানুন</button>)}{lesson===4&&<button className="primary" onClick={()=>choose('nantu')}>নান্টুমিয়া দাবি · বীরবিক্রমে খাজনা</button>}{lesson===5&&(game.waiting?.type==='exchange'?<><p>রাখুন: {bn(kept.length)} / ২ কার্ড</p><div className="tutorial-picks">{game.waiting.options?.map((r,i)=><button key={i} aria-pressed={kept.includes(i)} className={kept.includes(i)?'picked':''} onClick={()=>setKept(old=>old.includes(i)?old.filter(j=>j!==i):old.length<2?[...old,i]:old)}><img src={'/cards/'+r+'.webp'} alt={card(r).name}/><span>{kept.includes(i)?'✓ রাখব':card(r).name}</span></button>)}</div><button className="primary" disabled={kept.length!==2} onClick={()=>choose('keep')}>এই ২টি রাখুন</button></>:<button className="primary" onClick={()=>choose('orun')}>ঊরুণ দাবি · কার্ড সংগ্রহ</button>)}</div>}<details><summary>এই ধাপের ঘটনাপঞ্জি</summary>{game.log.map(e=><p key={e.id}>{e.text}</p>)}</details></>}{error&&<p role="alert">{error}</p>}{done&&(lesson<LESSONS.length-1?<button className="primary full" onClick={next}>পরের ধাপ →</button>:<button className="primary full" onClick={onClose}>শেখা শেষ · খেলায় ফিরুন</button>)}</DialogContent></Dialog>;
}
