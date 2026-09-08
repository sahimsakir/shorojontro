import type {Series} from './engine';
export function seriesResult(series?:Series){
 const ranked=series?.scores.slice().sort((a,b)=>b.wins-a.wins)??[];
 const remaining=Math.max(0,(series?.total??0)-(series?.results.length??0));
 const best=ranked[0]?.wins??0;
 const clinched=best>0&&best>(ranked[1]?.wins??0)+remaining;
 const complete=!!series&&(remaining===0||clinched);
 return {complete,remaining,leaders:complete?ranked.filter(p=>p.wins===best&&best>0):[]};
}
