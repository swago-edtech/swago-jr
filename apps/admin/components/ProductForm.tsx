"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Package,
  FileText,
  IndianRupee,
  Layers,
  Info,
  Sparkles,
  Image as ImageLucide,
  Video,
  Globe,
  Box,
  Star,
  AlertTriangle,
  Megaphone,
  Check,
  ChevronDown,
} from "lucide-react";
import LotteryCodesManager from "@/components/LotteryCodesManager";
import ComboProductFields from "@/components/ComboProductFields";

type ProductFormData = {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  videos?: string[];
  ageCategory: string;
  coreElements: string[];
  boxContents: string;
  benefits: string;
  stock: number;
  lowStockThreshold: number;
  amazonSku?: string;
  weight?: number;
  isFeatured: boolean;
  isActive: boolean;
  isCombo?: boolean;
  comboUnitCount?: number;
  comboProductIds?: string[];
  label?: string;
  rating?: number;
  numReviews?: number;
  showPromotionalMessage?: boolean;
  promotionalMessage?: string;
  skills?: { title: string; image: string }[];
  internationalPricing?: Record<string, { price: number; originalPrice?: number }>;
  internationalShipping?: Record<string, { fee: number }>;
};

type IntlCountryOption = {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  isActive: boolean;
};

function pricingMapFromInitial(
  raw?: Record<string, { price: number; originalPrice?: number }> | Map<string, { price: number; originalPrice?: number }> | null
): Record<string, { price: string; originalPrice: string }> {
  const out: Record<string, { price: string; originalPrice: string }> = {};
  if (!raw) return out;

  const entries =
    raw instanceof Map
      ? Array.from(raw.entries())
      : Object.entries(raw);

  for (const [currency, val] of entries) {
    if (!val) continue;
    out[String(currency).toUpperCase()] = {
      price: val.price != null && val.price > 0 ? String(val.price) : "",
      originalPrice:
        val.originalPrice != null && val.originalPrice > 0
          ? String(val.originalPrice)
          : "",
    };
  }
  return out;
}

function shippingMapFromInitial(
  raw?: Record<string, { fee: number }> | Map<string, { fee: number }> | null
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  const entries = raw instanceof Map ? Array.from(raw.entries()) : Object.entries(raw);
  for (const [currency, val] of entries) {
    if (!val || val.fee == null || !Number.isFinite(Number(val.fee)) || Number(val.fee) < 0) continue;
    out[String(currency).toUpperCase()] = String(val.fee);
  }
  return out;
}

type ProductFormProps = {
  mode: "create" | "edit";
  initialData?: ProductFormData;
  productId?: string;
};

const CORE_ELEMENTS = [
  { value: "S", label: "Smart Tech", color: "bg-pink-100 text-pink-700" },
  { value: "W", label: "Willpower", color: "bg-cyan-100 text-cyan-700" },
  { value: "A", label: "Ambition", color: "bg-blue-100 text-blue-700" },
  { value: "G", label: "Growth", color: "bg-orange-100 text-orange-700" },
  { value: "O", label: "Optimization", color: "bg-purple-100 text-purple-700" },
];

