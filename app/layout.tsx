import type { Metadata, Viewport } from 'next';
import './globals.css';
import './jungle.css';
import './features.css';
export const metadata:Metadata={title:'ষড়যন্ত্র — বন্ধু ও কম্পিউটারের সঙ্গে খেলুন',description:'মানুষ ও কম্পিউটার মিলিয়ে ২–৬ জনের ষড়যন্ত্র। পাবলিক বা প্রাইভেট রুম বানান, ব্লাফ ও চ্যালেঞ্জ করুন, শেষ পর্যন্ত টিকে থাকুন।',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'ষড়যন্ত্র',statusBarStyle:'black-translucent'},icons:{icon:'/favicon.svg',apple:'/icons/apple-touch-icon.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#10221b'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="bn"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/></head><body>{children}</body></html>}
