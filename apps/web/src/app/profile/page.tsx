"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSharedContext, USER_EVENTS } from "@/context/SharedContext";
import KidProfileDate from './KidProfileDate';

type KidProfile = {
  _id: string;
  name: string;
  age: number;
  avatarColor: string;
  createdAt: string;
  ambassador?: {
    swagoMoney: number;
  };
};

export default function ProfilePage() {
  const { user, setUser, isLoadingUser } = useSharedContext();
  const router = useRouter();
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [loading, setLoading] = useState(true);

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
        setKidProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error("Failed to fetch kid profiles:", error);
    } finally {
      setLoading(false);
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

      {/* Kid Profiles Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Kid Profiles</h2>
          {kidProfiles.length < 2 && (
            <Link
              href="/profile/kids/new"
              className="bg-[hsl(var(--swago-purple))] text-white px-4 py-2 rounded-lg hover:opacity-90 font-medium"
            >
              + Add Kid Profile
            </Link>
          )}
        </div>

        {kidProfiles.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <div className="text-6xl mb-4">👶</div>
            <p className="text-slate-600 mb-4">No kid profiles yet</p>
            <p className="text-sm text-slate-500 mb-6">
              Create up to 2 kid profiles for games, activities, and the Ambassador Program
            </p>
            <Link
              href="/profile/kids/new"
              className="inline-block bg-[hsl(var(--swago-purple))] text-white px-6 py-3 rounded-lg hover:opacity-90 font-medium"
            >
              Create First Profile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kidProfiles.map((kid) => (
              <div
                key={kid._id}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Avatar with backward compatibility */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative flex-shrink-0">
                    {kid.avatarColor?.startsWith('#') ? (
                      // OLD DATA: Render colored circle
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: kid.avatarColor }}
                      >
                        {kid.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      // NEW DATA: Render image
                      <Image
                        src={kid.avatarColor || "/images/swoo.png"}
                        alt={kid.name}
                        width={64}
                        height={64}
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/swoo.png";
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{kid.name}</h3>
                    <p className="text-sm text-slate-500">Age: {kid.age} years</p>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4 flex justify-between items-center">
                  <p className="text-xs text-slate-500">
                    <KidProfileDate createdAt={kid.createdAt} />
                  </p>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200">
                    <span className="text-xs">💰</span>
                    <span className="text-xs font-bold text-slate-800">{kid.ambassador?.swagoMoney || 0} SD</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/profile/kids/${kid._id}/edit`}
                    className="flex-1 text-center bg-[hsl(var(--swago-purple))] text-white py-2 rounded-lg hover:opacity-90 font-medium text-sm"
                  >
                    ✏️ Edit Profile
                  </Link>
                  <button
                    onClick={() => handleDelete(kid._id)}
                    className="px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                    title="Delete Profile"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Add Second Profile Card */}
            {kidProfiles.length === 1 && (
              <Link
                href="/profile/kids/new"
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-[hsl(var(--swago-purple))] transition-colors group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">➕</div>
                <p className="font-medium text-slate-600">Add Second Kid</p>
                <p className="text-sm text-slate-400 mt-1">1 of 2 profiles used</p>
              </Link>
            )}
          </div>
        )}

        {kidProfiles.length === 2 && (
          <p className="text-sm text-slate-500 text-center mt-6">
            Maximum of 2 kid profiles reached
          </p>
        )}
      </div>
    </div>
  );
}