export default function ProductForm({ mode, initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [intlCountries, setIntlCountries] = useState<IntlCountryOption[]>([]);
  const [intlPricing, setIntlPricing] = useState<
    Record<string, { price: string; originalPrice: string }>
  >(() => pricingMapFromInitial(initialData?.internationalPricing));
  // Per-currency fixed international shipping (blank = use International Config, 0 = free)
  const [intlShipping, setIntlShipping] = useState<Record<string, string>>(() =>
    shippingMapFromInitial(initialData?.internationalShipping)
  );
  const [isIntlPricingExpanded, setIsIntlPricingExpanded] = useState(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);

  const [bomData, setBomData] = useState({ configured: false, stock: 0, limitingComponent: "", loading: mode === "edit" });

  useEffect(() => {
    fetch("/api/international-config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.data?.supportedCountries) return;
        const countries = (data.data.supportedCountries as IntlCountryOption[]).filter(
          (c) => c.isActive && c.code !== "IN" && c.currency !== "INR"
        );
        setIntlCountries(countries);
      })
      .catch((err) => console.error("Failed to load international countries", err));
  }, []);

  useEffect(() => {
    if (mode === "edit" && productId) {
      fetch(`/api/products/${productId}/bom-stock`)
        .then(res => res.json())
        .then(data => {
          setBomData({
            configured: data.configured || false,
            stock: data.stock || 0,
            limitingComponent: data.limitingComponent || "",
            loading: false
          });
          
          if (data.configured) {
            setForm(prev => ({ ...prev, stock: data.stock.toString() }));
          } else {
            setForm(prev => ({ ...prev, stock: "0" }));
          }
        })
        .catch(err => {
          console.error(err);
          setBomData(prev => ({ ...prev, loading: false }));
        });
    } else {
      setBomData(prev => ({ ...prev, loading: false }));
    }
  }, [mode, productId]);


  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    price: initialData?.price?.toString() ?? "",
    originalPrice: initialData?.originalPrice?.toString() ?? "",
    ageCategory: initialData?.ageCategory ?? "6-7",
    coreElements: initialData?.coreElements ?? ([] as string[]),
    boxContents: initialData?.boxContents ?? "",
    benefits: initialData?.benefits ?? "",
    stock: initialData?.stock?.toString() ?? "0",
    lowStockThreshold: initialData?.lowStockThreshold?.toString() ?? "10",
    amazonSku: (initialData as any)?.amazonSku ?? "",
    weight: (initialData as any)?.weight?.toString() ?? "0",
    isFeatured: initialData?.isFeatured ?? false,
    isActive: initialData?.isActive ?? true,
    isCombo: initialData?.isCombo ?? false,
    comboUnitCount: initialData?.comboUnitCount?.toString() ?? "2",
    label: initialData?.label ?? "",
    rating: initialData?.rating?.toString() ?? (mode === "create" ? "4.7" : "0"),
    numReviews: initialData?.numReviews?.toString() ?? (mode === "create" ? "23" : "0"),
    showPromotionalMessage: initialData?.showPromotionalMessage ?? false,
    promotionalMessage: initialData?.promotionalMessage ?? "",
  });

  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [videos, setVideos] = useState<string[]>(initialData?.videos ?? []);
  const [skills, setSkills] = useState<{ title: string; image: string }[]>(
    initialData?.skills ?? []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [comboProductIds, setComboProductIds] = useState<string[]>(
    initialData?.comboProductIds ?? []
  );
  const [productOptions, setProductOptions] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/products?isActive=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          setProductOptions(
            data.products
              .filter((p: { _id: string }) => p._id !== productId)
              .map((p: { _id: string; name: string }) => ({
                _id: p._id,
                name: p.name,
              }))
          );
        }
      })
      .catch(() => {});
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleCoreElementToggle = (element: string) => {
    const updated = form.coreElements.includes(element)
      ? form.coreElements.filter((e) => e !== element)
      : [...form.coreElements, element];
    setForm({ ...form, coreElements: updated });
    if (errors.coreElements) {
      setErrors({ ...errors, coreElements: "" });
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/products/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) return data.url;
      alert("Failed to upload: " + data.error);
      return null;
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }
    const url = await uploadFile(file);
    if (url) setImages((prev) => [...prev, url]);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("Video size should be less than 50MB");
      return;
    }
    const url = await uploadFile(file);
    if (url) setVideos((prev) => [...prev, url]);
  };

  const handleSkillImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) {
      const updated = [...skills];
      updated[index].image = url;
      setSkills(updated);
    }
  };

  const updateSkillTitle = (index: number, value: string) => {
    const updated = [...skills];
    updated[index].title = value;
    setSkills(updated);
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.price || parseFloat(form.price) <= 0) e.price = "Valid price is required";
    if (!form.ageCategory) e.ageCategory = "Age category is required";
    if (form.coreElements.length === 0) e.coreElements = "Select at least one core element";
    if (!form.boxContents.trim()) e.boxContents = "Box contents are required";
    if (!form.benefits.trim()) e.benefits = "Benefits are required";
    if (images.length === 0) e.images = "At least one image is required";
    if (!bomData.configured && (form.stock === "" || parseInt(form.stock) < 0))
      e.stock = "Valid stock quantity is required";
    const badShipping = Object.entries(intlShipping).find(([, v]) => {
      const val = typeof v === "string" ? v.trim() : String(v ?? "").trim();
      return val !== "" && (!Number.isFinite(parseFloat(val)) || parseFloat(val) < 0);
    });
    if (badShipping) e.internationalShipping = `Invalid shipping cost for ${badShipping[0]}`;
    if (form.isCombo) {
      const n = parseInt(form.comboUnitCount, 10);
      if (!Number.isInteger(n) || n < 2) {
        e.comboUnitCount = "Units per combo must be an integer ≥ 2";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Please fix the errors in the form");
      return;
    }
    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        images,
        videos,
        ageCategory: form.ageCategory,
        coreElements: form.coreElements,
        boxContents: form.boxContents,
        benefits: form.benefits,
        lowStockThreshold: parseInt(form.lowStockThreshold),
        amazonSku: form.amazonSku.trim().toUpperCase(),
        weight: parseFloat(form.weight) || 0,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        isCombo: form.isCombo,
        comboUnitCount: form.isCombo ? parseInt(form.comboUnitCount, 10) : 1,
        comboProductIds: form.isCombo ? comboProductIds : [],
        label: form.label,
        rating: parseFloat(form.rating) || 0,
        numReviews: parseInt(form.numReviews) || 0,
        showPromotionalMessage: form.showPromotionalMessage,
        promotionalMessage: form.promotionalMessage,
        skills: skills.filter((s) => s.title && s.image),
        internationalPricing: Object.fromEntries(
          Object.entries(intlPricing)
            .filter(([, v]) => v && v.price && parseFloat(v.price) > 0)
            .map(([currency, v]) => [
              currency,
              {
                price: parseFloat(v.price),
                ...(v.originalPrice && parseFloat(v.originalPrice) > 0
                  ? { originalPrice: parseFloat(v.originalPrice) }
                  : {}),
              },
            ])
        ),
        // Blank = unset (use International Config); explicit 0 = free shipping for this product
        internationalShipping: Object.fromEntries(
          Object.entries(intlShipping)
            .filter(([, v]) => {
              const val = typeof v === "string" ? v.trim() : String(v ?? "").trim();
              return val !== "" && Number.isFinite(parseFloat(val)) && parseFloat(val) >= 0;
            })
            .map(([currency, v]) => {
              const val = typeof v === "string" ? v.trim() : String(v ?? "").trim();
              return [currency, { fee: parseFloat(val) }];
            })
        ),
      };

      if (mode === "create") {
        payload.stock = 0;
      }

      const endpoint = mode === "create" ? "/api/products" : `/api/products/${productId}`;
      const res = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      } else {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server returned ${res.status} ${res.statusText}`);
      }

      if (res.ok && data?.success) {
        alert(
          mode === "create" ? "Product created successfully!" : "Product updated successfully!"
        );
        router.push("/products");
      } else {
        const errMsg = data?.error || data?.message || `Server returned ${res.status} ${res.statusText}`;
        alert(
          `Failed to ${mode === "create" ? "create" : "update"} product: ${errMsg}`
        );
      }
    } catch (error: any) {
      console.error("Product submission error:", error);
      alert(`Failed to ${mode === "create" ? "create" : "update"} product: ${error?.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (field?: string) =>
    `w-full border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all bg-white ${
      field && errors[field] ? "border-red-400 bg-red-50/30" : "border-gray-200"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === "create" ? "Add New Product" : "Edit Product"}
              </h1>
              {form.label && (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold tracking-wide border border-amber-200">
                  {form.label}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === "create"
                ? "Configure catalog details, pricing, media, and inventory"
                : "Update existing product specification and attributes"}

            </p>
          </div>
        </div>
        
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Basic Information</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g., Swago Decode & Dine Mat"
                    className={fieldClass("name")}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Label Badge{" "}
                    <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="label"
                    value={form.label}
                    onChange={handleChange}
                    placeholder="e.g. Shark's Choice, Bestseller"
                    className={fieldClass()}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Badge displayed on the product image overlay in customer view.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Description *
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Provide a comprehensive product description..."
                    className={`${fieldClass("description")} resize-none`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>Pricing & Discounting</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="499"
                      min="0"
                      step="0.01"
                      className={fieldClass("price")}
                    />
                    <div className="absolute right-3.5 top-2.5 text-gray-400 text-sm font-medium pointer-events-none">
                      ₹
                    </div>
                  </div>
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original / MRP Price (₹){" "}
                    <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="originalPrice"
                      value={form.originalPrice}
                      onChange={handleChange}
                      placeholder="799"
                      min="0"
                      step="0.01"
                      className={fieldClass()}
                    />
                    <div className="absolute right-3.5 top-2.5 text-gray-400 text-sm font-medium pointer-events-none">
                      ₹
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Strikethrough reference price</p>
                </div>
              </div>

              {intlCountries.length > 0 && (() => {
                const configuredCount = intlCountries.filter((c) => {
                  const row = intlPricing[c.currency.toUpperCase()];
                  const ship = intlShipping[c.currency.toUpperCase()];
                  return (
                    (row && (Boolean(row.price) || Boolean(row.originalPrice))) ||
                    (ship !== undefined && ship.trim() !== "")
                  );
                }).length;

                return (
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsIntlPricingExpanded((prev) => !prev)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200/80 bg-gray-50/70 hover:bg-gray-100/80 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-sky-100 text-sky-600 group-hover:bg-sky-200/70 transition-colors">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              International fixed prices &amp; shipping
                            </span>
                            <span className="text-[11px] text-gray-400 font-normal">
                              (Optional)
                            </span>
                            {configuredCount > 0 && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">
                                {configuredCount} configured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {isIntlPricingExpanded
                              ? "Override currency exchange multipliers with country-specific pricing"
                              : `${intlCountries.length} countries available · Click to expand`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-600">
                        <span className="text-xs font-medium hidden sm:inline">
                          {isIntlPricingExpanded ? "Collapse" : "Expand"}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isIntlPricingExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>
                    {errors.internationalShipping && (
                      <p className="text-red-500 text-xs mt-1">{errors.internationalShipping}</p>
                    )}

                    {isIntlPricingExpanded && (
                      <div className="space-y-3 pt-3">
                        <p className="text-xs text-gray-500 bg-sky-50/70 border border-sky-100 rounded-lg p-2.5">
                          Set a direct price per country. When filled, it overrides the exchange-rate
                          multiplier for that currency. Leave blank to use the multiplier from
                          International Config. Shipping cost is charged once per cart line
                          (regardless of quantity); leave it blank to use International Config
                          shipping, or enter 0 for free shipping on this product.
                        </p>
                        <div className="space-y-3">
                          {intlCountries.map((country) => {
                            const key = country.currency.toUpperCase();
                            const row = intlPricing[key] || { price: "", originalPrice: "" };
                            return (
                              <div
                                key={country.code}
                                className="rounded-lg border border-gray-100 bg-gray-50/80 p-3 grid grid-cols-1 sm:grid-cols-3 gap-3"
                              >
                                <div className="sm:col-span-3 text-xs font-semibold text-gray-600">
                                  {country.name}{" "}
                                  <span className="font-normal text-gray-400">
                                    ({country.currency} · {country.currencySymbol})
                                  </span>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Selling price ({country.currencySymbol})
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.price}
                                    onChange={(e) =>
                                      setIntlPricing((prev) => ({
                                        ...prev,
                                        [key]: { ...row, price: e.target.value },
                                      }))
                                    }
                                    placeholder="Leave blank for multiplier"
                                    className={fieldClass()}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Original / MRP ({country.currencySymbol}){" "}
                                    <span className="font-normal text-gray-400">(Optional)</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={row.originalPrice}
                                    onChange={(e) =>
                                      setIntlPricing((prev) => ({
                                        ...prev,
                                        [key]: { ...row, originalPrice: e.target.value },
                                      }))
                                    }
                                    placeholder="Optional"
                                    className={fieldClass()}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Shipping cost ({country.currencySymbol}){" "}
                                    <span className="font-normal text-gray-400">(Optional)</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={intlShipping[key] ?? ""}
                                    onChange={(e) =>
                                      setIntlShipping((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      }))
                                    }
                                    placeholder="Blank = config"
                                    className={fieldClass()}
                                  />
                                  <p className="text-[11px] text-gray-400 mt-1">
                                    Blank = use International Config shipping · 0 = free
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Classification & SWAGO Elements</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="age-category-select"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Target Age Group *
                  </label>
                  <select
                    id="age-category-select"
                    name="ageCategory"
                    value={form.ageCategory}
                    onChange={handleChange}
                    className={fieldClass("ageCategory")}
                  >
                    <option value="6-7">6 - 7 years</option>
                    <option value="8-10">8 - 10 years</option>
                    <option value="11-13">11 - 13 years</option>
                  </select>
                  {errors.ageCategory && (
                    <p className="text-red-500 text-xs mt-1">{errors.ageCategory}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Core SWAGO Elements *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {CORE_ELEMENTS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2 p-2.5 border-2 rounded-lg cursor-pointer transition-all ${
                          form.coreElements.includes(opt.value)
                            ? `${opt.color} border-current shadow-2xs`
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.coreElements.includes(opt.value)}
                          onChange={() => handleCoreElementToggle(opt.value)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{opt.value}</p>
                          <p className="text-xs text-gray-600">{opt.label}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.coreElements && (
                    <p className="text-red-500 text-xs mt-1">{errors.coreElements}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Box Contents & Benefits</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Box Contents *
                  </label>
                  <textarea
                    name="boxContents"
                    value={form.boxContents}
                    onChange={handleChange}
                    rows={3}
                    placeholder="List all items included inside the package..."
                    className={`${fieldClass("boxContents")} resize-none`}
                  />
                  {errors.boxContents && (
                    <p className="text-red-500 text-xs mt-1">{errors.boxContents}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Product Benefits *
                  </label>
                  <textarea
                    name="benefits"
                    value={form.benefits}
                    onChange={handleChange}
                    rows={3}
                    placeholder="List key learning outcomes and user benefits..."
                    className={`${fieldClass("benefits")} resize-none`}
                  />
                  {errors.benefits && (
                    <p className="text-red-500 text-xs mt-1">{errors.benefits}</p>
                  )}
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl border border-gray-200 p-5 ${isSkillsExpanded ? "space-y-4" : ""}`}>
              <div
                onClick={() => setIsSkillsExpanded((prev) => !prev)}
                className={`flex items-center justify-between cursor-pointer select-none group ${
                  isSkillsExpanded ? "border-b border-gray-100 pb-3" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Target Product Skills</span>
                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {skills.length}
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal lowercase tracking-normal">
                    (optional)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSkills([...skills, { title: "", image: "" }]);
                      setIsSkillsExpanded(true);
                    }}
                    className="px-3 py-1 bg-[#7C5DFA]/10 text-[#7C5DFA] rounded-full text-xs font-bold hover:bg-[#7C5DFA]/20 transition-all"
                  >
                    + Add Skill
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSkillsExpanded((prev) => !prev);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={isSkillsExpanded ? "Collapse skills" : "Expand skills"}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isSkillsExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {isSkillsExpanded && (
                <>
                  {skills.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skills.map((skill, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 relative group hover:border-[#7C5DFA]/30 transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                            className="absolute top-3 right-3 p-1 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-xs opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>

                          <div className="flex gap-4 items-center">
                            <div className="flex-none">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                Skill Icon
                              </p>
                              <label className="w-16 h-16 lg:w-20 lg:h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#7C5DFA] overflow-hidden bg-white transition-all">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSkillImageUpload(e, idx)}
                                  className="hidden"
                                />
                                {skill.image ? (
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={skill.image}
                                      alt={skill.title}
                                      fill
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <span className="text-[10px] text-white font-bold bg-black/40 px-2 py-0.5 rounded">
                                        Change
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center text-gray-300">
                                    <svg
                                      className="w-4 h-4 mb-0.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span className="text-[10px] font-bold">Pick</span>
                                  </div>
                                )}
                              </label>
                            </div>

                            <div className="flex-grow">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                Skill Title
                              </p>
                              <input
                                type="text"
                                value={skill.title}
                                onChange={(e) => updateSkillTitle(idx, e.target.value)}
                                placeholder="e.g. Critical Thinking"
                                className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-[#7C5DFA]/20 focus:border-[#7C5DFA] transition-all outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <svg
                        className="w-8 h-8 text-gray-200 mx-auto mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      <p className="text-gray-400 text-sm font-medium">No skills added yet.</p>
                      <button
                        type="button"
                        onClick={() => setSkills([...skills, { title: "", image: "" }])}
                        className="mt-3 text-[#7C5DFA] font-bold text-xs uppercase tracking-wider hover:underline"
                      >
                        + Add First Skill
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <ImageLucide className="w-4 h-4 text-pink-600" />
                <span>Product Media & Assets</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Product Images *
                    </p>
                    <span className="text-[11px] text-gray-400">Max 5MB each</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100"
                      >
                        <Image
                          src={img}
                          alt={`Product ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs shadow-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        {uploading ? (
                          <p className="text-xs text-gray-400">Uploading...</p>
                        ) : (
                          <>
                            <svg
                              className="w-6 h-6 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            <p className="text-[10px] text-gray-400 mt-0.5">Upload</p>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                  {errors.images && (
                    <p className="text-red-500 text-xs mt-2">{errors.images}</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Product Demonstration Videos
                    </p>
                    <span className="text-[11px] text-gray-400">Max 50MB each</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {videos.map((vid, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-100"
                      >
                        <video
                          src={vid}
                          className="object-cover w-full h-full"
                          controls
                        />
                        <button
                          type="button"
                          onClick={() => setVideos(videos.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs z-10 shadow-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {videos.length < 2 && (
                      <label className="aspect-video border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        {uploading ? (
                          <p className="text-xs text-gray-400">Uploading...</p>
                        ) : (
                          <>
                            <Video className="w-5 h-5 text-gray-300 mb-0.5" />
                            <p className="text-[10px] text-gray-400">Upload Video</p>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Status & Visibility</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Featured Product</span>
                    <span className="text-xs text-gray-400 block">Showcase on store homepage spotlight</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Active Status</span>
                    <span className="text-xs text-gray-400 block">Visible for browsing and purchase</span>
                  </div>
                </label>
                <ComboProductFields
                  isCombo={form.isCombo}
                  comboUnitCount={form.comboUnitCount}
                  comboProductIds={comboProductIds}
                  productOptions={productOptions}
                  errors={errors}
                  onIsComboChange={(checked) =>
                    setForm({ ...form, isCombo: checked })
                  }
                  onComboUnitCountChange={(value) =>
                    setForm({ ...form, comboUnitCount: value })
                  }
                  onComboProductIdsChange={setComboProductIds}
                />
              </div>
            </div>


            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Box className="w-4 h-4 text-amber-600" />
                <span>Inventory & Stock Alert</span>
              </div>
              
              {mode === "edit" && productId && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Inventory Bill of Materials</h4>
                    <p className="text-xs text-indigo-700/80 mt-1">Configure exactly which raw materials are deducted from inventory when this product is sold.</p>
                  </div>
                  <Link
                    href={`/inventory/config/${productId}`}
                    className="inline-flex items-center flex-shrink-0 gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all shadow-sm shadow-indigo-200"
                  >
                    <Settings className="w-4 h-4" />
                    Configure Inventory BOM
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  {bomData.loading ? (
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse w-full border border-gray-200" />
                  ) : bomData.configured ? (
                    <div className="relative">
                      <input
                        type="number"
                        name="stock"
                        value={form.stock}
                        readOnly
                        className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-gray-500 bg-gray-50 border-gray-200 outline-none cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-2.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Auto-Synced</div>
                      {bomData.limitingComponent && (
                        <p className="text-xs text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Limited by: {bomData.limitingComponent}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        name="stock"
                        value="0"
                        readOnly
                        className="w-full border rounded-lg px-3.5 py-2.5 text-sm text-gray-500 bg-gray-50 border-gray-200 outline-none cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-2.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">BOM Required</div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        {mode === "edit" && productId
                          ? "Configure inventory BOM to calculate sellable stock."
                          : "Stock is calculated after you configure the inventory BOM."}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={form.lowStockThreshold}
                    onChange={handleChange}
                    placeholder="10"
                    min="0"
                    className={fieldClass()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amazon / Marketplace SKU
                </label>
                <input
                  type="text"
                  name="amazonSku"
                  value={form.amazonSku}
                  onChange={handleChange}
                  placeholder="e.g. SWG-OBG-SSR-01-6Y"
                  className={fieldClass()}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Paste the seller SKU from Amazon order emails so Channel Email can link sales to this
                  product. This is separate from inventory unit SKUs under Inventory → Items.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="0.5"
                  min="0"
                  step="0.01"
                  className={fieldClass()}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Used for international shipping weight tiers in International Config.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                <span>Display Ratings & Reviews</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Rating <span className="text-gray-400 font-normal">(Mock)</span>
                  </label>
                  <input
                    type="number"
                    name="rating"
                    value={form.rating}
                    onChange={handleChange}
                    placeholder="4.7"
                    min="0"
                    max="5"
                    step="0.1"
                    className={fieldClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review Count <span className="text-gray-400 font-normal">(Mock)</span>
                  </label>
                  <input
                    type="number"
                    name="numReviews"
                    value={form.numReviews}
                    onChange={handleChange}
                    placeholder="23"
                    min="0"
                    className={fieldClass()}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Megaphone className="w-4 h-4 text-red-500" />
                <span>Promotional Announcement</span>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    name="showPromotionalMessage"
                    checked={form.showPromotionalMessage}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Display promotional message banner on cards & product page
                  </span>
                </label>
                {form.showPromotionalMessage && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banner Text
                    </label>
                    <input
                      type="text"
                      name="promotionalMessage"
                      value={form.promotionalMessage}
                      onChange={handleChange}
                      placeholder="e.g., Buy any 2 | Get FLAT 10% OFF Use Code: BYOB10"
                      className={fieldClass()}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {mode === "edit" && productId && (
          <div className="mt-6">
            <LotteryCodesManager productId={productId} />
          </div>
        )}

        <div className="flex gap-4 mt-8 pt-5 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {submitting
              ? mode === "create"
                ? "Creating..."
                : "Saving Changes..."
              : mode === "create"
                ? "Create Product"
                : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
