import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['lib/game/feedback.ts','lib/game/series.ts'],outdir:'.sites-runtime/feedback-tests',bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'}});
const {feedbackSnapshot,personalEvent}=await import('../.sites-runtime/feedback-tests/feedback.mjs');
const {seriesResult}=await import('../.sites-runtime/feedback-tests/series.mjs');
test('feedback ignores bystanders and identifies personal turns, challenges and theft',()=>{
 const g={code:'TEST',status:'playing',turn:1,turnCount:2,series:{round:1},waiting:null,winner:null,players:['a','b','c'].map(id=>({id,coins:2,cards:[{alive:true},{alive:true}]}))};
 const before=feedbackSnapshot(g,'a');
 g.challenge={id:1,challenger:'b',claimant:'c'};
 assert.equal(personalEvent(before,feedbackSnapshot(g,'a'),'a'),null);
 g.challenge.claimant='a';assert.equal(personalEvent(before,feedbackSnapshot(g,'a'),'a'),'challenge');
 delete g.challenge;
 for(const role of ['brahma','betal','kalu']){g.claims=[{id:2,actor:'b',target:'c',role}];assert.equal(personalEvent(before,feedbackSnapshot(g,'a'),'a'),null);g.claims[0].target='a';assert.equal(personalEvent(before,feedbackSnapshot(g,'a'),'a'),'challenge')}
 g.claims=[{id:3,actor:'b',role:'chor'}];assert.equal(personalEvent(before,feedbackSnapshot(g,'a'),'a'),'challenge');
 g.claims=[];g.turn=0;assert.equal(personalEvent(before,feedbackSnapshot(g,'a'),'a'),'turn');
 const after=feedbackSnapshot(g,'a');assert.equal(personalEvent(after,feedbackSnapshot(g,'a'),'a'),null);
 g.turn=1;g.attacks=[{id:'hit',target:'c'}];assert.equal(personalEvent(before,feedbackSnapshot(g,'a'),'a'),null);g.attacks[0].target='a';assert.equal(personalEvent(before,feedbackSnapshot(g,'a'),'a'),'challenge');
});
test('championship clinches for every supported series length and preserves ties',()=>{
 for(const total of [1,3,5,7]){const wins=Math.floor(total/2)+1;const series={total,round:wins,results:Array.from({length:wins},()=>({winner:'a'})),scores:[{id:'a',name:'A',wins},{id:'b',name:'B',wins:0}]};assert.equal(seriesResult(series).complete,true);assert.equal(seriesResult(series).leaders[0].id,'a');if(total>1){series.scores[0].wins--;series.results.pop();assert.equal(seriesResult(series).complete,false)}}
 const tie=seriesResult({total:3,round:3,results:[{},{},{}],scores:['a','b','c'].map(id=>({id,name:id,wins:1}))});assert.equal(tie.complete,true);assert.equal(tie.leaders.length,3);
});
