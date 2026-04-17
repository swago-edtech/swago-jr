'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    ChevronDown,
    Zap,
    Brain,
    Flame,
    Target,
    Flag,
    Ticket as TicketIcon,
    Plus,
    Coins
} from 'lucide-react';

const TAGS = [
    { name: 'Growth', color: 'bg-[#4ADE80]', icon: Target },
    { name: 'Optimization', color: 'bg-[#818CF8]', icon: Zap },
    { name: 'Willpower', color: 'bg-[#F97316]', icon: Flame },
    { name: 'Ambition', color: 'bg-[#FBBF24]', icon: Brain },
    { name: 'Mission', color: 'bg-[#38BDF8]', icon: Flag },
    { name: 'Ticket', color: 'bg-[#34D399]', icon: TicketIcon },
];

const QUESTS = [
    {
        title: '"Yes I Can" Dance',
        description: `Groove on “Yes I Can” song with your smart box`,
        tags: [
            { name: 'Growth', color: 'bg-[#818CF8]', icon: Zap },
            { name: 'Spotlight', color: 'bg-[#34D399]', icon: Target },
        ],
        image: '/images/test/quest_ice_clock.png',
        reward: 50,
        frequency: 'Once per season',
        skill: 'Growth'
    },
    {
        title: 'Confidence Mirror Challenge',
        description: 'Practice positive self-talk in front of a mirror.',
        tags: [
            { name: 'Growth', color: 'bg-[#4ADE80]', icon: Target },
            { name: 'Mission', color: 'bg-[#38BDF8]', icon: Flag },
        ],
        image: '/images/test/quest_megaphone.png',
        reward: 5,
        frequency: 'Once per day',
        skill: 'Growth'
    },
    {
        title: 'Treasure Draw Entry',
        description: 'Claim your lucky ticket',
        tags: [
            { name: 'Ticket', color: 'bg-[#34D399]', icon: TicketIcon },
            { name: 'Ticket', color: 'bg-[#FBBF24]', icon: TicketIcon },
        ],
        image: '/images/test/quest_treasure.png',
        reward: 20,
        frequency: 'Once per box',
        skill: 'Luck'
    }
];

