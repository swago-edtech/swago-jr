"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Loader2, Image as ImageIcon, ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function MasterclassSessionsAdmin() {
  const [masterclass, setMasterclass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<{ [key: number]: boolean }>({});
  const [expandedSessions, setExpandedSessions] = useState<number[]>([]);

  const toggleSession = (index: number) => {
    setExpandedSessions(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  useEffect(() => {
    fetchMasterclass();
  }, []);

  const fetchMasterclass = async () => {
    try {
      const res = await fetch("/api/masterclass");
      const data = await res.json();
      if (data.success && data.masterclass) {
        setMasterclass(data.masterclass);
      } else {
        // Init minimal if not found
        setMasterclass({ sessions: [] });
      }
    } catch (error) {
      console.error("Error fetching masterclass:", error);
      alert("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/masterclass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterclass),
      });
      const data = await res.json();
      if (data.success) {
        alert("Sessions saved successfully!");
      } else {
        alert(data.error || "Failed to save sessions");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sessionIndex: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingImage(prev => ({ ...prev, [sessionIndex]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/masterclass/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const s = [...masterclass.sessions];
        s[sessionIndex].thumbnail = data.url;
        setMasterclass({ ...masterclass, sessions: s });
        alert("Image uploaded!");
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload");
    } finally {
      setUploadingImage(prev => ({ ...prev, [sessionIndex]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Masterclass Sessions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage individual sessions, pricing, and availability.</p>
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

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg">All Sessions</h3>
          <button 
            onClick={() => setMasterclass({ 
              ...masterclass, 
              sessions: [...(masterclass.sessions || []), { title: "New Session", ageGroup: "6-8 years", pricing: [{ currency: "INR", price: 0 }] }] 
            })} 
            className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" /> Add Session
          </button>
        </div>
        
        {(!masterclass.sessions || masterclass.sessions.length === 0) ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg border-gray-200">
            <p className="text-gray-500 italic">No sessions added yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {masterclass.sessions.map((session: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-xl bg-gray-50 relative overflow-hidden">
                {/* Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => toggleSession(index)}
                >
                  <h4 className="font-semibold text-black">{session.title || 'Untitled Session'}</h4>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        handleSave();
                      }}
                      className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        const newSessions = [...masterclass.sessions]; 
                        newSessions.splice(index, 1); 
                        setMasterclass({ ...masterclass, sessions: newSessions }); 
                      }} 
                      className="text-red-500 hover:text-red-700 bg-white p-1.5 rounded-lg shadow-sm border border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedSessions.includes(index) ? <ChevronDown className="w-5 h-5 text-black" /> : <ChevronRight className="w-5 h-5 text-black" />}
                  </div>
                </div>
                
                {/* Body */}
                {expandedSessions.includes(index) && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex gap-6 flex-col lg:flex-row">
                      {/* Image Upload Area */}
                      <div className="w-full lg:w-1/4">
                        <label className="block text-sm font-medium text-black mb-2">Thumbnail</label>
                        <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden border-2 border-dashed border-gray-400 flex items-center justify-center group">
                          {session.thumbnail ? (
                            <>
                              <Image src={session.thumbnail} alt="Thumbnail" fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <label className="cursor-pointer text-white flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-white/30 text-sm">
                                  <ImageIcon className="w-4 h-4" /> Change
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, index)} disabled={uploadingImage[index]} />
                                </label>
                              </div>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-2 text-black hover:text-blue-600 transition p-4 text-center">
                              {uploadingImage[index] ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : <ImageIcon className="w-8 h-8" />}
                              <span className="text-xs font-medium text-black">{uploadingImage[index] ? 'Uploading...' : 'Upload Image'}</span>
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, index)} disabled={uploadingImage[index]} />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Form Details */}
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">Session Title</label>
                            <input type="text" value={session.title || ''} onChange={(e) => { const s = [...masterclass.sessions]; s[index].title = e.target.value; setMasterclass({ ...masterclass, sessions: s }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-black" placeholder="Session Title" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">Age Group</label>
                            <input type="text" value={session.ageGroup || ''} onChange={(e) => { const s = [...masterclass.sessions]; s[index].ageGroup = e.target.value; setMasterclass({ ...masterclass, sessions: s }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-black" placeholder="e.g. 6-8 years" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">Schedule</label>
                            <input type="text" value={session.schedule || ''} onChange={(e) => { const s = [...masterclass.sessions]; s[index].schedule = e.target.value; setMasterclass({ ...masterclass, sessions: s }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-black" placeholder="e.g. Saturday, 10 AM" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">Duration</label>
                            <input type="text" value={session.duration || ''} onChange={(e) => { const s = [...masterclass.sessions]; s[index].duration = e.target.value; setMasterclass({ ...masterclass, sessions: s }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-black" placeholder="e.g. 90 mins" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">Max Seats</label>
                            <input type="number" value={session.maxSeats || 0} onChange={(e) => { const s = [...masterclass.sessions]; s[index].maxSeats = Number(e.target.value); setMasterclass({ ...masterclass, sessions: s }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-black" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">Booked Seats</label>
                            <input type="number" value={session.bookedSeats || 0} onChange={(e) => { const s = [...masterclass.sessions]; s[index].bookedSeats = Number(e.target.value); setMasterclass({ ...masterclass, sessions: s }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-black" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Highlights (one per line)</label>
                          <textarea value={session.highlights?.join('\n') || ''} onChange={(e) => { const s = [...masterclass.sessions]; s[index].highlights = e.target.value.split('\n').filter(h => h.trim() !== ''); setMasterclass({ ...masterclass, sessions: s }); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-black" rows={3} placeholder="Learn new skills..." />
                        </div>

                        {/* Pricing Section */}
                        <div className="bg-white p-4 rounded-xl border border-gray-300">
                          <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-semibold text-black">Pricing Options (Multi-Currency)</label>
                            <button onClick={() => { const s = [...masterclass.sessions]; if(!s[index].pricing) s[index].pricing = []; s[index].pricing.push({ currency: "USD", price: 0 }); setMasterclass({ ...masterclass, sessions: s }); }} className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium">Add Currency</button>
                          </div>
                          {(!session.pricing || session.pricing.length === 0) ? <p className="text-xs text-black italic">No pricing added.</p> : (
                            <div className="space-y-2">
                              {session.pricing.map((p: any, pIdx: number) => (
                                <div key={pIdx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-300">
                                  <select 
                                    value={p.currency} 
                                    onChange={(e) => { const s = [...masterclass.sessions]; s[index].pricing[pIdx].currency = e.target.value; setMasterclass({ ...masterclass, sessions: s }); }} 
                                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-black"
                                  >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="AED">AED (د.إ)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="AUD">AUD (A$)</option>
                                    <option value="CAD">CAD (C$)</option>
                                    <option value="SGD">SGD (S$)</option>
                                  </select>
                                  
                                  <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-sm">Price</span>
                                    <input type="number" value={p.price} onChange={(e) => { const s = [...masterclass.sessions]; s[index].pricing[pIdx].price = Number(e.target.value); setMasterclass({ ...masterclass, sessions: s }); }} className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-black" placeholder="0" />
                                  </div>
                                  <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-sm">Original</span>
                                    <input type="number" value={p.originalPrice || ''} onChange={(e) => { const s = [...masterclass.sessions]; s[index].pricing[pIdx].originalPrice = Number(e.target.value); setMasterclass({ ...masterclass, sessions: s }); }} className="w-full pl-16 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-black" placeholder="0" />
                                  </div>
                                  <button onClick={() => { const s = [...masterclass.sessions]; s[index].pricing.splice(pIdx, 1); setMasterclass({ ...masterclass, sessions: s }); }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
