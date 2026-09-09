'use client';
import {useState} from 'react';
import {Share2,Copy,Check} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
export function InvitePlayer({code,name,isPrivate}:{code:string;name:string;isPrivate:boolean}){
 const [open,setOpen]=useState(false),[copied,setCopied]=useState(false),[error,setError]=useState('');
 const url=()=>location.origin+'/?room='+encodeURIComponent(code);
 const message=()=>`ষড়যন্ত্র খেলতে এসো! রুম: ${name} (${code})${isPrivate?'। প্রাইভেট রুমের পাসওয়ার্ড আমার কাছ থেকে নাও।':''}`;
 async function copy(){try{await navigator.clipboard.writeText(url());setCopied(true)}catch{setError('নিচের লিংকটি সিলেক্ট করে কপি করুন।')}}
 async function share(){setError('');if(!navigator.share){setError('এই ব্রাউজারে সরাসরি share নেই। লিংক কপি করে যেকোনো অ্যাপে পাঠান।');return}try{await navigator.share({title:'ষড়যন্ত্র — খেলার আমন্ত্রণ',text:message(),url:url()})}catch(e){if((e as Error).name!=='AbortError')setError('Share করা যায়নি। লিংক কপি করে পাঠান।')}}
 return <><button className="secondary" onClick={()=>{setOpen(true);setCopied(false);setError('')}}><Share2 size={16}/><span>আমন্ত্রণ</span></button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="game-dialog account-dialog"><DialogHeader><DialogTitle>বন্ধুকে খেলতে ডাকুন</DialogTitle><DialogDescription>{name} · রুম কোড {code}</DialogDescription></DialogHeader><div className="account-form"><a className="primary full" href={open?'https://wa.me/?text='+encodeURIComponent(message()+'\n'+url()):undefined} target="_blank" rel="noopener noreferrer">WhatsApp-এ আমন্ত্রণ</a><button className="secondary full" onClick={share}><Share2 size={18}/>অন্য অ্যাপে পাঠান</button><button className="secondary full" onClick={copy}>{copied?<Check size={18}/>:<Copy size={18}/>} {copied?'লিংক কপি হয়েছে':'আমন্ত্রণ লিংক কপি'}</button><label>রুমের লিংক<input readOnly value={open?url():''} onFocus={e=>e.target.select()} aria-label="আমন্ত্রণ লিংক"/></label>{isPrivate&&<p className="account-help">প্রাইভেট রুমের পাসওয়ার্ড আলাদা করে বন্ধুকে জানান।</p>}{error&&<p role="status" className="account-help">{error}</p>}</div></DialogContent></Dialog></>;
}
