"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

type Tab = "overview" | "hero" | "modules" | "bonuses" | "mentor" | "certification" | "sessions" | "audience" | "faqs" | "testimonials";

export default function MasterclassEditorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [masterclass, setMasterclass] = useState<any>(null);

  useEffect(() => {
    fetchMasterclass();
  }, []);

  const fetchMasterclass = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/masterclass`);
      const data = await res.json();
      if (data.success) {
        setMasterclass(data.masterclass);
      } else {
        alert("Failed to load masterclass");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/masterclass`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterclass),
      });
      const data = await res.json();
      if (data.success) {
        alert("Saved successfully!");
      } else {
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>, path: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/masterclass/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        const keys = path.split('.');
        const newMc = { ...masterclass };
        let current = newMc;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = data.url;
        setMasterclass(newMc);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    }
  };

  if (loading || !masterclass) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6 pb-24 text-black">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Masterclass Page Builder</h1>
          <p className="text-sm text-gray-500">Manage the global landing page</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 no-scrollbar">
        {[
          { id: "overview", label: "Overview" },
          { id: "hero", label: "Hero" },
          { id: "modules", label: "Modules" },
          { id: "bonuses", label: "Bonuses" },
          { id: "mentor", label: "Mentor" },
          { id: "certification", label: "Certification" },
          { id: "audience", label: "Audience" },
          { id: "testimonials", label: "Testimonials" },
          { id: "faqs", label: "FAQs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`whitespace-nowrap py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content area */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={masterclass.title} onChange={(e) => setMasterclass({ ...masterclass, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={masterclass.description} onChange={(e) => setMasterclass({ ...masterclass, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={4} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={masterclass.isActive} onChange={(e) => setMasterclass({ ...masterclass, isActive: e.target.checked })} className="w-4 h-4 text-blue-600" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (Visible to public)</label>
            </div>
          </div>
        )}

        {/* HERO */}
        {activeTab === "hero" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                  <textarea value={masterclass.hero.headline} onChange={(e) => setMasterclass({ ...masterclass, hero: { ...masterclass.hero, headline: e.target.value } })} className="w-full px-4 py-2 border rounded-lg" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                  <input type="text" value={masterclass.hero.subheadline} onChange={(e) => setMasterclass({ ...masterclass, hero: { ...masterclass.hero, subheadline: e.target.value } })} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Badge Text</label>
                  <input type="text" value={masterclass.hero.guaranteeBadge} onChange={(e) => setMasterclass({ ...masterclass, hero: { ...masterclass.hero, guaranteeBadge: e.target.value } })} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. 100% money back guarantee" />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video YouTube/Vimeo ID or URL</label>
                  <input type="text" value={masterclass.hero.videoUrl} onChange={(e) => setMasterclass({ ...masterclass, hero: { ...masterclass.hero, videoUrl: e.target.value } })} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. YOUTUBE_ID" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Hero Stats</label>
                    <button onClick={() => setMasterclass({ ...masterclass, hero: { ...masterclass.hero, stats: [...(masterclass.hero.stats || []), { label: "", subtext: "" }] } })} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Add Stat</button>
                  </div>
                  {masterclass.hero.stats?.map((stat: any, i: number) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="text" value={stat.label} onChange={(e) => { const s = [...masterclass.hero.stats]; s[i].label = e.target.value; setMasterclass({ ...masterclass, hero: { ...masterclass.hero, stats: s } }) }} className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="e.g. 40,000+" />
                      <input type="text" value={stat.subtext} onChange={(e) => { const s = [...masterclass.hero.stats]; s[i].subtext = e.target.value; setMasterclass({ ...masterclass, hero: { ...masterclass.hero, stats: s } }) }} className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="e.g. Students" />
                      <button onClick={() => { const s = [...masterclass.hero.stats]; s.splice(i, 1); setMasterclass({ ...masterclass, hero: { ...masterclass.hero, stats: s } }) }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MENTOR */}
        {activeTab === "mentor" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mentor Name</label>
                  <input type="text" value={masterclass.mentor?.name || ''} onChange={(e) => setMasterclass({ ...masterclass, mentor: { ...masterclass.mentor, name: e.target.value } })} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mentor Title</label>
                  <input type="text" value={masterclass.mentor?.title || ''} onChange={(e) => setMasterclass({ ...masterclass, mentor: { ...masterclass.mentor, title: e.target.value } })} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mentor Bio</label>
                  <textarea value={masterclass.mentor?.bio || ''} onChange={(e) => setMasterclass({ ...masterclass, mentor: { ...masterclass.mentor, bio: e.target.value } })} className="w-full px-4 py-2 border rounded-lg" rows={6} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mentor Image</label>
                  <div className="flex items-center gap-4">
                    {masterclass.mentor?.image ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                        <Image src={masterclass.mentor.image} alt="Mentor" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center border"><ImageIcon className="text-gray-400" /></div>
                    )}
                    <input type="file" onChange={(e) => uploadImage(e, 'mentor.image')} accept="image/*" className="text-sm" />
                  </div>
                </div>
                <div className="space-y-4 mt-6">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">Social Stats</label>
                    <button onClick={() => setMasterclass({ ...masterclass, mentor: { ...masterclass.mentor, stats: [...(masterclass.mentor?.stats || []), { platform: "", count: "" }] } })} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Add Stat</button>
                  </div>
                  {masterclass.mentor?.stats?.map((stat: any, i: number) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="text" value={stat.platform} onChange={(e) => { const s = [...masterclass.mentor.stats]; s[i].platform = e.target.value; setMasterclass({ ...masterclass, mentor: { ...masterclass.mentor, stats: s } }) }} className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="e.g. YouTube" />
                      <input type="text" value={stat.count} onChange={(e) => { const s = [...masterclass.mentor.stats]; s[i].count = e.target.value; setMasterclass({ ...masterclass, mentor: { ...masterclass.mentor, stats: s } }) }} className="flex-1 px-3 py-1.5 border rounded text-sm" placeholder="e.g. 2.2M" />
                      <button onClick={() => { const s = [...masterclass.mentor.stats]; s.splice(i, 1); setMasterclass({ ...masterclass, mentor: { ...masterclass.mentor, stats: s } }) }} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CERTIFICATION */}
        {activeTab === "certification" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input type="text" value={masterclass.certification?.title || ''} onChange={(e) => setMasterclass({ ...masterclass, certification: { ...masterclass.certification, title: e.target.value } })} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={masterclass.certification?.description || ''} onChange={(e) => setMasterclass({ ...masterclass, certification: { ...masterclass.certification, description: e.target.value } })} className="w-full px-4 py-2 border rounded-lg" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bullet Points (comma separated)</label>
                  <textarea value={masterclass.certification?.points?.join('\n') || ''} onChange={(e) => { 
                    setMasterclass({ ...masterclass, certification: { ...masterclass.certification, points: e.target.value.split('\n').filter(Boolean) } }) 
                  }} className="w-full px-4 py-2 border rounded-lg" rows={4} placeholder="Point 1&#10;Point 2" />
                  <p className="text-xs text-gray-500 mt-1">One point per line</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Image</label>
                <div className="flex flex-col gap-4">
                  {masterclass.certification?.image ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <Image src={masterclass.certification.image} alt="Certificate" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center border"><ImageIcon className="text-gray-400" /></div>
                  )}
                  <input type="file" onChange={(e) => uploadImage(e, 'certification.image')} accept="image/*" className="text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULES & BONUSES & AUDIENCE & TESTIMONIALS & FAQS */}
        {['modules', 'bonuses', 'audience', 'testimonials', 'faqs'].includes(activeTab) && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg capitalize">{activeTab}</h3>
              <button 
                onClick={() => {
                  const arr = [...(masterclass[activeTab] || [])];
                  let newItem: any = {};
                  if (activeTab === 'testimonials') newItem = { name: "", message: "", role: "Parent" };
                  else if (activeTab === 'faqs') newItem = { question: "", answer: "" };
                  else if (activeTab === 'bonuses') newItem = { title: "", value: "", description: "" };
                  else if (activeTab === 'modules') newItem = { title: "", duration: "", points: [] };
                  else newItem = { title: "", description: "" };
                  arr.push(newItem);
                  setMasterclass({ ...masterclass, [activeTab]: arr });
                }}
                className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            
            {(!masterclass[activeTab] || masterclass[activeTab].length === 0) ? <p className="text-gray-500 italic">No items added yet.</p> : (
              <div className="space-y-4">
                {masterclass[activeTab].map((item: any, index: number) => (
                  <div key={index} className="flex gap-4 items-start border p-4 rounded-lg bg-gray-50">
                    <div className="flex-1 space-y-3">
                      
                      {activeTab === 'faqs' ? (
                        <>
                          <input type="text" placeholder="Question" value={item.question || ''} onChange={(e) => { const arr = [...masterclass.faqs]; arr[index].question = e.target.value; setMasterclass({ ...masterclass, faqs: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" />
                          <textarea placeholder="Answer" value={item.answer || ''} onChange={(e) => { const arr = [...masterclass.faqs]; arr[index].answer = e.target.value; setMasterclass({ ...masterclass, faqs: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" rows={2} />
                        </>
                      ) : activeTab === 'testimonials' ? (
                        <>
                          <input type="text" placeholder="Name" value={item.name || ''} onChange={(e) => { const arr = [...masterclass.testimonials]; arr[index].name = e.target.value; setMasterclass({ ...masterclass, testimonials: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" />
                          <input type="text" placeholder="Role (e.g. Parent)" value={item.role || ''} onChange={(e) => { const arr = [...masterclass.testimonials]; arr[index].role = e.target.value; setMasterclass({ ...masterclass, testimonials: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" />
                          <textarea placeholder="Message" value={item.message || ''} onChange={(e) => { const arr = [...masterclass.testimonials]; arr[index].message = e.target.value; setMasterclass({ ...masterclass, testimonials: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" rows={2} />
                        </>
                      ) : activeTab === 'modules' ? (
                        <>
                          <div className="flex gap-2">
                            <input type="text" placeholder="Module Title" value={item.title || ''} onChange={(e) => { const arr = [...masterclass.modules]; arr[index].title = e.target.value; setMasterclass({ ...masterclass, modules: arr }); }} className="flex-1 px-3 py-1.5 border rounded text-sm" />
                            <input type="text" placeholder="Duration (e.g. Week 1)" value={item.duration || ''} onChange={(e) => { const arr = [...masterclass.modules]; arr[index].duration = e.target.value; setMasterclass({ ...masterclass, modules: arr }); }} className="w-32 px-3 py-1.5 border rounded text-sm" />
                          </div>
                          <textarea placeholder="Points (one per line)" value={item.points?.join('\n') || ''} onChange={(e) => { const arr = [...masterclass.modules]; arr[index].points = e.target.value.split('\n'); setMasterclass({ ...masterclass, modules: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" rows={3} />
                        </>
                      ) : activeTab === 'bonuses' ? (
                        <>
                          <div className="flex gap-4">
                            <div className="flex-1 space-y-3">
                              <input type="text" placeholder="Bonus Title" value={item.title || ''} onChange={(e) => { const arr = [...masterclass.bonuses]; arr[index].title = e.target.value; setMasterclass({ ...masterclass, bonuses: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" />
                              <input type="text" placeholder="Value (e.g. ₹5000)" value={item.value || ''} onChange={(e) => { const arr = [...masterclass.bonuses]; arr[index].value = e.target.value; setMasterclass({ ...masterclass, bonuses: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" />
                              <textarea placeholder="Description" value={item.description || ''} onChange={(e) => { const arr = [...masterclass.bonuses]; arr[index].description = e.target.value; setMasterclass({ ...masterclass, bonuses: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" rows={2} />
                            </div>
                            <div className="w-32">
                              {item.image ? <img src={item.image} className="w-full h-24 object-cover border rounded mb-2" /> : <div className="w-full h-24 bg-gray-100 border rounded mb-2 flex items-center justify-center text-xs text-gray-400">No Image</div>}
                              <input type="file" accept="image/*" onChange={(e) => uploadImage(e, `bonuses.${index}.image`)} className="text-xs w-full" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <input type="text" placeholder="Title" value={item.title || ''} onChange={(e) => { const arr = [...masterclass.audience]; arr[index].title = e.target.value; setMasterclass({ ...masterclass, audience: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" />
                          <textarea placeholder="Description" value={item.description || ''} onChange={(e) => { const arr = [...masterclass.audience]; arr[index].description = e.target.value; setMasterclass({ ...masterclass, audience: arr }); }} className="w-full px-3 py-1.5 border rounded text-sm" rows={2} />
                        </>
                      )}

                    </div>
                    <button onClick={() => { 
                      const arr = [...masterclass[activeTab]]; 
                      arr.splice(index, 1); 
                      setMasterclass({ ...masterclass, [activeTab]: arr }); 
                    }} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



      </div>
    </div>
  );
}
