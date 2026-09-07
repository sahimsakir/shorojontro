import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'ষড়যন্ত্র — বন্ধু ও কম্পিউটারের সঙ্গে খেলুন',description:'মানুষ ও কম্পিউটার মিলিয়ে ৩–৬ জনের ষড়যন্ত্র। পাবলিক বা প্রাইভেট রুম বানান, ব্লাফ ও চ্যালেঞ্জ করুন, শেষ পর্যন্ত টিকে থাকুন।',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="bn"><body>{children}</body></html>}
