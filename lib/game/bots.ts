import type {Role} from './cards';
import type {view} from './engine';
type Table=ReturnType<typeof view>;
export function chooseBotMove(g:Table,id:string,random= Math.random):{op:'act'|'respond';action?:string;target?:string;role?:Role;choice?:string;index?:number;indices?:number[]}|null{
 const me=g.players.find(p=>p.id===id);if(!me)return null;
 const living=(p:Table['players'][number])=>!p.left&&p.cards.some(c=>c.alive);
 const own=me.cards.filter(c=>c.alive).map(c=>c.role);const has=(r:string)=>own.includes(r as Role);
 const enemies=g.players.filter(p=>p.id!==id&&living(p));
 const value=(r:Role|null)=>r==='bir'||r==='mamdo'?8:r==='brahma'?9:r==='betal'?7:r==='chor'?6:r==='kalu'?5:r==='petuk'?4:r==='nantu'?3:2;
 const w=g.waiting;
 if(w){if(!w.eligible.includes(id)||w.passed.includes(id)||!living(me))return null;
 if(w.type==='response'){const known=g.players.flatMap(p=>p.cards.filter(c=>!c.alive||p.id===id)).filter(c=>c.role===w.role).length;return {op:'respond',choice:known>=3||random()<0.055?'challenge':'pass'}}
 if(w.type==='block'){const truthful=w.roles?.find(has);const role=truthful??(random()<0.08?w.roles?.[0]:undefined);return {op:'respond',choice:role?'block':'pass',role}}
 if(w.type==='share')return {op:'respond',choice:(has('mamdo')||random()<0.13)&&!w.message.includes('ভাগ বাকি নেই')?'claim':'pass'};
 if(w.type==='loss'){const options=me.cards.map((c,index)=>({c,index})).filter(x=>x.c.alive).sort((a,b)=>value(a.c.role)-value(b.c.role));return {op:'respond',choice:'lose',index:options[0].index}}
 if(w.type==='exchange'){const used=new Set<Role>();const options=w.options!.map((role,index)=>({role,index}));const indices:number[]=[];while(indices.length<w.keep!){options.sort((a,b)=>(value(b.role)-(used.has(b.role)?3:0))-(value(a.role)-(used.has(a.role)?3:0)));const next=options.shift()!;indices.push(next.index);used.add(next.role)}return {op:'respond',choice:'keep',indices}}
 return null;
 }
 if(g.players[g.turn]?.id!==id||!enemies.length)return null;
 enemies.sort((a,b)=>a.cards.filter(c=>c.alive).length-b.cards.filter(c=>c.alive).length||b.coins-a.coins);
 const target=enemies[0].id;
 if(me.coins>=10)return {op:'act',action:'kill',target};
 for(const [r,cost] of [['brahma',3],['betal',5]] as const)if(has(r)&&me.coins>=cost)return {op:'act',action:r,target};
 if(me.coins>=7)return {op:'act',action:'kill',target};
 if(has('bir'))return {op:'act',action:'bir'};
 if(has('mamdo'))return {op:'act',action:'mamdo'};
 if(has('chor')&&enemies.filter(p=>p.coins>0).length>=2)return {op:'act',action:'chor'};
 const rich=[...enemies].sort((a,b)=>b.coins-a.coins)[0];if(has('kalu')&&rich.coins>=2)return {op:'act',action:'kalu',target:rich.id};
 if(random()<0.2){const income=g.roles.find(r=>r==='bir'||r==='mamdo')!;return {op:'act',action:income}}
 if(has('nantu')&&g.tax?.owner!==id&&random()<0.5)return {op:'act',action:'nantu',role:g.roles.find(r=>r==='bir'||r==='mamdo')!};
 if((has('petuk')||has('orun'))&&random()<0.3)return {op:'act',action:has('petuk')?'petuk':'orun'};
 return {op:'act',action:'income'};
}
