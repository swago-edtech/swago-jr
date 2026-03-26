"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSharedContext, USER_EVENTS } from "@/context/SharedContext";
import {
  Plus,
  Target,
  Zap,
  Flame,
  Brain,
  Flag,
  Ticket as TicketIcon,
  Coins,
  Star,
  ChevronDown,
  User as UserIcon,
  Calendar,
  MapPin,
  CheckCircle2,
  Package,
  Layers,
  Edit2,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReelUploadForm from '@/components/ReelUploadForm';

export default function ProfilePage() {
  const { user, setUser, isLoadingUser } = useSharedContext();
  const router = useRouter();
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [kidProfiles, setKidProfiles] = useState<any[]>([]);
  const [showReelForm, setShowReelForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Kid Creation Form State
  const [isCreatingKid, setIsCreatingKid] = useState(false);
  const [kidForm, setKidForm] = useState({
    name: "",
    age: "",
    dob: "",
    city: "",
    gender: "boy",
    avatarColor: "/images/kid_boy1.png",
  });
  const [kidError, setKidError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "create") {
      setIsOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (isLoadingUser) return;
    if (!user) {
      router.push("/login?redirect=/profile");
    } else {
      fetchKidProfiles();
    }
  }, [user, isLoadingUser, router]);

  const fetchKidProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const res = await fetch("/api/kid-profiles");
      if (res.ok) {
        const data = await res.json();
        const profiles = data.profiles || [];
        setKidProfiles(profiles);
        if (profiles.length > 0) {
          setIsOnboarding(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch kid profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const purchasedBoxes = useMemo(() => {
    if (!user?.orders) return [];
    const boxes = new Set<string>();
    user.orders.forEach((order: any) => {
      if (['Paid', 'Delivered', 'Shipped', 'Completed'].includes(order.status)) {
        order.items?.forEach((item: any) => {
          if (item.name) boxes.add(item.name);
        });
      }
    });
    return Array.from(boxes);
  }, [user?.orders]);

  const filteredQuests = useMemo(() => {
    let allQuests = [];
    
    // 1. Common Mission (Corrected Reward: 25 Coins)
    allQuests.push({
      title: 'Focus Freeze Reel',
      description: 'Create a "Yes I Can" pose with your box',
      tags: [
        { name: 'Optimization', color: 'bg-[#818CF8]', icon: Zap },
        { name: 'Spotlight', color: 'bg-[#4ADE80]', icon: Star }
      ],
      image: '/images/test/quest_ice_clock.png',
      reward: 25,
      currency: "Coins",
      frequency: 'Once/per season',
      skill: 'Optimization',
      id: 'reel-task',
      product: 'Common'
    });

    // 2. Product-Specific Tickets (Corrected Reward: 20 Swago Dollars)
    purchasedBoxes.forEach((boxName) => {
      allQuests.push({
        title: `${boxName} Lucky Ticket`,
        description: `Treasure draw entry for your ${boxName}.`,
        tags: [
          { name: 'Ticket', color: 'bg-[#FDE047]', icon: TicketIcon },
          { name: boxName, color: 'bg-[#A7F3D0]', icon: Package }
        ],
        image: '/images/test/quest_treasure.png',
        reward: 20,
        currency: "Swago Dollars",
        frequency: 'Once/per box',
        skill: 'Luck',
        id: `lottery-${boxName}`,
        product: boxName
      });
    });

    if (activeFilter === "All") return allQuests;
    return allQuests.filter(q => q.product === activeFilter || (activeFilter === "Common" && q.product === "Common"));
  }, [activeFilter, purchasedBoxes]);

  const handleKidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingKid(true);
    setKidError("");
    try {
      const res = await fetch("/api/kid-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...kidForm, age: parseInt(kidForm.age) }),
      });
      if (res.ok) router.push("/kids/dashboard");
    } catch (err) {
      setKidError("An error occurred");
    } finally {
      setIsCreatingKid(false);
    }
  };

  const handleKidFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let nextForm = { ...kidForm, [name]: value };
    if (name === "dob" && value) {
      const age = Math.floor((new Date().getTime() - new Date(value).getTime()) / 31557600000);
      nextForm.age = Math.max(0, age).toString();
    }
    setKidForm(nextForm);
  };

  if (isLoadingUser || (loadingProfiles && kidProfiles.length === 0)) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!user) return null;

  // ONBOARDING VIEW
  if (isOnboarding && kidProfiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] py-8 px-6 flex items-center justify-center font-sans">
        <div className="max-w-xl w-full">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-white relative overflow-hidden">
            <h2 className="text-3xl font-[1000] text-[#1A1F2C] uppercase italic mb-8 text-center tracking-tighter leading-none">Create Hero</h2>
            <form onSubmit={handleKidSubmit} className="space-y-6">
              <input type="text" name="city" value={kidForm.city} onChange={handleKidFormChange} placeholder="Enter City" className="w-full bg-[#F8FAFC] border-2 border-[#F1F5F9] rounded-[1.5rem] p-4 font-black outline-none focus:border-indigo-400" required />
              <input type="text" name="name" value={kidForm.name} onChange={handleKidFormChange} placeholder="Hero Name" className="w-full bg-[#F8FAFC] border-2 border-[#F1F5F9] rounded-[1.5rem] p-4 font-black outline-none focus:border-indigo-400" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" name="dob" value={kidForm.dob} onChange={handleKidFormChange} className="w-full bg-[#F8FAFC] border-2 border-[#F1F5F9] rounded-[1.5rem] p-4 font-black outline-none" required />
                <input type="text" value={kidForm.age} readOnly className="bg-slate-100 rounded-[1.5rem] p-4 font-black text-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setKidForm(prev => ({ ...prev, gender: 'boy', avatarColor: '/images/kid_boy1.png' }))} className={`p-6 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-3 ${kidForm.gender === 'boy' ? 'border-indigo-500 bg-indigo-50 shadow-xl' : 'border-slate-50 opacity-40 grayscale'}`}>
                   <div className="relative w-20 h-20 rounded-full border-2 border-white overflow-hidden shadow-md"><Image src="/images/kid_boy1.png" alt="Boy" fill className="object-cover" /></div>
                   <span className="font-black uppercase tracking-widest text-[9px]">Awesome Boy</span>
                </button>
                <button type="button" onClick={() => setKidForm(prev => ({ ...prev, gender: 'girl', avatarColor: '/images/kid_girl1.png' }))} className={`p-6 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-3 ${kidForm.gender === 'girl' ? 'border-pink-500 bg-pink-50 shadow-xl' : 'border-slate-50 opacity-40 grayscale'}`}>
                   <div className="relative w-20 h-20 rounded-full border-2 border-white overflow-hidden shadow-md"><Image src="/images/kid_girl1.png" alt="Girl" fill className="object-cover" /></div>
                   <span className="font-black uppercase tracking-widest text-[9px]">Amazing Girl</span>
                </button>
              </div>
              <button type="submit" disabled={isCreatingKid} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-[1000] text-xl uppercase italic shadow-lg">🚀 Enter Swagoverse</button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // MAIN PROFILE VIEW (REDUCED VERTICAL SPACE & UPDATED HEADER)
  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans pb-10">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        
        {/* Updated Header: Parent Info */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 relative">
               <Image 
                 src={kidProfiles[0]?.avatarColor || "/images/swoo.png"} 
                 alt="Avatar" 
                 fill 
                 className="object-cover"
               />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-[1000] text-slate-800 tracking-tighter uppercase italic leading-none">
                {user.name}
              </h1>
              <p className="text-slate-400 font-bold text-xs sm:text-sm tracking-tight opacity-80">
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-full shadow-lg border border-white">
             <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
               <span className="text-lg">🪙</span>
             </div>
             <span className="text-xl sm:text-2xl font-[1000] text-slate-800 tracking-tighter">
               {user.swagoMoney || 0}
             </span>
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-white rounded-[2.5rem] shadow-md border border-white/60 p-6 sm:p-8 mb-8">
           <h3 className="text-xs font-[1000] text-slate-300 uppercase tracking-widest italic mb-6">Skills Hub</h3>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#4ADE80] text-white px-5 py-3 rounded-xl flex items-center gap-2 text-xs font-[1000] shadow-sm uppercase italic">
                 <Star className="w-4 h-4" /> Growth
              </div>
              <div className="bg-[#818CF8] text-white px-5 py-3 rounded-xl flex items-center gap-2 text-xs font-[1000] shadow-sm uppercase italic">
                 <Zap className="w-4 h-4" /> Optimization
              </div>
              <div className="bg-[#FDBA74] text-white px-5 py-3 rounded-xl flex items-center gap-2 text-xs font-[1000] shadow-sm uppercase italic">
                 <Brain className="w-4 h-4" /> Willpower
              </div>
              <div className="bg-[#FDE047] text-[#854D0E] px-5 py-3 rounded-xl flex items-center gap-2 text-xs font-[1000] shadow-sm uppercase italic">
                 <Target className="w-4 h-4" /> Ambition
              </div>
           </div>
        </div>

        {/* Tasks Hub Section */}
        <div className="bg-white rounded-[3rem] shadow-lg border border-white p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-50">
            <h2 className="text-2xl font-[1000] text-slate-800 uppercase italic tracking-tighter leading-none underline decoration-indigo-500/10 decoration-4 underline-offset-4">Tasks Hub</h2>
            <div className="relative">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 shadow-sm"
              >
                 {activeFilter} <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-1">
                     {["All", "Common", ...purchasedBoxes].map(f => (
                       <button key={f} onClick={() => { setActiveFilter(f); setShowFilters(false); }} className={`w-full text-left px-5 py-2 font-black text-[9px] uppercase hover:bg-slate-50 transition-colors ${activeFilter === f ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>{f}</button>
                     ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4">
              {filteredQuests.map((quest) => (
                  <motion.div key={quest.id} initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm flex items-center gap-6 group hover:shadow-xl hover:border-indigo-100 transition-all">
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden shadow-lg border-2 border-white group-hover:scale-105 transition-transform">
                          <Image src={quest.image} alt={quest.title} fill className="object-cover" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-row items-center gap-1.5 overflow-hidden">
                              {quest.tags.map((tag, j) => (
                                  <div key={j} className={`${tag.color} text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest shadow-sm whitespace-nowrap`}>
                                      <tag.icon className="w-3 h-3" strokeWidth={4} /> {tag.name}
                                  </div>
                              ))}
                          </div>
                          
                          <h3 className="text-xl sm:text-2xl font-[1000] text-slate-800 leading-tight tracking-tight uppercase italic truncate">{quest.title}</h3>
                          <p className="text-[11px] font-bold text-slate-400 truncate opacity-90">{quest.description}</p>
                          
                          <div className="flex items-center gap-5">
                              <div className="flex items-center gap-2">
                                  <span className="text-lg">🪙</span>
                                  <span className="text-sm font-[1000] text-slate-700">+{quest.reward} {quest.currency}</span>
                              </div>
                              <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">{quest.frequency}</span>
                              <span className="text-[9px] font-black text-slate-300 uppercase italic">Skill: {quest.skill}</span>
                          </div>
                      </div>

                      <div className="shrink-0 pr-2">
                          <button onClick={() => { if (quest.id === 'reel-task') setShowReelForm(true); else router.push('/lottery-code'); }} className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white px-8 py-3 rounded-full text-sm font-[1000] shadow-md hover:scale-110 active:scale-95 transition-all uppercase italic">
                              Start
                          </button>
                      </div>
                  </motion.div>
              ))}
          </div>
        </div>
      </div>

      {/* Reel Modal */}
      <AnimatePresence>
        {showReelForm && kidProfiles.length > 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }} className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl relative">
              <button onClick={() => setShowReelForm(false)} className="absolute top-6 right-6 font-bold text-slate-400 hover:text-slate-800">✕</button>
              <div className="p-10"><ReelUploadForm kidProfileId={kidProfiles[0]._id} onSuccess={() => { setShowReelForm(false); fetchKidProfiles(); }} /></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
