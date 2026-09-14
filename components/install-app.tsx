'use client';
import {useEffect,useState} from 'react';
import {Download} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function InstallApp({open,onOpenChange}:{open:boolean;onOpenChange:(v:boolean)=>void}){
 const [prompt,setPrompt]=useState<InstallEvent|null>(null),[installed,setInstalled]=useState(false),[busy,setBusy]=useState(false),[ios,setIos]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(display-mode: standalone)');const sync=()=>setInstalled(media.matches||(navigator as Navigator&{standalone?:boolean}).standalone===true);sync();setIos(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));const before=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent)};const done=()=>{setInstalled(true);setPrompt(null);onOpenChange(false)};window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',done);media.addEventListener('change',sync);return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done);media.removeEventListener('change',sync)}},[]);
 async function install(){if(!prompt||busy)return;setBusy(true);try{await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==='accepted')onOpenChange(false)}catch{}finally{setPrompt(null);setBusy(false)}}
 if(installed)return null;
 return <><Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="game-dialog install-dialog"><DialogHeader><DialogTitle>মোবাইলে ষড়যন্ত্র রাখুন</DialogTitle><DialogDescription>Home screen থেকে সরাসরি গেম খুলুন। অনলাইন ম্যাচ খেলতে ইন্টারনেট লাগবে।</DialogDescription></DialogHeader>{prompt?<button className="primary full" disabled={busy} onClick={()=>void install()}><Download size={18}/>{busy?'অপেক্ষা করুন…':'অ্যাপ ইনস্টল করুন'}</button>:ios?<ol><li>Safari-তে এই গেম খুলুন।</li><li>Share বাটনে চাপুন।</li><li>“Add to Home Screen” বেছে নিন, তারপর “Add” চাপুন।</li></ol>:<p>ব্রাউজারের মেনু (⋮) খুলে “Install app” বা “Add to Home screen” বেছে নিন। অপশন না থাকলে Chrome বা Edge-এ গেমটি খুলুন।</p>}</DialogContent></Dialog></>;
}
