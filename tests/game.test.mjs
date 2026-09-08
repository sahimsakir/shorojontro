import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('.sites-runtime/engine-tests',{recursive:true});
for(const name of ['cards','social','series','bots','engine']){const s=readFileSync(`lib/game/${name}.ts`,'utf8').replace("'./cards'","'./cards.mjs'").replace("'./bots'","'./bots.mjs'").replace("'./social'","'./social.mjs'").replace("'./series'","'./series.mjs'");writeFileSync(`.sites-runtime/engine-tests/${name}.mjs`,ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText)}
const {newGame,start,act,respond,tick,leave,view,alive}=await import('../.sites-runtime/engine-tests/engine.mjs');
function setup(roles=['bir','orun','brahma','kalu','chor'],n=3){const g=newGame('ABC234','Test',false,6,'a','A');for(let i=1;i<n;i++)g.players.push({id:String.fromCharCode(97+i),name:String.fromCharCode(65+i),cards:[],coins:2,ready:true});g.players[0].ready=true;g.roles=roles;start(g);return g}
function passes(g){let count=0;while(g.waiting?.type==='response'){if(++count>10)throw Error('loop');const w=g.waiting;const id=w.eligible.find(id=>!w.passed.includes(id));respond(g,id,{choice:'pass'})}}
function lose(g){respond(g,g.waiting.actor,{choice:'lose',index:g.players.find(p=>p.id===g.waiting.actor).cards.findIndex(c=>c.alive)})}
function give(g,id,role){const p=g.players.find(p=>p.id===id);const old=p.cards[0].role;const i=g.deck.indexOf(role);if(i>=0){g.deck[i]=old;p.cards[0].role=role;return}for(const q of g.players)for(const c of q.cards)if(c.role===role){c.role=old;p.cards[0].role=role;return}}
function noRole(g,id,role){const p=g.players.find(p=>p.id===id);while(p.cards.some(c=>c.role===role)){const c=p.cards.find(c=>c.role===role);const j=g.deck.findIndex(r=>r!==role);if(j<0)throw Error('fixture');[c.role,g.deck[j]]=[g.deck[j],c.role]}}
function invariant(g){const roles=[...g.deck,...g.players.flatMap(p=>p.cards.map(c=>c.role)),...(g.waiting?.type==='exchange'?g.waiting.options.slice(g.waiting.keep):[])];assert.equal(roles.length,15);for(const r of g.roles)assert.equal(roles.filter(x=>x===r).length,3);for(const p of g.players)assert.ok(p.coins>=0)}
test('2–6 players, valid cast, 15 conserved cards and hidden opponent hands',()=>{for(let n=2;n<=6;n++){const g=setup(undefined,n);invariant(g);const v=view(g,'a');assert.equal(v.deck,undefined);assert.equal(v.queue,undefined);assert.ok(v.players[1].cards.every(c=>c.role===null));assert.ok(v.players[0].cards.every(c=>c.role!==null));}});
test('income, turn ownership, mandatory kill at 10 and chosen life loss',()=>{const g=setup();assert.throws(()=>act(g,'b',{action:'income'}));act(g,'a',{action:'income'});assert.equal(g.players[0].coins,3);assert.equal(g.turn,1);g.players[1].coins=10;assert.throws(()=>act(g,'b',{action:'bir'}));act(g,'b',{action:'kill',target:'a'});assert.equal(g.players[1].coins,3);assert.equal(g.waiting.type,'loss');lose(g);assert.equal(g.players[0].cards.filter(c=>c.alive).length,1);assert.equal(g.turn,2)});
test('truthful challenge replaces proof, false challenger loses life, action continues',()=>{const g=setup();give(g,'a','bir');act(g,'a',{action:'bir'});respond(g,'b',{choice:'challenge'});assert.equal(g.waiting.type,'loss');assert.equal(g.waiting.actor,'b');lose(g);assert.equal(g.players[0].coins,5);assert.equal(g.turn,1);invariant(g)});
test('caught assassination bluff loses life, action canceled and cost not refunded',()=>{const g=setup();noRole(g,'a','brahma');g.players[0].coins=5;act(g,'a',{action:'brahma',target:'b'});respond(g,'c',{choice:'challenge'});lose(g);assert.equal(g.players[0].coins,2);assert.equal(g.players[1].cards.filter(c=>c.alive).length,2);assert.equal(g.turn,1)});
test('both assassins cost correctly and never offer a block',()=>{for(const [role,cost] of [['brahma',3],['betal',5]]){const g=setup(['bir','orun',role,'kalu','chor']);g.players[0].coins=8;act(g,'a',{action:role,target:'b'});passes(g);assert.equal(g.waiting.type,'loss');assert.equal(g.players[0].coins,8-cost);lose(g);invariant(g)}});
test('Kalu robbery can be blocked by Petuk, block claim is challengeable',()=>{const g=setup(['bir','petuk','brahma','kalu','chor']);give(g,'b','petuk');act(g,'a',{action:'kalu',target:'b'});passes(g);assert.equal(g.waiting.type,'block');respond(g,'b',{choice:'block',role:'petuk'});respond(g,'c',{choice:'challenge'});lose(g);assert.equal(g.players[0].coins,2);assert.equal(g.players[1].coins,2);invariant(g)});
test('false block loses life, original robbery continues',()=>{const g=setup();noRole(g,'b','kalu');act(g,'a',{action:'kalu',target:'b'});passes(g);respond(g,'b',{choice:'block',role:'kalu'});respond(g,'c',{choice:'challenge'});lose(g);assert.equal(g.players[0].coins,4);assert.equal(g.players[1].coins,0)});
test('Chichke block protects only blocker, not other players',()=>{const g=setup();act(g,'a',{action:'chor'});passes(g);respond(g,'b',{choice:'block',role:'chor'});passes(g);assert.equal(g.waiting.actor,'c');respond(g,'c',{choice:'pass'});assert.deepEqual(g.players.map(p=>p.coins),[3,2,1]);invariant(g)});
test('Mamdo four claimants distribute 2–1–1–0 in seat order',()=>{const g=setup(['mamdo','orun','brahma','kalu','chor'],4);act(g,'a',{action:'mamdo'});passes(g);for(const id of ['b','c','d']){assert.equal(g.waiting.type,'share');assert.equal(g.waiting.actor,id);respond(g,id,{choice:'claim'});passes(g)}assert.deepEqual(g.players.map(p=>p.coins),[4,3,3,2]);assert.equal(g.turn,1);invariant(g)});
test('exchange only living cards and never sends options to opponents',()=>{for(const role of ['orun','petuk']){const g=setup(['bir',role,'brahma','kalu','chor']);g.players[0].cards[1].alive=false;const dead=g.players[0].cards[1].role;act(g,'a',{action:role});passes(g);assert.equal(g.waiting.keep,1);assert.equal(g.waiting.options.length,role==='orun'?2:3);assert.equal(view(g,'b').waiting.options,undefined);respond(g,'a',{choice:'keep',indices:[1]});assert.equal(g.players[0].cards[1].role,dead);assert.equal(g.players[0].cards[1].alive,false);invariant(g)}});
test('Nantu collects from earning character and another claim replaces tax',()=>{const g=setup(['bir','orun','brahma','nantu','kalu']);act(g,'a',{action:'nantu',role:'bir'});passes(g);act(g,'b',{action:'bir'});passes(g);assert.deepEqual(g.players.map(p=>p.coins),[3,4,2]);act(g,'c',{action:'nantu',role:'kalu'});passes(g);assert.deepEqual(g.tax,{owner:'c',role:'kalu'});invariant(g)});
test('blocked robbery creates no earnings and no tax',()=>{const g=setup(['bir','orun','brahma','nantu','kalu']);g.tax={owner:'c',role:'kalu'};act(g,'a',{action:'kalu',target:'b'});passes(g);respond(g,'b',{choice:'block',role:'kalu'});passes(g);assert.deepEqual(g.players.map(p=>p.coins),[2,2,2])});
test('timeouts progress turn and responses; leaving forfeits and determines winner',()=>{const g=setup();assert.equal(tick(g,g.deadline+1),true);assert.equal(g.turn,1);act(g,'b',{action:'bir'});tick(g,g.waiting.deadline+1);assert.equal(g.players[1].coins,5);leave(g,'c');leave(g,'b');assert.equal(g.status,'finished');assert.equal(g.winner,'a')});
test('leaving during share continues to next sharer',()=>{const g=setup(['mamdo','orun','brahma','kalu','chor'],4);act(g,'a',{action:'mamdo'});passes(g);leave(g,'b');assert.equal(g.waiting.actor,'c')});
test('server rejects unsupported roles, self-targets and duplicate card picks',()=>{const g=setup();assert.throws(()=>act(g,'a',{action:'betal',target:'b'}));assert.throws(()=>act(g,'a',{action:'kalu',target:'a'}));act(g,'a',{action:'orun'});passes(g);assert.throws(()=>respond(g,'a',{choice:'keep',indices:[0,0]}))});
const {addBots,phaseKey}=await import('../.sites-runtime/engine-tests/engine.mjs');
const {chooseBotMove}=await import('../.sites-runtime/engine-tests/bots.mjs');
test('bots fill available seats, stay ready and cannot exceed room capacity',()=>{const g=newGame('ABC234','Bots',false,6,'a','A');addBots(g,5);assert.equal(g.players.length,6);assert.ok(g.players.slice(1).every(p=>p.bot&&p.ready));assert.throws(()=>addBots(g,1));assert.throws(()=>addBots(g,0));g.players[0].ready=true;start(g);assert.throws(()=>addBots(g,1))});
test('bots use only redacted knowledge and obey response/turn ownership',()=>{const g=setup();g.players[1].bot=true;act(g,'a',{action:'bir'});const first=chooseBotMove(view(g,'b'),'b',()=>0.5);const changed=structuredClone(g);const hidden=changed.players.filter(p=>p.id!=='b').flatMap(p=>p.cards);[hidden[0].role,hidden.at(-1).role]=[hidden.at(-1).role,hidden[0].role];changed.deck.reverse();assert.deepEqual(chooseBotMove(view(changed,'b'),'b',()=>0.5),first);assert.equal(chooseBotMove(view(g,'a'),'a',()=>0.5),null);const phase=phaseKey(g);respond(g,'b',{choice:'pass'});assert.equal(phaseKey(g),phase);assert.equal(chooseBotMove(view(g,'b'),'b'),null);respond(g,'c',{choice:'pass'});assert.notEqual(phaseKey(g),phase)});
test('computer turns are paced and do not preempt human API requests',()=>{const g=setup();g.players[1].bot=true;act(g,'a',{action:'income'});g.botAt=Date.now()+5000;assert.equal(tick(g,Date.now()),false);assert.equal(tick(g,g.botAt,false),false);assert.equal(tick(g,g.botAt),true);assert.equal(g.botAt> Date.now(),true)});
test('complete games with 1–5 computers across all 24 legal casts conserve cards and finish',()=>{let games=0;for(let n=2;n<=6;n++)for(const blue of ['bir','mamdo'])for(const purple of ['orun','petuk'])for(const black of ['brahma','betal'])for(const greens of [['kalu','chor'],['kalu','nantu'],['chor','nantu']]){const g=newGame('ABC234','Bots',false,6,'a','A');addBots(g,n-1);g.players[0].ready=true;g.roles=[blue,purple,black,...greens];start(g);let steps=0;while(g.status==='playing'&&steps++<3000){invariant(g);const w=g.waiting;const human=g.players[0];const humanCan=alive(human)&&(w?w.eligible.includes('a')&&!w.passed.includes('a'):g.players[g.turn].id==='a');if(humanCan){const move=chooseBotMove(view(g,'a'),'a');assert.ok(move);if(move.op==='act')act(g,'a',move);else respond(g,'a',move)}else{assert.ok(tick(g,Math.max(Date.now(),g.botAt??0)),JSON.stringify({n,steps,w,turn:g.turn}))}}assert.equal(g.status,'finished',`stalled ${g.roles} ${n} ${steps}`);invariant(g);assert.equal(g.players.filter(alive).length,1);games++}assert.equal(games,120)});
test('host passes to another human and last human departure closes bot-only rooms',()=>{const g=newGame('ABC234','Bots',false,6,'a','A');addBots(g,2);g.players.push({id:'b',name:'B',coins:2,cards:[],ready:true});g.players[0].ready=true;start(g);leave(g,'a');assert.equal(g.host,'b');leave(g,'b');assert.equal(g.status,'finished');assert.equal(g.host,'');assert.ok(g.players.every(p=>p.left));const lobby=newGame('ABC234','Bots',false,6,'a','A');addBots(lobby,2);leave(lobby,'a');assert.equal(lobby.players.length,0)});
test('attacker may select any living opponent; victim chooses the lost card',()=>{for(const action of ['kill','brahma','betal'])for(const target of ['b','c','d','e','f']){const g=setup(['bir','orun',action==='betal'?'betal':'brahma','kalu','chor'],6);g.players[0].coins=9;act(g,'a',{action,target});if(action!=='kill'){assert.equal(g.waiting.target,target);assert.ok(g.waiting.message.includes(g.players.find(p=>p.id===target).name));passes(g)}assert.equal(g.waiting.actor,target);assert.throws(()=>respond(g,'a',{choice:'lose',index:0}));respond(g,target,{choice:'lose',index:1});const victim=g.players.find(p=>p.id===target);assert.equal(victim.cards[0].alive,true);assert.equal(victim.cards[1].alive,false);assert.ok(g.players.filter(p=>p.id!==target).every(p=>p.cards.every(c=>c.alive)));invariant(g)}});
test('any robbery victim may claim Kalu to block their own coins; bystanders cannot block',()=>{for(const target of ['b','c','d','e','f']){const g=setup(undefined,6);give(g,target,'kalu');act(g,'a',{action:'kalu',target});assert.equal(g.waiting.target,target);passes(g);assert.equal(g.waiting.actor,target);assert.ok(g.waiting.roles.includes('kalu'));const bystander=g.players.find(p=>p.id!=='a'&&p.id!==target).id;assert.throws(()=>respond(g,bystander,{choice:'block',role:'kalu'}));respond(g,target,{choice:'block',role:'kalu'});respond(g,'a',{choice:'challenge'});assert.equal(g.waiting.actor,'a');lose(g);assert.ok(g.players.every(p=>p.coins===2));invariant(g)}});
test('Nantu requires an explicit selected character and failed replacement preserves old tax',()=>{const g=setup(['bir','orun','brahma','nantu','kalu']);assert.throws(()=>act(g,'a',{action:'nantu'}));assert.equal(g.tax,null);act(g,'a',{action:'nantu',role:'bir'});passes(g);assert.deepEqual(g.tax,{owner:'a',role:'bir'});noRole(g,'b','nantu');act(g,'b',{action:'nantu',role:'kalu'});respond(g,'c',{choice:'challenge'});lose(g);assert.deepEqual(g.tax,{owner:'a',role:'bir'});act(g,'c',{action:'nantu',role:'kalu'});passes(g);assert.deepEqual(g.tax,{owner:'c',role:'kalu'})});
test('truthful Bir proof returns before shuffle: same or different replacement is possible',()=>{const original=crypto.getRandomValues;try{for(const [random,expected] of [[1,'bir'],[0,'orun']]){const g=setup();give(g,'a','bir');g.deck=['orun'];act(g,'a',{action:'bir'});crypto.getRandomValues=function(array){array[0]=random;return array};respond(g,'c',{choice:'challenge'});assert.equal(g.players[0].cards[0].role,expected);assert.equal(g.waiting.actor,'c');assert.equal(view(g,'b').players[0].cards[0].role,null);crypto.getRandomValues=original}}finally{crypto.getRandomValues=original}});

