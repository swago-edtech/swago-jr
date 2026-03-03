"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSharedContext, USER_EVENTS } from "@/context/SharedContext";
import KidProfileDate from './KidProfileDate';
import {
  ChevronDown,
  Zap,
  Brain,
  Flame,
  Target,
  Flag,
  Ticket as TicketIcon,
  Plus,
  Coins,
  Trophy,
  Activity,
  Award,
  Star,
  Zap as ZapIcon
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Zap: ZapIcon,
  Target: Target,
  Flame: Flame,
  Brain: Brain,
  Flag: Flag,
  Ticket: TicketIcon,
  Trophy: Trophy,
  Activity: Activity,
  Award: Award,
  Star: Star
};
import { motion } from 'framer-motion';

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
    title: 'Focus Freeze Reel',
    description: 'Create a "Yes I Can" freeze pose with your Seek Rush box',
    tags: [
      { name: 'Optimization', color: 'bg-[#818CF8]', icon: Zap },
      { name: 'Spotlight', color: 'bg-[#34D399]', icon: Target },
    ],
    image: '/images/test/quest_ice_clock.png',
    reward: 50,
    frequency: 'Once per season',
    skill: 'Optimization'
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

type KidProfile = {
  _id: string;
  name: string;
  age: number;
  avatarColor: string;
  createdAt: string;
  ambassador?: {
    swagoMoney: number;
  };
  lotteryTickets?: {
    _id: string;
    productName: string;
    productId: string;
    ticketType: string;
  }[];
};

type Quest = {
  _id: string;
  title: string;
  description: string;
  image: string;
  reward: number;
  frequency: string;
  productId: {
    _id: string;
    name: string;
  };
  tags: { name: string; color: string; iconName: string }[];
};

