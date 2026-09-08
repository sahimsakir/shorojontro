import {newGame,addBots,start,act,respond,react,prepareRematch,view,tick,type Game} from './engine';
import type {Role} from './cards';
export const PRACTICE_ID='practice-you';
export function createPractice(count=2):Game {
 const g=newGame('PRACTICE','অফলাইন অনুশীলন',true,count,PRACTICE_ID,'আপনি');
 addBots(g,count-1);g.players[0].ready=true;g.series={total:1,round:0,results:[],scores:[]};start(g);return g;
}
export function practiceMove(source:Game,b:Record<string,unknown>):Game {
 const g=structuredClone(source);
 if(b.op==='act')act(g,PRACTICE_ID,{action:String(b.action),target:b.target as string,role:b.role as Role});
 else if(b.op==='respond')respond(g,PRACTICE_ID,{choice:String(b.choice),role:b.role as Role,index:b.index as number,indices:b.indices as number[]});
 else if(b.op==='react')react(g,PRACTICE_ID,String(b.reaction));
 else if(b.op==='rematch'){prepareRematch(g);g.players[0].ready=true;start(g)}
 else throw Error('অনুশীলনে এই কাজটি নেই।');
 g.revision++;return g;
}
export function practiceTick(source:Game):Game {const g=structuredClone(source);if(tick(g)){g.revision++;return g}return source}
export function practiceView(g:Game){return view(g,PRACTICE_ID)}
