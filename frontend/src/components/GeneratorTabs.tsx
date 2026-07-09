// D:/socialadify/frontend/src/components/generator/GeneratorTabs.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// --- Icon Components ---
const WandIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 13.75M17 13.75L15.75 12M17 13.75L18.25 15M15.75 12L17 10.25" /></svg> );
const TemplateIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> );


export default function GeneratorTabs() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <div className="mb-8 max-w-md mx-auto">
            <div className="flex justify-center border-b border-slate-700">
                <Link href="/post-generator" className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${isActive('/post-generator') ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'}`}>
                    <WandIcon /> Generate with AI
                </Link>
                <Link href="/template-generator" className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${isActive('/template-generator') ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'}`}>
                    <TemplateIcon /> Use a Template
                </Link>
            </div>
        </div>
    );
}