export default function ProfilePage() {
  const { user, setUser, isLoadingUser } = useSharedContext();
  const router = useRouter();
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>("All");
  const [questProgress, setQuestProgress] = useState(35); // Mockup progress
  const [quests, setQuests] = useState<Quest[]>([]);

  // Parent edit state
  const [isEditingParent, setIsEditingParent] = useState(false);
  const [savingParent, setSavingParent] = useState(false);
  const [parentForm, setParentForm] = useState({
    name: "",
    email: "",
    address: "",
  });
  const [parentError, setParentError] = useState("");

  useEffect(() => {
    // Wait for user loading to complete
    if (isLoadingUser) return;

    if (!user) {
      router.push("/login?redirect=/profile");
    } else {
      // Initialize parent form with existing data
      setParentForm({
        name: user.name || "",
        email: user.email || "",
        address: user.address || "",
      });
      fetchKidProfiles();
    }
  }, [user, isLoadingUser, router]);

  const fetchKidProfiles = async () => {
    try {
      const res = await fetch("/api/kid-profiles");
      if (res.ok) {
        const data = await res.json();
        const profiles = data.profiles || [];
        setKidProfiles(profiles);

        // Fetch quests for the first kid if exists
        if (profiles.length > 0) {
          fetchQuests(profiles[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch kid profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuests = async (kidId: string) => {
    try {
      const res = await fetch(`/api/quests?kidId=${kidId}`);
      const data = await res.json();
      if (data.success) {
        setQuests(data.quests);
      }
    } catch (error) {
      console.error("Failed to fetch quests:", error);
    }
  };

  // ✅ Logout handler (same logic as Navbar)
  const handleLogout = async () => {
    window.dispatchEvent(new CustomEvent(USER_EVENTS.LOGOUT));
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingParent(true);
    setParentError("");

    try {
      const res = await fetch("/api/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentForm),
      });

      const data = await res.json();

      if (res.ok) {
        // Update the user in context
        setUser({
          ...user!,
          name: parentForm.name,
          email: parentForm.email,
          address: parentForm.address,
        });

        // Trigger profile update event to refresh cached data
        window.dispatchEvent(new CustomEvent(USER_EVENTS.PROFILE_UPDATE));

        setIsEditingParent(false);
      } else {
        setParentError(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      setParentError("An error occurred while updating");
    } finally {
      setSavingParent(false);
    }
  };

  const handleDelete = async (kidId: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;

    try {
      const res = await fetch(`/api/kid-profiles/${kidId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setKidProfiles(prev => prev.filter(p => p._id !== kidId));
      } else {
        alert("Failed to delete profile. Please try again.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the profile.");
    }
  };

  if (isLoadingUser || loading) {
    return <p className="text-center p-12">Loading profile...</p>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ✅ Header with Logout Button */}
      {/* ✅ Header with Logout Button - Mobile & Desktop */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <button
          onClick={handleLogout}
          className="text-white bg-[hsl(var(--swago-orange))] hover:opacity-90 px-4 sm:px-6 py-2 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base whitespace-nowrap"
        >
          Logout
        </button>
      </div>


      {/* Swago Wallet Summary Card */}
      <div className="bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-purple))]/80 p-6 rounded-2xl shadow-lg border-2 border-white/20 mb-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h2 className="text-xl font-bold opacity-90">Swago Wallet</h2>
              <p className="text-sm opacity-75">Your closed-loop reward currency</p>
            </div>
          </div>

          <div className="bg-white/10 px-8 py-4 rounded-3xl backdrop-blur-md border border-white/20 text-center md:text-right">
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Total Balance</p>
            <div className="flex items-center justify-center md:justify-end gap-2">
              <span className="text-3xl font-black text-[hsl(var(--swago-orange))]">
                {kidProfiles.reduce((acc, kid) => acc + (kid.ambassador?.swagoMoney || 0), 0)}
              </span>
              <span className="text-lg font-bold">SD</span>
            </div>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[hsl(var(--swago-orange))]/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
      </div>

      {/* Parent Info Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Parent Information</h2>
          {!isEditingParent && (
            <button
              onClick={() => setIsEditingParent(true)}
              className="text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {isEditingParent ? (
          <form onSubmit={handleParentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="parent-name" className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  id="parent-name"
                  name="name"
                  value={parentForm.name}
                  onChange={(e) => setParentForm({ ...parentForm, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full border border-slate-300 rounded-md p-2"
                />
              </div>
              <div>
                <label htmlFor="parent-email" className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  id="parent-email"
                  name="email"
                  value={parentForm.email}
                  onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full border border-slate-300 rounded-md p-2"
                />
              </div>
              <div>
                <label htmlFor="parent-phone" className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  id="parent-phone"
                  name="phone"
                  value={user.phone}
                  disabled
                  className="w-full border border-slate-200 rounded-md p-2 bg-slate-50"
                />
              </div>
              <div>
                <label htmlFor="parent-address" className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  id="parent-address"
                  name="address"
                  value={parentForm.address}
                  onChange={(e) => setParentForm({ ...parentForm, address: e.target.value })}
                  placeholder="Your address"
                  className="w-full border border-slate-300 rounded-md p-2"
                />
              </div>
            </div>

            {parentError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {parentError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingParent(false);
                  setParentForm({
                    name: user.name || "",
                    email: user.email || "",
                    address: user.address || "",
                  });
                  setParentError("");
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingParent}
                className="px-4 py-2 bg-[hsl(var(--swago-purple))] text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
              >
                {savingParent ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Name</p>
              <p className="font-medium">{user.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="font-medium">{user.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium">{user.email || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="font-medium">{user.address || "Not set"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Kid Profiles Section - Mockup Integrated */}
      <div className="space-y-10">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Kid Experience</h2>
          {kidProfiles.length < 2 && (
            <Link
              href="/profile/kids/new"
              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 font-bold text-sm transition-all"
            >
              + Add Kid
            </Link>
          )}
        </div>

        {kidProfiles.length === 0 ? (
          <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-[32px]">
            <div className="text-6xl mb-6">👶</div>
            <p className="text-xl font-bold text-slate-800 mb-2">No kid profiles yet</p>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              Create a profile to unlock quests, activities, and the Swago Ambassador Program!
            </p>
            <Link
              href="/profile/kids/new"
              className="inline-block bg-[hsl(var(--swago-purple))] text-white px-10 py-4 rounded-2xl hover:opacity-90 font-black shadow-lg shadow-purple-200 transition-all"
            >
              Create First Profile
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active Kid Profile Header - Responsive Fix */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-slate-50 relative overflow-hidden group gap-6">
              <div className="flex flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full border-[4px] sm:border-[6px] border-white shadow-xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  <Image
                    src={kidProfiles[0].avatarColor?.startsWith('/') ? kidProfiles[0].avatarColor : "/images/test/aarav_avatar.png"}
                    alt={kidProfiles[0].name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl sm:text-4xl font-[1000] text-slate-800 tracking-tighter uppercase italic truncate">{kidProfiles[0].name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="bg-blue-50 text-blue-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Lvl 12 Explorer</span>
                    <span className="text-slate-300 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">{kidProfiles[0].age} Yrs</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Available Rewards</span>
                  <div className="flex items-center gap-2 bg-gradient-to-tr from-amber-500 to-yellow-300 pl-2 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full border-2 sm:border-4 border-white shadow-lg">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center">
                      <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" strokeWidth={4} />
                    </div>
                    <span className="text-xl sm:text-2xl font-[1000] text-amber-900 tracking-tighter">{kidProfiles[0].ambassador?.swagoMoney || 0}</span>
                  </div>
                </div>

                <Link
                  href={`/profile/kids/${kidProfiles[0]._id}/edit`}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100 shrink-0"
                >
                  <Plus className="w-4 h-4 sm:w-5 h-5 text-slate-400 rotate-45" strokeWidth={3} />
                </Link>
              </div>

              {/* Decorative background element from mockup */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
            </div>

            {/* Progress Bar Section (NEW) */}
            <div className="px-4 space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Progress</h4>
                  <p className="text-2xl font-[1000] text-slate-800 italic uppercase tracking-tighter">Level 12 <span className="text-purple-500">Explorer</span></p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-[1000] text-slate-700 italic">{questProgress}%</span>
                </div>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200/50 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${questProgress}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                />
              </div>
            </div>

            {/* Tags Section (REIMAGINED AS PRODUCT FILTERS) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[48px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] border border-slate-50 relative overflow-hidden"
            >
              <h2 className="text-lg font-black text-slate-400 mb-6 tracking-[0.1em] uppercase text-[11px] ml-1 opacity-80">My Products</h2>

              <div className="flex flex-wrap gap-4">
                {/* "All" Filter Button */}
                <div
                  onClick={() => setSelectedProduct("All")}
                  className={`${selectedProduct === "All" ? 'bg-[hsl(var(--swago-purple))] text-white shadow-lg shadow-purple-200 scale-105' : 'bg-slate-50 text-slate-400 border border-slate-100'} px-6 py-3 rounded-2xl flex items-center gap-2.5 text-base font-black transition-all cursor-pointer select-none`}
                >
                  <Target className="w-5 h-5" strokeWidth={3} />
                  Show All
                </div>

                {/* Derive unique products from tickets */}
                {Array.from(new Set(kidProfiles[0]?.lotteryTickets?.map(t => t.productName) || [])).map((productName, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedProduct(productName)}
                    className={`${selectedProduct === productName ? 'bg-[hsl(var(--swago-orange))] text-white shadow-lg shadow-orange-200 scale-105' : 'bg-slate-50 text-slate-400 border border-slate-100'} px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 text-sm sm:text-base font-black transition-all cursor-pointer select-none`}
                  >
                    <TicketIcon className="w-4 h-4 sm:w-5 h-5" strokeWidth={3} />
                    {productName}
                  </div>
                ))}

                {/* If no products, show a message */}
                {(!kidProfiles[0]?.lotteryTickets || kidProfiles[0].lotteryTickets.length === 0) && (
                  <p className="text-sm font-bold text-slate-300 italic px-2">Purchase a box to unlock product quests!</p>
                )}
              </div>
            </motion.div>

            {/* Quest Log (Filtered) */}
            <div className="space-y-8">
              <div className="flex items-center justify-between px-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-[1000] text-slate-800 tracking-tighter uppercase italic">{selectedProduct === 'All' ? 'Quest Log' : `${selectedProduct} Quests`}</h2>
                  <p className="text-base font-bold text-slate-400 tracking-tight opacity-90">Progress towards your next Swago Box reward!</p>
                </div>
                <div className="bg-slate-100/80 backdrop-blur px-6 py-2.5 rounded-2xl flex items-center gap-3 text-sm font-black text-slate-500 border border-slate-200/60 cursor-pointer hover:bg-slate-200 transition-all shadow-sm">
                  Filter: {selectedProduct} <ChevronDown className="w-4 h-4" strokeWidth={4} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {quests.length === 0 ? (
                  <div className="bg-white p-12 rounded-[48px] border-2 border-dashed border-slate-100 text-center">
                    <p className="text-slate-400 font-bold">No quests available for this product yet.</p>
                  </div>
                ) : quests
                  .filter(q => selectedProduct === "All" || q.productId.name === selectedProduct)
                  .map((quest, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ type: "spring", damping: 25, stiffness: 120, delay: i * 0.1 }}
                      className="bg-white p-5 sm:p-7 rounded-[32px] sm:rounded-[48px] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.15)] border border-slate-50 relative group overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                        {/* Left Product Image Area */}
                        <div className="relative w-full md:w-52 h-44 sm:h-52 shrink-0">
                          <div className="absolute inset-0 rounded-[24px] sm:rounded-[40px] overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-700">
                            <Image
                              src={quest.image}
                              alt={quest.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>

                        {/* Right Content Area */}
                        <div className="flex-1 flex flex-col pt-0 sm:pt-2 relative pb-16 sm:pb-0">
                          <div className="flex flex-wrap gap-2 mb-3 sm:mb-5">
                            {quest.tags.map((tag, j) => {
                              const TagIcon = ICON_MAP[tag.iconName] || Star;
                              return (
                                <div key={j} className={`${tag.color} text-white px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg`}>
                                  <TagIcon className="w-3 h-3 sm:w-3.5 h-3.5" strokeWidth={4} />
                                  {tag.name}
                                </div>
                              )
                            })}
                          </div>

                          <h3 className="text-xl sm:text-3xl font-[1000] text-slate-800 leading-tight mb-2 sm:mb-3 tracking-tighter group-hover:text-purple-600 transition-colors uppercase italic">{quest.title}</h3>
                          <p className="text-base sm:text-xl font-bold text-slate-500 leading-tight mb-4 sm:mb-6 opacity-80 max-w-lg">{quest.description}</p>

                          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2 sm:gap-3 bg-amber-50 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-amber-100">
                              <Coins className="w-4 h-4 sm:w-5 h-5 text-amber-500" strokeWidth={4} />
                              <span className="text-lg sm:text-2xl font-[1000] text-amber-900 tracking-tighter">+{quest.reward} SD</span>
                            </div>
                            <span className="text-xs sm:text-base font-black text-slate-300 uppercase tracking-widest">{quest.frequency}</span>
                          </div>

                          {/* Skill Badge at bottom */}
                          <div className="mt-4 sm:mt-8 flex items-center gap-2 sm:gap-3">
                            <div className="w-1.5 h-1.5 sm:w-2 h-2 rounded-full bg-purple-400"></div>
                            <span className="text-[10px] sm:text-sm font-black text-purple-400 uppercase tracking-[0.2em]">{quest.productId.name} Challenge</span>
                          </div>

                          {/* Start Button at Bottom Right - Fixed for Mobile */}
                          <div className="absolute right-0 bottom-0 sm:right-[-4px] sm:bottom-[-4px]">
                            <button className="bg-gradient-to-r from-[hsl(var(--swago-purple))] to-purple-600 text-white px-8 py-3.5 sm:px-14 sm:py-5 rounded-2xl sm:rounded-3xl text-base sm:text-2xl font-[1000] shadow-[0_15px_30px_-5px_rgba(118,74,255,0.3)] hover:shadow-[0_25px_50px_-10px_rgba(118,74,255,0.4)] hover:-translate-y-1 active:scale-95 transition-all uppercase italic">
                              Start
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {kidProfiles.length === 2 && (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <Image
                      src={kidProfiles[1].avatarColor?.startsWith('/') ? kidProfiles[1].avatarColor : "/images/swoo.png"}
                      alt={kidProfiles[1].name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{kidProfiles[1].name}'s Profile</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch to see their quests</p>
                  </div>
                </div>
                <Link
                  href={`/profile/kids/${kidProfiles[1]._id}/edit`}
                  className="bg-white px-4 py-2 rounded-xl text-xs font-black text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  View Profile
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
