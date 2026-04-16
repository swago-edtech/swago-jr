"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Coins,
  Target,
  Zap,
  Flame,
  Brain,
  Star,
  Play,
  RotateCcw,
  Plus,
  Package,
  Layers,
  Ticket as TicketIcon
} from "lucide-react";
import ReelUploadForm from "@/components/ReelUploadForm";

type SelectedKidProfile = {
  _id: string;
  name: string;
  age: number;
  avatarColor: string;
};

type AmbassadorData = {
  isAmbassador: boolean;
  status: string;
  swagoMoney: number;
  badges: { name: string; awardedAt: string }[];
  currentStep: number;
  entryChallenge: {
    submitted: boolean;
    status: string;
    reelUrl?: string;
  };
};

const TAGS = [
  { name: "Growth", color: "bg-[#4ADE80]", textColor: "text-white", icon: Star },
  { name: "Optimization", color: "bg-[#818CF8]", textColor: "text-white", icon: Zap },
  { name: "Willpower", color: "bg-[#FDBA74]", textColor: "text-white", icon: Brain },
  { name: "Ambition", color: "bg-[#FDE047]", textColor: "text-slate-700", icon: Target },
];

export default function KidDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SelectedKidProfile | null>(null);
  const [ambassadorData, setAmbassadorData] = useState<AmbassadorData | null>(null);
  const [user, setUser] = useState<{ _id: string, name?: string, email?: string, orders?: any[], swagoMoney?: number } | null>(null);
  const [purchasedProducts, setPurchasedProducts] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReelForm, setShowReelForm] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem("selectedKidProfile");
    fetchUserInfo();
    if (!savedProfile) {
      checkUserProfilePresence();
    } else {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      fetchProfileData(parsed._id);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        if (data.user?.orders) {
          const products = new Set<string>();
          data.user.orders.forEach((order: any) => {
            if (['Paid', 'Delivered', 'Shipped', 'Completed'].includes(order.status)) {
              order.items?.forEach((item: any) => {
                if (item.name) products.add(item.name);
              });
            }
          });
          setPurchasedProducts(Array.from(products));
        }
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const checkUserProfilePresence = async () => {
    try {
      const res = await fetch("/api/kid-profiles");
      if (res.ok) {
        const data = await res.json();
        if (data.profiles && data.profiles.length > 0) {
          router.push("/kids");
        } else {
          router.push("/profile?mode=create");
        }
      } else {
        router.push("/login?redirect=/kids/dashboard");
      }
    } catch (error) {
      console.error("Failed to check profiles:", error);
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileData = async (profileId: string) => {
    try {
      const res = await fetch(`/api/kid-profiles/${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setAmbassadorData(data.profile.ambassador || null);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchProfile = () => {
    localStorage.removeItem("selectedKidProfile");
    router.push("/kids");
  };

  const quests = useMemo(() => {
    let allQuests = [];

    // 1. Common Mission
    allQuests.push({
      id: "reel",
      title: "Focus Freeze Reel",
      description: "Create a \"Yes I Can\" pose with your box",
      reward: 25,
      currency: "Coins",
      frequency: "Once/per season",
      skill: "Optimization",
      tags: [
        { name: "Optimization", color: "bg-[#818CF8]", icon: Zap },
        { name: "Spotlight", color: "bg-[#4ADE80]", icon: Star }
      ],
      image: "/images/test/quest_ice_clock.png",
      action: () => setShowReelForm(true),
      product: "Common"
    });

    // 2. Product-Specific Tickets
    purchasedProducts.forEach((boxName) => {
      allQuests.push({
        id: `lottery-${boxName}`,
        title: `${boxName} Lucky Ticket`,
        description: `Treasure draw entry for your ${boxName}.`,
        reward: 20,
        currency: "SD",
        frequency: "Once/per box",
        skill: "Luck",
        tags: [
          { name: "Ticket", color: "bg-[#FDE047]", icon: TicketIcon },
          { name: boxName, color: "bg-[#A7F3D0]", icon: Package }
        ],
        image: "/images/test/quest_treasure.png",
        action: () => router.push("/lottery-code"),
        product: boxName
      });
    });

    // ✅ FIXED FILTER LOGIC: Show Common missions + Selected product missions
    if (selectedProduct === "All") return allQuests;
    if (selectedProduct === "Common") return allQuests.filter(q => q.product === "Common");
    return allQuests.filter((q) => q.product === selectedProduct || q.product === "Common");
  }, [router, purchasedProducts, selectedProduct]);

  if (loading || !profile) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-10 font-sans">
      <div className="max-w-4xl mx-auto px-4 pt-8">

        {/* Header - Parent Info */}
        <div className="flex items-center justify-between gap-6 mb-8 px-2">
          <div className="flex items-center gap-5">
            <button
              onClick={handleSwitchProfile}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 relative group transition-transform hover:scale-105"
            >
              <Image src={profile.avatarColor || "/images/swoo.png"} alt={profile.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"><RotateCcw className="w-8 h-8" /></div>
            </button>
            <div className="space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-[1000] text-slate-800 tracking-tighter uppercase italic leading-none">{user?.name}</h1>
              <p className="text-slate-400 font-bold text-xs sm:text-sm tracking-tight opacity-80">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-full shadow-lg border border-white">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <Coins className="w-5 h-5 text-amber-900" strokeWidth={3} />
            </div>
            <span className="text-xl sm:text-2xl font-[1000] text-slate-800 tracking-tighter">{user?.swagoMoney || 0}</span>
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-white rounded-[2.5rem] shadow-md border border-white/60 p-6 sm:p-8 mb-8">
          <h3 className="text-xs font-[1000] text-slate-300 tracking-widest italic mb-6">Ambassador Hub</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TAGS.map((tag, i) => (
              <div key={i} className={`${tag.color} ${tag.textColor} px-5 py-3 rounded-xl flex items-center gap-2 text-xs font-[1000] shadow-sm uppercase italic`}>
                <tag.icon className="w-4 h-4" strokeWidth={3} /> {tag.name}
              </div>
            ))}
          </div>
        </div>

        {/* Quest Log Container */}
        <div className="bg-white rounded-[3rem] shadow-lg border border-white p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between pb-2 border-b-2 border-slate-50">
            <h2 className="text-2xl font-[1000] text-slate-800 tracking-tighter uppercase italic underline decoration-blue-500/10 decoration-4 underline-offset-4">Quest Log</h2>

            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-slate-100 transition-all"
              >
                <span className="truncate">{selectedProduct === "All" ? "All Tasks" : selectedProduct}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-[calc(100%+8px)] w-44 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-1 px-1"
                  >
                    <button onClick={() => { setSelectedProduct("All"); setShowFilters(false); }} className={`w-full text-left px-4 py-2 font-black text-[9px] uppercase hover:bg-slate-50 rounded-xl transition-all ${selectedProduct === "All" ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>All Tasks</button>
                    <button onClick={() => { setSelectedProduct("Common"); setShowFilters(false); }} className={`w-full text-left px-4 py-2 font-black text-[9px] uppercase hover:bg-slate-50 rounded-xl transition-all ${selectedProduct === "Common" ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>Common</button>
                    {purchasedProducts.map(name => (
                      <button key={name} onClick={() => { setSelectedProduct(name); setShowFilters(false); }} className={`w-full text-left px-4 py-2 font-black text-[9px] uppercase hover:bg-slate-50 rounded-xl transition-all ${selectedProduct === name ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}>{name}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {quests.map((quest, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-white border border-slate-50 p-5 rounded-[2rem] shadow-sm flex items-center gap-6 group hover:shadow-xl hover:border-blue-100 transition-all duration-300">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden shadow-lg border-2 border-white group-hover:scale-105 transition-transform">
                  <Image src={quest.image} alt={quest.title} fill className="object-cover" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-row items-center gap-1.5 overflow-hidden">
                    {quest.tags.map((tag, j) => (
                      <div key={j} className={`${tag.color} text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest shadow-sm whitespace-nowrap`}>
                        <tag.icon className="w-3 h-3" strokeWidth={4} /> {tag.name}
                      </div>
                    ))}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-[1000] text-slate-800 tracking-tight leading-tight uppercase italic truncate">{quest.title}</h3>
                  <p className="text-[11px] font-bold text-slate-400 truncate opacity-80">{quest.description}</p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🪙</span>
                      <span className="text-sm font-[1000] text-slate-700">+{quest.reward} {quest.currency}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">{quest.frequency}</span>
                    <span className="text-[9px] font-black text-slate-300 uppercase italic">Skill: {quest.skill}</span>
                  </div>
                </div>

                <div className="shrink-0 pr-2">
                  <button
                    onClick={quest.action}
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white px-8 py-3 rounded-full text-sm font-[1000] shadow-md hover:scale-110 active:scale-95 transition-all uppercase italic"
                  >
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
        {showReelForm && profile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl relative">
              <button
                onClick={() => setShowReelForm(false)}
                className="absolute top-6 right-6 font-bold text-slate-400 hover:text-slate-800"
              >✕</button>
              <div className="p-10"><ReelUploadForm kidProfileId={profile._id} onSuccess={() => { setShowReelForm(false); fetchProfileData(profile._id); }} /></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