test('final truthful challenge preserves winner proof and reveals the finished hand to everyone',()=>{
 const g=setup(undefined,2);give(g,'a','bir');g.players[1].cards[1].alive=false;
 const hand=structuredClone(g.players[0].cards),deck=[...g.deck];
 act(g,'a',{action:'bir'});respond(g,'b',{choice:'challenge'});
 assert.deepEqual(g.deck,deck);assert.deepEqual(g.players[0].cards,hand);
 lose(g);assert.equal(g.status,'finished');assert.equal(g.winner,'a');
 assert.deepEqual(g.deck,deck);assert.deepEqual(g.players[0].cards,hand);
 assert.equal(g.waiting,null);assert.deepEqual(g.queue,[]);
 for(const id of ['a','b'])assert.deepEqual(view(g,id).players[0].cards,hand);
 invariant(g);
});
test('one player cannot start; two players can start',()=>{
 const g=newGame('ABC234','Test',false,2,'a','A');g.players[0].ready=true;
 assert.throws(()=>start(g));assert.equal(setup(undefined,2).status,'playing');
});

test('final assassination challenge costs two lives and preserves the proven winning card',()=>{
 for(const role of ['brahma','betal']){
  const g=setup(['bir','orun',role,'kalu','chor'],2);give(g,'a',role);
  g.players[0].cards[1].alive=false;g.players[0].coins=5;
  const hand=structuredClone(g.players[0].cards),deck=[...g.deck];
  act(g,'a',{action:role,target:'b'});respond(g,'b',{choice:'challenge'});
  assert.match(g.waiting.message,/চ্যালেঞ্জে/);
  assert.deepEqual(g.deck,deck);assert.deepEqual(g.players[0].cards,hand);
  lose(g);assert.equal(g.status,'playing');assert.equal(g.waiting.type,'loss');
  assert.match(g.waiting.message,/আক্রমণে/);
  lose(g);assert.equal(g.status,'finished');assert.equal(g.winner,'a');
  assert.deepEqual(g.deck,deck);assert.deepEqual(view(g,'b').players[0].cards,hand);
  invariant(g);
 }
});
test('assassination bluff with only a dead proof loses challenge and cancels attack',()=>{
 const g=setup(undefined,2);noRole(g,'a','brahma');give(g,'a','brahma');
 g.players[0].cards[0].alive=false;
 if(g.players[0].cards[1].role==='brahma'){
  const i=g.deck.findIndex(r=>r!=='brahma');
  [g.players[0].cards[1].role,g.deck[i]]=[g.deck[i],g.players[0].cards[1].role];
 }
 g.players[0].coins=3;act(g,'a',{action:'brahma',target:'b'});
 respond(g,'b',{choice:'challenge'});assert.equal(g.waiting.actor,'a');
 lose(g);assert.equal(g.winner,'b');assert.ok(g.players[1].cards.every(c=>c.alive));invariant(g);
});
test('non-final assassination still exchanges its truthful proof',()=>{
 const g=setup();give(g,'a','brahma');g.players[0].coins=3;
 act(g,'a',{action:'brahma',target:'b'});respond(g,'b',{choice:'challenge'});
 assert.ok(g.log.some(e=>e.text.includes('ডেকে ফিরিয়ে নতুন কার্ড নিয়েছে')));
 lose(g);lose(g);assert.equal(g.status,'playing');invariant(g);
});
test('duel starts with thirty-second turns and transitions after elimination',()=>{const before=Date.now();const two=setup(undefined,2);assert.ok(two.deadline>=before+30000&&two.deadline<=Date.now()+30000);const g=setup();assert.ok(g.deadline>=Date.now()+59000);g.players[2].cards[0].alive=false;g.players[0].coins=7;act(g,'a',{action:'kill',target:'c'});assert.ok(g.waiting.deadline>=Date.now()+24000);lose(g);assert.equal(g.status,'playing');assert.equal(g.players.filter(alive).length,2);assert.ok(g.deadline>=Date.now()+29000&&g.deadline<=Date.now()+30000);assert.ok(view(g,'a').players[1].cards.every(c=>c.role===null));});
