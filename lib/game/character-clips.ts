import type {Game} from './engine';
export const CLIP_LENGTHS:Record<string,number>={nantu:4100,brahma:3500,betal:3200};
export function clipPlaying(g:Game,now=Date.now()){return g.status==='playing'&&!!g.characterClip&&now<g.characterClip.until}
export function beginCharacterClip(g:Game,previousClaim:number,now=Date.now()){
 const w=g.waiting,duration=w?.role?CLIP_LENGTHS[w.role]:0;
 if(!duration||w?.type!=='response'||!w.claimId||w.claimId<=previousClaim)return;
 g.characterClip={id:crypto.randomUUID(),role:w.role!,actor:g.players.find(p=>p.id===w.actor)?.name??'',at:now,until:now+duration};
 w.deadline+=duration;
}
