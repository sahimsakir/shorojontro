import type {Game} from './engine';
export type FeedbackGame=Pick<Game,'code'|'status'|'winner'|'turn'|'turnCount'|'series'|'claims'|'attacks'|'challenge'> & {waiting:{type:string;actor:string;role?:string;eligible:string[];passed:string[];deadline:number}|null;players:{id:string;left?:boolean;coins:number;cards:{alive:boolean}[]}[]};
export function feedbackSnapshot(g:FeedbackGame,id:string){
 const me=g.players.find(p=>p.id===id),active=!!me&&!me.left&&me.cards.some(c=>c.alive)&&g.status==='playing';
 const claim=g.claims?.at(-1);
 return {room:g.code+':'+g.series?.round,turn:active&&!g.waiting&&g.players[g.turn]?.id===id?g.turnCount:0,
 duel:g.status==='playing'&&g.players.filter(p=>!p.left&&p.cards.some(c=>c.alive)).length===2,
 challenge:g.challenge?.claimant===id?g.challenge.id:undefined,
 threat:active&&claim&&claim.actor!==id&&(claim.target===id&&['brahma','betal','kalu'].includes(claim.role)||claim.role==='chor')?claim.id:undefined,
 attack:g.attacks?.filter(a=>a.target===id).at(-1)?.id,
 response:active&&g.waiting?.actor===id&&['block','loss','exchange','share'].includes(g.waiting.type)?g.waiting.deadline:0,
 coins:me?.coins??0,winner:g.winner};
}
export function personalEvent(before:ReturnType<typeof feedbackSnapshot>,after:ReturnType<typeof feedbackSnapshot>,id:string){
 if(after.challenge!==undefined&&after.challenge!==before.challenge)return 'challenge';
 if(after.attack&&after.attack!==before.attack||after.threat!==undefined&&after.threat!==before.threat)return 'challenge';
 if(after.turn&&after.turn!==before.turn||after.response&&after.response!==before.response)return 'turn';
 if(after.winner===id&&before.winner!==id)return 'win';
 return null;
}
