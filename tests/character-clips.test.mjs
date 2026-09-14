import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdirSync} from 'node:fs';
mkdirSync('.sites-runtime/clip-tests',{recursive:true});
await build({entryPoints:['lib/game/character-clips.ts'],outfile:'.sites-runtime/clip-tests/clips.mjs',bundle:true,platform:'node',format:'esm'});
const {beginCharacterClip,clipPlaying}=await import('../.sites-runtime/clip-tests/clips.mjs');
for(const [role,duration] of [['nantu',4100],['brahma',3500],['betal',3200]])test(role+' pauses presentation and preserves the full response window',()=>{
 const g={status:'playing',players:[{id:'p1',name:'Player'}],waiting:{type:'response',role,actor:'p1',claimId:5,deadline:26000}};
 beginCharacterClip(g,4,1000);assert.equal(g.characterClip.role,role);assert.equal(g.waiting.deadline,26000+duration+1100);assert.equal(clipPlaying(g,1001),true);assert.equal(clipPlaying(g,1000+duration+1100),false);
 const deadline=g.waiting.deadline;beginCharacterClip(g,5,2000);assert.equal(g.waiting.deadline,deadline);g.status='finished';assert.equal(clipPlaying(g,1001),false);
});
test('other characters do not add a video or change time',()=>{const g={players:[],waiting:{type:'response',role:'bir',claimId:1,deadline:5000}};beginCharacterClip(g,0,1000);assert.equal(g.characterClip,undefined);assert.equal(g.waiting.deadline,5000)});
