import {newGame,start,act,respond,type Game} from './engine';
import type {Role} from './cards';

export const LESSONS=[
 {title:'সাধারণ আয়',text:'আপনার পালায় সাধারণ আয় নিলে ১ কয়েন পাবেন। কোনো চরিত্র দাবি লাগে না, তাই চ্যালেঞ্জও নেই।',done:'আপনার কয়েন ২ থেকে ৩ হয়েছে। প্রশিক্ষণ সঙ্গীও আয় করেছে।'},
 {title:'দাবি ও প্রমাণ',text:'আপনার হাতে বীরবিক্রম আছে। দাবি করে ৩ কয়েন আয় করুন। প্রশিক্ষণ সঙ্গী সন্দেহ করে চ্যালেঞ্জ করবে।',done:'দাবি সত্যি ছিল: সঙ্গী একটি জীবন হারিয়েছে। খেলা শেষ হয়নি, তাই প্রমাণিত কার্ড ডেকে ফিরে নতুন কার্ড এসেছে। আপনার আয়ও হয়েছে।'},
 {title:'ব্লাফ ধরুন',text:'এটি সাজানো অনুশীলন: সঙ্গীর হাতে ব্রহ্মদত্ত নেই, তবু সে আপনাকে আক্রমণ করছে। তার দাবিকে চ্যালেঞ্জ করুন। আসল খেলায় প্রতিপক্ষের হাত জানা থাকবে না।',done:'মিথ্যা দাবি ধরা পড়েছে! সঙ্গী একটি জীবন হারিয়েছে, তার আক্রমণ বাতিল হয়েছে। খরচ করা ৩ কয়েন সে ফেরত পায়নি।'},
 {title:'নিজের কয়েন বাঁচান',text:'সঙ্গী কালু ডাকাত দাবি করে আপনার ২ কয়েন নিতে চায়। আগে তার দাবি মেনে নিন, তারপর নিজের কালু ডাকাত দাবি করে ব্লক করুন।',done:'সঙ্গী আপনার ব্লক মেনে নিয়েছে। আপনার ২ কয়েনই রয়ে গেছে। ব্লকের দাবিকেও চ্যালেঞ্জ করা যায়।'},
 {title:'নান্টুমিয়ার খাজনা',text:'নান্টুমিয়া দাবি করে বীরবিক্রমের ওপর খাজনা বসান। এরপর সঙ্গী বীরবিক্রমের আয় করবে—আপনি ১ কয়েন পাবেন।',done:'সঙ্গীর ৩ কয়েন আয় থেকে ১ কয়েন আপনার কাছে এসেছে। অন্য কেউ পরে সফলভাবে নান্টুমিয়া দাবি করলে তার বাছাই আগের খাজনা বদলে দেবে।'},
 {title:'কার্ড অদলবদল',text:'ঊরুণ দাবি করুন। ডেক থেকে ১টি কার্ডের সঙ্গে নিজের জীবিত কার্ডগুলো মিলিয়ে ঠিক ২টি রাখুন। নষ্ট কার্ড কখনো বদলানো যায় না।',done:'বাছাই করা ২টি কার্ড আপনার হাতে আছে, অন্যটি ডেকে ফিরেছে। পেটুক চন্দ্রের ক্ষেত্রে ডেক থেকে ২টি আসে।'},
];

export function tutorialGame(lesson:number):Game{
 const g=newGame('LESSON','অনুশীলন',true,2,'you','আপনি');
 g.players.push({id:'guide',name:'প্রশিক্ষণ সঙ্গী',coins:2,cards:[],ready:true});
 g.players[0].ready=true;g.roles=['bir','orun','brahma','kalu','nantu'];start(g);
 const hands:Role[][]=lesson===3?[['kalu','orun'],['kalu','bir']]:lesson===4?[['nantu','orun'],['bir','kalu']]:[['bir','orun'],['kalu','nantu']];
 g.deck=g.roles.flatMap(r=>[r,r,r]);
 g.players.forEach((p,i)=>{p.cards=hands[i].map(role=>{g.deck.splice(g.deck.indexOf(role),1);return {role,alive:true}})});
 // Scripted, untimed scenarios use the real claim and response rules.
 if(lesson===2){g.turn=1;g.players[1].coins=5;act(g,'guide',{action:'brahma',target:'you'})}
 if(lesson===3){g.turn=1;act(g,'guide',{action:'kalu',target:'you'})}
 return g;
}

export function tutorialMove(source:Game,lesson:number,choice:string,indices:number[]=[]):{game:Game;done:boolean}{
 const g=structuredClone(source);
 const pass=()=>respond(g,'guide',{choice:'pass'});
 if(lesson===0&&choice==='income'){act(g,'you',{action:'income'});act(g,'guide',{action:'income'});return {game:g,done:true}}
 if(lesson===1&&choice==='bir'){act(g,'you',{action:'bir'});respond(g,'guide',{choice:'challenge'});respond(g,'guide',{choice:'lose',index:0});return {game:g,done:true}}
 if(lesson===2&&choice==='challenge'){respond(g,'you',{choice:'challenge'});respond(g,'guide',{choice:'lose',index:0});return {game:g,done:true}}
 if(lesson===3){if(choice==='pass'){respond(g,'you',{choice:'pass'});return {game:g,done:false}}if(choice==='block'){respond(g,'you',{choice:'block',role:'kalu'});pass();return {game:g,done:true}}}
 if(lesson===4&&choice==='nantu'){act(g,'you',{action:'nantu',role:'bir'});pass();act(g,'guide',{action:'bir'});respond(g,'you',{choice:'pass'});return {game:g,done:true}}
 if(lesson===5){if(choice==='orun'){act(g,'you',{action:'orun'});pass();return {game:g,done:false}}if(choice==='keep'){respond(g,'you',{choice:'keep',indices});return {game:g,done:true}}}
 throw Error('এই ধাপের নির্দেশনা অনুসরণ করুন।');
}