export default function TestPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans selection:bg-blue-100">
            <div className="max-w-xl mx-auto space-y-8 mt-12 mb-20">

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-5">
                        <div className="relative w-24 h-24 rounded-full border-[10px] border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden">
                            <Image
                                src="/images/test/aarav_avatar.png"
                                alt="Avatar"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <h1 className="text-4xl font-[900] text-slate-800 tracking-tight leading-none">Aarav</h1>
                            <p className="text-lg font-bold text-slate-400">Growth Explorer</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white pl-2 pr-6 py-2 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-50 transition-transform active:scale-95 cursor-pointer group">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FFD700] to-[#FFF176] flex items-center justify-center border-4 border-white shadow-md group-hover:rotate-12 transition-transform">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center border border-amber-600/30">
                                <div className="w-2.5 h-2.5 bg-amber-800/10 rounded-full border border-amber-800/20"></div>
                            </div>
                        </div>
                        <span className="text-3xl font-[1000] text-slate-700 tracking-tighter">120</span>
                    </div>
                </motion.div>

                {/* Tags Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-[48px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] border border-slate-50 relative overflow-hidden"
                >
                    <h2 className="text-lg font-black text-slate-400 mb-6 tracking-[0.1em] uppercase text-[11px] ml-1 opacity-80">Tags</h2>

                    <div className="flex flex-wrap gap-4">
                        {TAGS.slice(0, 4).map((tag, i) => {
                            const Icon = tag.icon;
                            return (
                                <div
                                    key={i}
                                    className={`${tag.color} text-white px-5 py-2.5 rounded-2xl flex items-center gap-2.5 text-base font-black shadow-[0_8px_30px_-10px_rgba(0,0,0,0.2)] hover:scale-110 active:scale-90 transition-all cursor-pointer select-none`}
                                >
                                    <Icon className="w-5 h-5" strokeWidth={3} />
                                    {tag.name}
                                </div>
                            );
                        })}
                        <div className="flex flex-wrap gap-4 mt-2">
                            {TAGS.slice(4).map((tag, i) => {
                                const Icon = tag.icon;
                                return (
                                    <div
                                        key={i}
                                        className="bg-[#E2E8F0] text-[#94A3B8] px-5 py-2.5 rounded-2xl flex items-center gap-2.5 text-base font-black shadow-sm hover:bg-slate-200 transition-all cursor-pointer select-none border border-slate-100"
                                    >
                                        <Icon className="w-5 h-5" strokeWidth={3} />
                                        {tag.name}
                                    </div>
                                );
                            })}
                            <div className="bg-[#E2E8F0] text-[#94A3B8] px-5 py-2.5 rounded-2xl flex items-center gap-2.5 text-base font-black shadow-sm hover:bg-slate-200 transition-all cursor-pointer select-none border border-slate-100">
                                <div className="w-5 h-5 flex items-center justify-center opacity-40">
                                    <Plus className="w-4 h-4" strokeWidth={4} />
                                </div>
                                More
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quest Log Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-[900] text-slate-800 tracking-tight">Quest Log</h2>
                            <p className="text-base font-bold text-slate-400 tracking-tight opacity-90">Complete tasks to boost your skills and earn rewards.</p>
                        </div>
                        <div className="bg-slate-100/80 backdrop-blur px-5 py-2 rounded-2xl flex items-center gap-3 text-lg font-black text-slate-500 border border-slate-200/60 cursor-pointer hover:bg-slate-200 transition-all shadow-sm">
                            All <ChevronDown className="w-5 h-5" strokeWidth={4} />
                        </div>
                    </div>

                    <div className="space-y-8">
                        {QUESTS.map((quest, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ type: "spring", damping: 20, stiffness: 100, delay: i * 0.15 }}
                                className="bg-white p-6 rounded-[48px] shadow-[0_25px_70px_-30px_rgba(0,0,0,0.12)] border border-slate-50 relative group"
                            >
                                <div className="flex gap-8">
                                    {/* Left Product Image Area */}
                                    <div className="relative w-44 h-44 shrink-0">
                                        <div className="absolute inset-0 rounded-[40px] overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-700">
                                            <Image
                                                src={quest.image}
                                                alt={quest.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>

                                    {/* Right Content Area */}
                                    <div className="flex-1 flex flex-col pt-2 pr-4 relative">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {quest.tags.map((tag, j) => {
                                                const TagIcon = tag.icon;
                                                return (
                                                    <div key={j} className={`${tag.color} text-white px-3 py-1 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg`}>
                                                        <TagIcon className="w-3 h-3" strokeWidth={4} />
                                                        {tag.name}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <h3 className="text-2xl font-[1000] text-slate-800 leading-none mb-3 tracking-tight group-hover:text-blue-500 transition-colors uppercase italic">{quest.title}</h3>
                                        <p className="text-lg font-bold text-slate-500 leading-tight mb-4 opacity-80">{quest.description}</p>

                                        <div className="flex items-center gap-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-lg border-2 border-white">
                                                    <Coins className="w-5 h-5 text-amber-900" strokeWidth={3} />
                                                </div>
                                                <span className="text-xl font-[1000] text-slate-700 tracking-tighter">+{quest.reward} Coins</span>
                                            </div>
                                            <span className="text-base font-bold text-slate-400 opacity-60">{quest.frequency}</span>
                                        </div>

                                        {/* Skill Text */}
                                        <div className="mt-8 text-lg font-black text-slate-300 uppercase tracking-widest leading-none">
                                            Skill: <span className="text-slate-400">{quest.skill}</span>
                                        </div>

                                        {/* Start Button at Bottom Right */}
                                        <div className="absolute bottom-[-10px] right-[-10px]">
                                            <button className="bg-gradient-to-r from-[#4ADE80] to-[#10B981] text-white px-12 py-4 rounded-full text-2xl font-[1000] shadow-[0_15px_30px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all">
                                                Start
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer info text same as image */}
                <div className="text-center pt-12 pb-20">
                    <p className="text-slate-300 font-extrabold text-[10px] uppercase tracking-[0.4em] opacity-40">Elite Swago Club • Level up your game</p>
                </div>

            </div>
        </div>
    );
}
