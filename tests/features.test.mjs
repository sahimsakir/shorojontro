import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['lib/game/tutorial.ts','lib/game/engine.ts'],outdir:'.sites-runtime/features-tests',bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'}});
const {tutorialGame,tutorialMove}=await import('../.sites-runtime/features-tests/tutorial.mjs');
const {newGame,start,configureSeries,prepareRematch,act,respond,tick,view}=await import('../.sites-runtime/features-tests/engine.mjs');
test('six interactive lessons resolve actual game effects and preserve fifteen cards',()=>{
 const steps=[['income'],['bir'],['challenge'],['pass','block'],['nantu'],['orun','keep']];
 for(let lesson=0;lesson<steps.length;lesson++){
  let g=tutorialGame(lesson),result;
  for(const choice of steps[lesson]){result=tutorialMove(g,lesson,choice,[0,2]);g=result.game;}
  assert.equal(result.done,true);assert.equal(g.deck.length+g.players.flatMap(p=>p.cards).length,15);
  if(lesson===0)assert.equal(g.players[0].coins,3);
  if(lesson===1){assert.equal(g.players[0].coins,5);assert.equal(g.players[1].cards.filter(c=>c.alive).length,1)}
  if(lesson===2){assert.equal(g.players[0].cards.filter(c=>c.alive).length,2);assert.equal(g.claims[0].outcome,'bluff')}
  if(lesson===3)assert.equal(g.players[0].coins,2);
  if(lesson===4){assert.equal(g.players[0].coins,3);assert.equal(g.players[1].coins,4)}
  if(lesson===5)assert.equal(g.waiting,null);
 }
});
test('claim history distinguishes acceptance from proof without revealing replacement hands',()=>{
 let g=tutorialGame(1);g=tutorialMove(g,1,'bir').game;
 const claim=g.claims[0];assert.equal(claim.name,'আপনি');assert.equal(claim.challengerName,'প্রশিক্ষণ সঙ্গী');assert.equal(claim.outcome,'proven');
 const v=view(g,'guide');assert.deepEqual(v.claims,g.claims);assert.ok(v.players[0].cards.every(c=>c.role===null));assert.equal(v.deck,undefined);
 g=tutorialGame(0);act(g,'you',{action:'bir'});respond(g,'guide',{choice:'pass'});assert.equal(g.claims[0].outcome,'accepted');assert.equal(g.claims[0].challenger,undefined);
 act(g,'guide',{action:'bir'});tick(g,g.waiting.deadline+1,false);assert.equal(g.claims[1].outcome,'accepted');
});
test('loss animation receives only the selected public card after choice, including final loss',()=>{
 const g=tutorialGame(1);act(g,'you',{action:'bir'});respond(g,'guide',{choice:'challenge'});
 assert.equal(g.reveals.length,0);assert.equal(g.waiting.type,'loss');
 const selected=g.players[1].cards[0].role;respond(g,'guide',{choice:'lose',index:0});
 assert.equal(g.reveals.length,1);assert.equal(g.reveals[0].role,selected);assert.equal(g.reveals[0].player,'guide');
 assert.deepEqual(view(g,'you').reveals,g.reveals);assert.ok(view(g,'you').players[1].cards.filter(c=>c.alive).every(c=>c.role===null));
});
test('attack effects name the correct target and cancelled bluffs do not emit attacks',()=>{
 const bluff=tutorialGame(2);respond(bluff,'you',{choice:'challenge'});respond(bluff,'guide',{choice:'lose',index:0});assert.equal(bluff.attacks.length,0);
 for(const action of ['kill','brahma','betal']){const g=tutorialGame(0);if(action==='betal')g.roles=g.roles.map(r=>r==='brahma'?'betal':r);g.players[0].coins=9;act(g,'you',{action,target:'guide'});if(g.waiting.type==='response')respond(g,'guide',{choice:'pass'});assert.equal(g.attacks.length,1);assert.equal(g.attacks[0].kind,action);assert.equal(g.attacks[0].actor,'you');assert.equal(g.attacks[0].target,'guide');assert.equal(g.waiting.type,'loss');}
});
test('series awards once, survives serialization, preserves standings through rematches and resets after finale',()=>{
 let g=newGame('ABC234','Series',false,2,'a','A');g.players.push({id:'b',name:'B',coins:2,cards:[],ready:true});configureSeries(g,3);g.players[0].ready=true;
 for(let round=1;round<=3;round++){
  start(g);assert.equal(g.series.round,round);assert.throws(()=>configureSeries(g,7));
  g.players[0].coins=7;g.players[1].cards[0].alive=false;act(g,'a',{action:'kill',target:'b'});respond(g,'b',{choice:'lose',index:1});
  assert.equal(g.series.results.length,round);assert.equal(g.series.scores[0].wins,round);
  tick(g,Date.now()+999999);assert.equal(g.series.scores[0].wins,round);
  g=JSON.parse(JSON.stringify(g));assert.equal(view(g,'b').series.scores[0].wins,round);
  prepareRematch(g);if(round<3){assert.equal(g.series.round,round);assert.equal(g.series.scores[0].wins,round)}else{assert.equal(g.series.round,0);assert.deepEqual(g.series.results,[]);assert.deepEqual(g.series.scores,[])}
  g.players.forEach(p=>p.ready=true);
 }
});
