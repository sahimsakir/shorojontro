import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['lib/game/engine.ts','lib/game/bots.ts'],outdir:'.sites-runtime/social-tests',bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'}});
const {newGame,addBots,setBotDifficulty,react,start,view,act,respond}=await import('../.sites-runtime/social-tests/engine.mjs');
const {chooseBotMove}=await import('../.sites-runtime/social-tests/bots.mjs');
test('reactions are fixed, rate limited and leave the game phase unchanged',()=>{
 const g=newGame('ABC234','Test',false,3,'a','A');const before=g.status;react(g,'a','doubt',10000);assert.equal(g.reactions[0].reaction,'doubt');assert.throws(()=>react(g,'a','gg',11000));assert.throws(()=>react(g,'a','arbitrary text',14000));react(g,'a','gg',17000);assert.equal(g.reactions.length,1);assert.equal(g.status,before);assert.equal(view(g,'a').reactions[0].name,'A');
});
test('all levels play legally to completion and never use other hidden hands',()=>{
 for(const level of ['easy','medium','hard'])for(let n=2;n<=6;n++){
  const g=newGame('ABC234','Bots',false,6,'a','A');addBots(g,n-1);setBotDifficulty(g,level);g.players[0].ready=true;start(g);assert.throws(()=>setBotDifficulty(g,'easy'));
  let steps=0;while(g.status==='playing'&&steps++<3000){
   const id=g.waiting?g.waiting.eligible.find(id=>!g.waiting.passed.includes(id)):g.players[g.turn].id;
   const redacted=view(g,id);const move=chooseBotMove(redacted,id);assert.ok(move);
   const changed=structuredClone(g);changed.deck.reverse();const hidden=changed.players.filter(p=>p.id!==id).flatMap(p=>p.cards.filter(c=>c.alive));if(hidden.length>1)[hidden[0].role,hidden.at(-1).role]=[hidden.at(-1).role,hidden[0].role];
   assert.deepEqual(chooseBotMove(view(changed,id),id,()=>.45),chooseBotMove(redacted,id,()=>.45));
   if(move.op==='act')act(g,id,move);else respond(g,id,move);
   assert.ok(g.players.every(p=>p.coins>=0));
  }assert.equal(g.status,'finished',level+' '+n);
 }
});
