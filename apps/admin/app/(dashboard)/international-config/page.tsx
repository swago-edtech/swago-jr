"use client";

import React, { useEffect, useState } from "react";
import { HiOutlineGlobe, HiOutlineSave, HiPlus } from "react-icons/hi";

interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  shippingFee: number;
  isDefault: boolean;
  isActive: boolean;
  exchangeRate: number;
  shippingTiers?: { minWeight: number; maxWeight: number; fee: number; }[];
}

export default function InternationalConfigPage() {
  const [countries, setCountries] = useState<CountryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<number | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/international-config");
      const data = await res.json();
      if (data.success && data.data?.supportedCountries) {
        setCountries(data.data.supportedCountries);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch config");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/international-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportedCountries: countries }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save");
      }
      alert("Settings saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const updateCountry = (index: number, field: keyof CountryConfig, value: any) => {
    const updated = [...countries];
    updated[index] = { ...updated[index], [field]: value };
    setCountries(updated);
  };

  const addCountry = () => {
    setCountries([
      ...countries,
      {
        code: "",
        name: "",
        currency: "",
        currencySymbol: "",
        phonePrefix: "",
        shippingFee: 0,
        isDefault: false,
        isActive: true,
        exchangeRate: 1,
        shippingTiers: [],
      },
    ]);
  };

  const addTier = (countryIdx: number) => {
    const updated = [...countries];
    const country = updated[countryIdx];
    const tiers = country.shippingTiers || [];
    updated[countryIdx] = {
      ...country,
      shippingTiers: [...tiers, { minWeight: 0, maxWeight: 0, fee: 0 }]
    };
    setCountries(updated);
  };

  const updateTier = (countryIdx: number, tierIdx: number, field: string, value: number) => {
    const updated = [...countries];
    const country = updated[countryIdx];
    if (!country.shippingTiers) return;
    
    const tiers = [...country.shippingTiers];
    tiers[tierIdx] = { ...tiers[tierIdx], [field]: value };
    
    updated[countryIdx] = { ...country, shippingTiers: tiers };
    setCountries(updated);
  };

  const removeTier = (countryIdx: number, tierIdx: number) => {
    const updated = [...countries];
    const country = updated[countryIdx];
    if (!country.shippingTiers) return;
    
    const tiers = country.shippingTiers.filter((_, i) => i !== tierIdx);
    updated[countryIdx] = { ...country, shippingTiers: tiers };
    setCountries(updated);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading configuration...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <HiOutlineGlobe className="text-indigo-600" />
            International Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage supported countries, exchange rates, and shipping fees.
          </p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <HiOutlineSave className="text-lg" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold">Country</th>
                <th className="px-6 py-4 font-bold">Currency</th>
                <th className="px-6 py-4 font-bold">Prefix</th>
                <th className="px-6 py-4 font-bold">Exchange Rate (to Base)</th>
                <th className="px-6 py-4 font-bold">Shipping Fee</th>
                <th className="px-6 py-4 font-bold">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {countries.map((country, idx) => (
                <React.Fragment key={idx}>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <input
                        value={country.code}
                        onChange={(e) => updateCountry(idx, "code", e.target.value)}
                        placeholder="Code (e.g. US)"
                        className="w-16 px-2 py-1.5 text-black bg-slate-50 border border-slate-200 rounded text-xs font-bold uppercase"
                        readOnly={country.isDefault}
                      />
                      <input
                        value={country.name}
                        onChange={(e) => updateCountry(idx, "name", e.target.value)}
                        placeholder="Name (e.g. United States)"
                        className="flex-1 px-2 py-1.5 text-black bg-slate-50 border border-slate-200 rounded text-xs"
                        readOnly={country.isDefault}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <input
                        value={country.currency}
                        onChange={(e) => updateCountry(idx, "currency", e.target.value)}
                        placeholder="Curr (e.g. USD)"
                        className="w-16 px-2 py-1.5 text-black bg-slate-50 border border-slate-200 rounded text-xs uppercase"
                        readOnly={country.isDefault}
                      />
                      <input
                        value={country.currencySymbol}
                        onChange={(e) => updateCountry(idx, "currencySymbol", e.target.value)}
                        placeholder="Sym (e.g. $)"
                        className="w-10 px-2 py-1.5 text-black bg-slate-50 border border-slate-200 rounded text-xs text-center"
                        readOnly={country.isDefault}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      value={country.phonePrefix}
                      onChange={(e) => updateCountry(idx, "phonePrefix", e.target.value)}
                      placeholder="+1"
                      className="w-16 px-2 py-1.5 text-black bg-slate-50 border border-slate-200 rounded text-xs text-center"
                      readOnly={country.isDefault}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.001"
                      value={country.exchangeRate}
                      onChange={(e) => updateCountry(idx, "exchangeRate", parseFloat(e.target.value))}
                      className="w-24 px-2 py-1.5 text-black bg-slate-50 border border-slate-200 rounded text-xs text-right"
                      readOnly={country.isDefault}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">{country.currencySymbol}</span>
                        <input
                          type="number"
                          value={country.shippingFee}
                          onChange={(e) => updateCountry(idx, "shippingFee", parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 text-black bg-slate-50 border border-slate-200 rounded text-xs text-right"
                        />
                      </div>
                      <button
                        onClick={() => setExpandedCountry(expandedCountry === idx ? null : idx)}
                        className="text-xs text-indigo-600 font-bold hover:underline text-left mt-1"
                      >
                        {expandedCountry === idx ? "Hide Tiers" : `Tiers (${country.shippingTiers?.length || 0})`}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={country.isActive}
                        onChange={(e) => updateCountry(idx, "isActive", e.target.checked)}
                        className="sr-only peer"
                        disabled={country.isDefault}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </td>
                </tr>
                {expandedCountry === idx && (
                  <tr key={`tiers-${idx}`} className="bg-indigo-50/30 border-b border-slate-100">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-slate-700">Weight-Based Shipping Tiers</h4>
                          <button
                            onClick={() => addTier(idx)}
                            className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-200 transition-colors"
                          >
                            + Add Tier
                          </button>
                        </div>
                        
                        {(!country.shippingTiers || country.shippingTiers.length === 0) ? (
                          <p className="text-xs text-slate-500 italic">No weight tiers defined. Flat shipping fee will be used.</p>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
                              <div>Min Weight (g)</div>
                              <div>Max Weight (g)</div>
                              <div>Fee ({country.currencySymbol})</div>
                              <div>Actions</div>
                            </div>
                            {country.shippingTiers.map((tier, tierIdx) => (
                              <div key={tierIdx} className="grid grid-cols-4 gap-4 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <input
                                  type="number"
                                  value={tier.minWeight}
                                  onChange={(e) => updateTier(idx, tierIdx, "minWeight", parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-full px-2 py-1.5 text-black bg-white border border-slate-200 rounded text-xs"
                                />
                                <input
                                  type="number"
                                  value={tier.maxWeight}
                                  onChange={(e) => updateTier(idx, tierIdx, "maxWeight", parseInt(e.target.value) || 0)}
                                  placeholder="500"
                                  className="w-full px-2 py-1.5 text-black bg-white border border-slate-200 rounded text-xs"
                                />
                                <input
                                  type="number"
                                  value={tier.fee}
                                  onChange={(e) => updateTier(idx, tierIdx, "fee", parseInt(e.target.value) || 0)}
                                  placeholder="400"
                                  className="w-full px-2 py-1.5 text-black bg-white border border-slate-200 rounded text-xs"
                                />
                                <button
                                  onClick={() => removeTier(idx, tierIdx)}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 rounded"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={addCountry}
            className="flex items-center gap-2 text-indigo-600 text-sm font-bold hover:text-indigo-700 transition-colors"
          >
            <HiPlus /> Add Country
          </button>
        </div>
      </div>
    </div>
  );
}
