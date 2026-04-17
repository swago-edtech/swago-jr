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
  Rocket,
  Ticket as TicketIcon
} from "lucide-react";
import ReelUploadForm from "@/components/ReelUploadForm";

const UI_THEMES = [
  { base: 'bg-[#b251a2]', ring: 'ring-[#b251a2]/30', hover: 'hover:bg-[#b251a2]/15 hover:text-[#b251a2]' },
  { base: 'bg-[#7bc4c3]', ring: 'ring-[#7bc4c3]/30', hover: 'hover:bg-[#7bc4c3]/15 hover:text-[#7bc4c3]' },
  { base: 'bg-[#568dca]', ring: 'ring-[#568dca]/30', hover: 'hover:bg-[#568dca]/15 hover:text-[#568dca]' },
  { base: 'bg-[#e0914c]', ring: 'ring-[#e0914c]/30', hover: 'hover:bg-[#e0914c]/15 hover:text-[#e0914c]' },
  { base: 'bg-[#7464a9]', ring: 'ring-[#7464a9]/30', hover: 'hover:bg-[#7464a9]/15 hover:text-[#7464a9]' },
];

const getLevelData = (points: number) => {
  if (points <= 100) return { level: 1, title: 'Swago Saviour', min: 0, max: 100 };
  if (points <= 200) return { level: 2, title: 'Swago Seeker', min: 100, max: 200 };
  if (points <= 350) return { level: 3, title: 'Swago Striker', min: 200, max: 350 };
  if (points < 500) return { level: 4, title: 'Swago Star', min: 350, max: 500 };
  return { level: 5, title: 'Swago Ambassador', min: 500, max: 500, maxed: true };
};

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


