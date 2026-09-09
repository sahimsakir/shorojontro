import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {readFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
// Exercise the real route handlers against an isolated SQLite database, without network access.
const sqlite=new DatabaseSync(':memory:');
const db={prepare(sql){let values=[];const statement={bind(...v){values=v;return statement},async first(){return sqlite.prepare(sql).get(...values)??null},async all(){return {results:sqlite.prepare(sql).all(...values)}},async run(){const r=sqlite.prepare(sql).run(...values);return {success:true,meta:{changes:Number(r.changes)}}}};return statement}};
globalThis.__gameTestDB=db;
mkdirSync('.sites-runtime/api-tests',{recursive:true});
await build({stdin:{contents:"import * as game from './app/api/game/route'; import * as session from './app/api/session/route'; export {game,session};",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/api-tests/routes.mjs',bundle:true,platform:'node',format:'esm',plugins:[{name:'test-d1',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'db',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env={DB:globalThis.__gameTestDB};'}))}}]});
const routes=await import('../.sites-runtime/api-tests/routes.mjs');
const mf={async getD1Database(){return db},async dispatchFetch(url,init){const req=new Request(url,init);const group=new URL(url).pathname==='/api/session'?routes.session:routes.game;return group[req.method](req)},async dispose(){sqlite.close()}};
try{
 const db=await mf.getD1Database('DB');for(const sql of readFileSync('drizzle/0000_organic_blizzard.sql','utf8').split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql).run();
 const users=[];for(let i=0;i<7;i++){const r=await mf.dispatchFetch('https://game.test/api/session');assert.equal(r.status,200,await r.clone().text());const cookie=r.headers.get('set-cookie').split(';')[0];const s=await r.json();users.push({cookie,id:s.id});}
 async function call(i,path,body){const r=await mf.dispatchFetch('https://game.test'+path,{method:body?'POST':'GET',headers:{cookie:users[i].cookie,...(body?{'Content-Type':'application/json',Origin:'https://game.test'}:{})},body:body?JSON.stringify(body):undefined});const data=await r.json();return {status:r.status,...data}}
 for(const origin of ['https://shorojontro-nine.vercel.app','https://unrelated.vercel.app']){
  const response=await mf.dispatchFetch('https://game.test/api/session',{method:'POST',headers:{cookie:users[0].cookie,'Content-Type':'application/json',Origin:origin},body:JSON.stringify({name:'Proxy player'})});
  assert.equal(response.status,origin==='https://shorojontro-nine.vercel.app'?200:400);
 }
 const duo=await mf.dispatchFetch('https://game.test/api/game',{method:'POST',headers:{cookie:users[0].cookie,'Content-Type':'application/json',Origin:'https://shorojontro-nine.vercel.app'},body:JSON.stringify({op:'create',name:'Two player',max:2,private:true,password:'secret42'})});
 assert.equal(duo.status,200);assert.equal((await duo.json()).game.max,2);
 for(let i=0;i<7;i++)assert.equal((await call(i,'/api/session',{name:'Player '+i})).status,200);
 let result=await call(0,'/api/game',{op:'create',name:'Private test',max:6,private:true,password:'secret42',timers:{turn:90,response:45,duel:20}});assert.equal(result.status,200,JSON.stringify(result));assert.deepEqual(result.game.timers,{turn:90,response:45,duel:20});const code=result.game.code;
 assert.equal((await call(1,'/api/game')).rooms.length,0,'private rooms are hidden');
 assert.equal((await call(1,'/api/game?room='+code)).status,403,'nonmember cannot read state');
 assert.equal((await call(1,'/api/game',{op:'join',code,password:'wrong'})).status,400,'wrong password rejected');
 for(let i=1;i<6;i++){result=await call(i,'/api/game',{op:'join',code,password:'secret42'});assert.equal(result.status,200,JSON.stringify(result))}
 assert.equal((await call(6,'/api/game',{op:'join',code,password:'secret42'})).status,400,'room capacity enforced');
 let g=(await call(0,'/api/game?room='+code)).game;
 assert.equal(g.series.total,5);
 assert.equal((await call(1,'/api/game',{op:'series',code,revision:g.revision,rounds:3})).status,400,'only host configures series');
 result=await call(0,'/api/game',{op:'series',code,revision:g.revision,rounds:3});assert.equal(result.status,200);g=result.game;assert.equal(g.series.total,3);
 assert.equal((await call(1,'/api/game',{op:'start',code,revision:g.revision})).status,400,'host permission');
 for(let i=0;i<6;i++){g=(await call(i,'/api/game?room='+code)).game;result=await call(i,'/api/game',{op:'ready',code,revision:g.revision,ready:true});assert.equal(result.status,200)}
 g=result.game;result=await call(0,'/api/game',{op:'start',code,revision:g.revision});assert.equal(result.status,200);g=result.game;
 assert.equal(g.players.length,6);assert.equal(g.deckCount,3);assert.ok(!('deck' in g));assert.ok(!('queue' in g));assert.ok(g.players[1].cards.every(c=>c.role===null));assert.ok(g.players[0].cards.every(c=>c.role));
 const concurrent=await Promise.all([call(0,'/api/game',{op:'act',code,revision:g.revision,action:'income'}),call(0,'/api/game',{op:'act',code,revision:g.revision,action:'income'})]);assert.equal(concurrent.filter(r=>r.status===200).length,1,'only one concurrent move commits');
 g=(await call(1,'/api/game?room='+code)).game;assert.equal(g.turn,1);assert.equal(g.players[0].coins,3);assert.ok(g.players[0].cards.every(c=>c.role===null));assert.ok(g.players[1].cards.every(c=>c.role));
 result=await call(1,'/api/game',{op:'act',code,revision:g.revision,action:'bir'});assert.equal(result.status,200);g=result.game;assert.equal(g.waiting.type,'response');assert.ok(!('success' in g.waiting));
 for(const i of [0,2,3,4,5]){g=(await call(i,'/api/game?room='+code)).game;result=await call(i,'/api/game',{op:'respond',code,revision:g.revision,choice:'pass'});assert.equal(result.status,200,JSON.stringify(result))}
 g=result.game;assert.equal(g.players[1].coins,5);assert.equal(g.turn,2);
 const restored=await call(0,'/api/session');assert.equal(restored.room,code,'session reconnect finds room');
 const recovered=(await call(0,'/api/game?room='+restored.room)).game;
 assert.equal(recovered.series.round,1);assert.equal(recovered.series.total,3);assert.equal(recovered.claims[0].outcome,'accepted');assert.equal(recovered.players[0].id,users[0].id);
 const reaction=await call(0,'/api/game',{op:'react',code,revision:0,reaction:'doubt'});assert.equal(reaction.status,200);assert.equal(reaction.game.phase,recovered.phase);assert.equal(reaction.game.reactions.at(-1).reaction,'doubt');
 assert.equal((await call(0,'/api/game',{op:'react',code,reaction:'gg'})).status,400,'reaction cooldown enforced');
 assert.equal((await call(6,'/api/game',{op:'react',code,reaction:'gg'})).status,403,'only room members react');
 const publicRoom=await call(6,'/api/game',{op:'create',name:'Public test',max:3,private:false});assert.equal(publicRoom.status,200);const list=await call(0,'/api/game');assert.equal(list.rooms.length,1);assert.equal(list.rooms[0].code,publicRoom.game.code);assert.equal(list.rooms[0].state,undefined);

 // Host-only bots, readiness, capacity, a one-human start and autonomous progress.
 let botGame=publicRoom.game;const botCode=botGame.code;
 let joined=await call(0,'/api/game',{op:'join',code:botCode});
 assert.equal((await call(0,'/api/game',{op:'bots',code:botCode,revision:joined.game.revision,count:1})).status,400);
 let removed=await call(6,'/api/game',{op:'kick',code:botCode,revision:joined.game.revision,target:users[0].id});
 removed=await call(6,'/api/game',{op:'botLevel',code:botCode,revision:removed.game.revision,level:'hard'});assert.equal(removed.status,200);assert.equal(removed.game.botDifficulty,'hard');
 result=await call(6,'/api/game',{op:'bots',code:botCode,revision:removed.game.revision,count:3});assert.equal(result.status,400);
 result=await call(6,'/api/game',{op:'bots',code:botCode,revision:removed.game.revision,count:2});assert.equal(result.status,200);botGame=result.game;
 assert.equal(botGame.players.filter(p=>p.bot&&p.ready).length,2);
 result=await call(6,'/api/game',{op:'ready',code:botCode,revision:botGame.revision,ready:true});
 result=await call(6,'/api/game',{op:'start',code:botCode,revision:result.game.revision});assert.equal(result.status,200);botGame=result.game;
 // A bot accepting the same claim must not invalidate the human's response.
 result=await call(6,'/api/game',{op:'act',code:botCode,revision:botGame.revision,phase:botGame.phase,action:'income'});assert.equal(result.status,200);
 let raw=JSON.parse(sqlite.prepare('SELECT state FROM rooms WHERE code=?').get(botCode).state);raw.botAt=0;
 sqlite.prepare('UPDATE rooms SET state=? WHERE code=?').run(JSON.stringify(raw),botCode);
 result=await call(6,'/api/game?room='+botCode);assert.equal(result.status,200);assert.ok(result.game.revision>raw.revision,'bot progresses on polling');assert.ok(result.game.players.filter(p=>p.bot).every(p=>p.cards.every(c=>!c.alive||c.role===null)));
 // Existing six-human room: concurrent accept requests on one phase both commit.
 g=(await call(2,'/api/game?room='+code)).game;
 result=await call(2,'/api/game',{op:'act',code,revision:g.revision,phase:g.phase,action:'bir'});g=result.game;
 const accepts=await Promise.all([0,1].map(i=>call(i,'/api/game',{op:'respond',code,revision:g.revision,phase:g.phase,choice:'pass'})));
 assert.ok(accepts.every(x=>x.status===200),JSON.stringify(accepts));
 const obsolete=await call(0,'/api/game',{op:'respond',code,revision:g.revision,phase:'obsolete',choice:'pass'});assert.equal(obsolete.status,409);
 console.log('PASS: host-only bot controls, bounded capacity, solo start, server bot progression, hidden bot hands and concurrent same-phase responses.');
 assert.ok(readFileSync('public/cards/bir.webp').byteLength>10000);
 console.log('PASS: 7 isolated sessions, private passwords, membership, capacity, host permissions, 6-player start, hidden hands, atomic concurrent moves, live claims, reconnect, public list and card asset.');
}finally{await mf.dispose()}