export default function KidDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SelectedKidProfile | null>(null);
  const [ambassadorData, setAmbassadorData] = useState<AmbassadorData | null>(null);
  const [user, setUser] = useState<{ _id: string, name?: string, email?: string, orders?: any[], swagoMoney?: number } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
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
        if (data.user?.swagoMoney !== undefined) {
          setWalletBalance(data.user.swagoMoney);
        }
        fetch('/api/wallet/balance')
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setWalletBalance(data.totalSwagoMoney || 0);
            }
          })
          .catch(console.error);

        if (data.user?.orders) {
          // Logic handled in useMemo
        }
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const purchasedProducts = useMemo(() => {
    if (!user?.orders) return [];
    const productsMap = new Map<string, { name: string, image: string }>();
    user.orders.forEach((order: any) => {
      const status = (order.status || '').toLowerCase().trim();
      const validStatuses = ['paid', 'delivered', 'shipped', 'completed'];

      if (validStatuses.includes(status)) {
        order.items?.forEach((item: any) => {
          if (item.name && !productsMap.has(item.name)) {
            productsMap.set(item.name, {
              name: item.name,
              image: item.image || '/images/placeholder.png'
            });
          }
        });
      }
    });
    return Array.from(productsMap.values());
  }, [user?.orders]);

  const purchasedBoxes = useMemo(() => purchasedProducts.map(p => p.name), [purchasedProducts]);

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
    purchasedBoxes.forEach((boxName) => {
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

    // ✅ FIXED FILTER LOGIC: Support both Product and Skill filtering (SWAGO)
    if (selectedProduct === "All") return allQuests;
    if (selectedProduct === "Common") return allQuests.filter(q => q.product === "Common");

    // Check if filtering by Skill (S-W-A-G-O)
    const skillsList = ["Smart", "Wisdom", "Ambition", "Growth", "Optimization"];
    if (skillsList.includes(selectedProduct)) {
      return allQuests.filter(q => q.skill === selectedProduct);
    }

    // Default: Filter by Product
    return allQuests.filter((q) => q.product === selectedProduct || q.product === "Common");
  }, [router, purchasedBoxes, selectedProduct]);

  if (loading || !profile) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-10 font-sans">
      <div className="max-w-4xl mx-auto px-4 pt-8">

        {/* Header - Kid Info & Level */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-5 flex-1 w-full xl:max-w-xl">
            <button
              onClick={handleSwitchProfile}
              className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 relative group transition-transform hover:scale-105"
            >
              <Image
                src={profile.avatarColor && profile.avatarColor !== '/images/swoo.png' ? profile.avatarColor : '/images/kid_boy1.png'}
                alt={profile.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </button>
            <div className="space-y-0.5 flex-1 min-w-0 pr-4 sm:pr-8">
              <h1 className="text-2xl sm:text-3xl font-[1000] text-slate-800 tracking-tighter uppercase italic leading-none truncate">
                {profile.name}
              </h1>
              {(() => {
                const currentPoints = walletBalance !== null ? walletBalance : (user?.swagoMoney || 0);
                const { level, title, min, max, maxed } = getLevelData(currentPoints);
                const progressPercent = maxed ? 100 : Math.min(100, Math.max(0, ((currentPoints - min) / (max - min)) * 100));

                return (
                  <div className="pt-2 w-full">
                    <div className="flex items-center justify-between">
                      <p className="text-slate-500 font-medium text-sm sm:text-base leading-none">{title}</p>
                      <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-2 md:px-5 md:py-3 py-1 rounded-full shadow-lg border border-white block md:hidden">
                        <div className="w-4.5 h-4.5 sm:w-9 sm:h-9 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                          <span className="md:text-lg text-xs">🪙</span>
                        </div>
                        <span className="md:text-xl text-sm font-[1000] text-slate-800 tracking-tighter">
                          {walletBalance !== null ? walletBalance : (user?.swagoMoney || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 md:gap-3 w-full">
                      <span className="text-[9px] sm:text-xs font-[1000] text-slate-400 whitespace-nowrap">Lvl {level}</span>
                      <div className="flex-1 h-3 sm:h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner w-full min-w-[200px]">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000 rounded-full relative"
                          style={{ width: `${progressPercent}%` }}
                        >
                          <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 rounded-full"></div>
                        </div>
                      </div>
                      <span className="text-[9px] sm:text-xs font-[1000] text-slate-400 whitespace-nowrap">{max}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-2 md:px-5 md:py-3 py-1 rounded-full shadow-lg border border-white hidden md:block">
            <div className="w-4.5 h-4.5 sm:w-9 sm:h-9 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <span className="md:text-lg text-xs">🪙</span>
            </div>
            <span className="md:text-xl text-sm font-[1000] text-slate-800 tracking-tighter">
              {walletBalance !== null ? walletBalance : (user?.swagoMoney || 0)}
            </span>
          </div>
        </div>

        {/* Skills Hub - Previously Ambassador Hub */}
        <div className="bg-white rounded-[2rem] shadow-md border border-white/60 p-3 sm:p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-[1000] text-slate-800 uppercase tracking-widest italic">Skills Hub</h3>
            {selectedProduct !== "All" && (
              <button
                onClick={() => setSelectedProduct("All")}
                className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter hover:underline"
              >
                Clear Filter ✕
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {purchasedProducts.length > 0 ? (
              purchasedProducts.map((product, idx) => {
                const theme = UI_THEMES[idx % UI_THEMES.length];
                const isActive = selectedProduct === product.name;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedProduct(isActive ? "All" : product.name)}
                    className={`px-1.5 py-1.5 md:px-2 md:py-2 rounded-xl flex items-center justify-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-[1000] shadow-sm uppercase italic transition-all active:scale-95 ${isActive ? `${theme.base} text-white shadow-lg ring-4 ${theme.ring} border border-transparent hover:brightness-95` : `bg-slate-50 text-slate-500 ${theme.hover} border border-slate-100 hover:border-transparent`
                      }`}
                  >
                    <div className="w-6 h-6 md:w-8 md:h-8 relative rounded-md overflow-hidden shrink-0 border border-slate-100/50 shadow-sm">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                    <span className="truncate">{product.name}</span>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full py-3 md:py-5 text-center text-slate-400 font-bold text-xs italic bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                No items in your collection yet.
              </div>
            )}
          </div>
        </div>

        {/* Tasks Hub - Previously Quest Log */}
        <div className="bg-white rounded-[2rem] shadow-lg border border-white p-4 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-50">
            <h2 className="text-xl md:text-2xl font-[1000] text-slate-800 uppercase italic tracking-tighter leading-none underline decoration-indigo-500/10 decoration-4 underline-offset-4">Tasks Hub</h2>
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-slate-50 px-2 md:px-4 py-1 md:py-2 rounded-xl border border-slate-100 text-slate-400 font-black text-[10px] uppercase flex items-center gap-2 shadow-sm"
              >
                {selectedProduct} <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-1">
                    {["All", "Common", ...purchasedBoxes].map(f => (
                      <button key={f} onClick={() => { setSelectedProduct(f); setShowFilters(false); }} className={`w-full text-left px-5 py-2 font-black text-[9px] uppercase hover:bg-slate-50 transition-colors ${selectedProduct === f ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>{f}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4">
            {quests.map((quest) => (
              <motion.div key={quest.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white border border-slate-100 rounded-[2rem] p-4 sm:p-5 flex flex-col gap-4 group transition-all overflow-hidden relative shadow-md hover:shadow-xl hover:border-indigo-100">

                {/* Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {quest.tags.map((tag: any, idx: number) => {
                    const Icon = tag.icon;
                    return (
                      <div key={idx} className={`${tag.color} text-white px-3 py-1.5 rounded-l-xl rounded-r-lg flex items-center gap-1.5 shadow-sm`}>
                        {Icon && <Icon className="w-3 h-3" />}
                        <span className="text-[10px] font-bold truncate max-w-[90px] sm:max-w-none">{tag.name}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Content Row */}
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden shadow-lg border-2 border-white group-hover:scale-105 transition-transform duration-500">
                    <Image src={quest.image} alt={quest.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 py-1 space-y-1">
                    <h3 className="text-[15px] sm:text-[17px] font-[1000] text-slate-800 leading-snug">{quest.title}</h3>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug">{quest.description}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">🪙</span>
                        <span className="text-[11px] sm:text-xs font-[1000] text-slate-700">+{quest.reward} {quest.currency}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{quest.frequency}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-500">
                    {quest.product !== 'Common' ? 'Box: ' : 'Skill: '}
                    <span className="font-[1000] text-slate-700">{quest.product !== 'Common' ? quest.product : quest.skill}</span>
                  </p>
                  <button onClick={quest.action} className={`px-6 sm:px-8 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-[1000] active:scale-95 transition-all text-center tracking-wide ${quest.product !== 'Common' ? 'bg-[#EBFAED] text-[#2CB065] hover:bg-[#D5F5D8]' : 'bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white'}`}>
                    {quest.product !== 'Common' ? 'Claim' : 'Start'}
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
