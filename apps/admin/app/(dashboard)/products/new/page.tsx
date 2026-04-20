"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    ageCategory: "6-7",
    coreElements: [] as string[],
    boxContents: "",
    benefits: "",
    stock: "0",
    lowStockThreshold: "10",
    isFeatured: false,
    isActive: true,
    label: "",
    rating: "4.7",
    numReviews: "23",
  });

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [skills, setSkills] = useState<{ title: string; image: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input change
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

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle core elements checkbox
  const handleCoreElementToggle = (element: string) => {
    const newElements = form.coreElements.includes(element)
      ? form.coreElements.filter((e) => e !== element)
      : [...form.coreElements, element];

    setForm({ ...form, coreElements: newElements });

    if (errors.coreElements) {
      setErrors({ ...errors, coreElements: "" });
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setImages([...images, data.url]);
      } else {
        alert("Failed to upload image: " + data.error);
      }

    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("Video size should be less than 50MB");
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setVideos([...videos, data.url]);
      } else {
        alert("Failed to upload video: " + data.error);
      }

    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Failed to upload video");
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Remove video
  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  // ✅ New: Handle skill image upload
  const handleSkillImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, skillIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        const newSkills = [...skills];
        newSkills[skillIndex].image = data.url;
        setSkills(newSkills);
      }
    } catch (error) {
      console.error("Error uploading skill image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const addSkill = () => {
    setSkills([...skills, { title: "", image: "" }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSkillChange = (index: number, val: string) => {
    const newSkills = [...skills];
    newSkills[index].title = val;
    setSkills(newSkills);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.description.trim()) newErrors.description = "Description is required";
    if (!form.price || parseFloat(form.price) <= 0) newErrors.price = "Valid price is required";
    if (!form.ageCategory) newErrors.ageCategory = "Age category is required";
    if (form.coreElements.length === 0) newErrors.coreElements = "Select at least one core element";
    if (!form.boxContents.trim()) newErrors.boxContents = "Box contents are required";
    if (!form.benefits.trim()) newErrors.benefits = "Benefits are required";
    if (images.length === 0) newErrors.images = "At least one image is required";
    if (form.stock === "" || parseInt(form.stock) < 0) newErrors.stock = "Valid stock quantity is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
          images: images,
          videos: videos,
          ageCategory: form.ageCategory,
          coreElements: form.coreElements,
          boxContents: form.boxContents,
          benefits: form.benefits,
          stock: parseInt(form.stock),
          lowStockThreshold: parseInt(form.lowStockThreshold),
          isFeatured: form.isFeatured,
          isActive: form.isActive,
          label: form.label,
          rating: parseFloat(form.rating) || 0,
          numReviews: parseInt(form.numReviews) || 0,
          skills: skills.filter(s => s.title && s.image),
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Product created successfully!");
        router.push("/products");
      } else {
        alert("Failed to create product: " + data.error);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const coreElementsOptions = [
    { value: "S", label: "Smart Tech", color: "bg-pink-100 text-pink-700" },
    { value: "W", label: "Willpower", color: "bg-cyan-100 text-cyan-700" },
    { value: "A", label: "Ambition", color: "bg-blue-100 text-blue-700" },
    { value: "G", label: "Growth", color: "bg-orange-100 text-orange-700" },
    { value: "O", label: "Optimization", color: "bg-purple-100 text-purple-700" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Fill in the product details below</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Basic Information
          </h2>

          {/* Product Name */}
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
              className={`w-full border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Product Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Label <span className="text-gray-500">(Optional - e.g. Shark&apos;s Choice, Bestseller)</span>
            </label>
            <input
              type="text"
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="e.g. Shark's Choice"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">This badge will appear on the top-left of the product image.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Rating <span className="text-gray-500">(Mock value)</span>
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Review Count <span className="text-gray-500">(Mock value)</span>
              </label>
              <input
                type="number"
                name="numReviews"
                value={form.numReviews}
                onChange={handleChange}
                placeholder="23"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Detailed product description..."
              className={`w-full border rounded-md px-3 py-2 resize-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="499"
                min="0"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.price ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price (₹) <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="number"
                name="originalPrice"
                value={form.originalPrice}
                onChange={handleChange}
                placeholder="799"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Product Images
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images * (Max 5MB per image)
            </label>

            {/* Image Grid */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image src={image} alt={`Product ${index + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              {images.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <p className="text-sm text-gray-500">Uploading...</p>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-xs text-gray-500 mt-1">Upload</p>
                    </>
                  )}
                </label>
              )}
            </div>

            {errors.images && <p className="text-red-500 text-xs">{errors.images}</p>}
            <p className="text-xs text-gray-500">
              Note: Image upload requires Cloudinary credentials in .env.local
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Videos (Optional, Max 50MB per video)
            </label>

            {/* Video Grid */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              {videos.map((video, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <video src={video} className="object-cover w-full h-full" controls />
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 z-10"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              {videos.length < 2 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <p className="text-sm text-gray-500">Uploading...</p>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-500 mt-1">Upload Video</p>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Product Skills */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xl font-semibold text-gray-900 font-bold">Product Skills</h2>
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-1.5 bg-[#7C5DFA]/10 text-[#7C5DFA] rounded-full text-xs font-black hover:bg-[#7C5DFA]/20 transition-all uppercase tracking-wider"
            >
              + Add Skill
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map((skill, index) => (
              <div key={index} className="p-5 border-2 border-slate-100 rounded-[1.5rem] bg-slate-50/50 space-y-4 relative group hover:border-[#7C5DFA]/30 transition-all shadow-sm">
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="absolute top-4 right-4 p-1.5 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="flex gap-5 items-center">
                  <div className="flex-none">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Skill Icon/Image</label>
                    <label className="lg:w-24 lg:h-24 md:w-20 md:h-20 w-16 h-16 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#7C5DFA] overflow-hidden bg-white transition-all shadow-inner">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSkillImageUpload(e, index)}
                        className="hidden"
                      />
                      {skill.image ? (
                        <div className="relative w-full h-full">
                          <Image src={skill.image} alt={skill.title} fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[10px] text-white font-bold bg-black/40 px-2 py-1 rounded">Change</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-300">
                          <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-[10px] font-bold">Pick</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="flex-grow">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Skill Title</label>
                    <input
                      type="text"
                      value={skill.title}
                      onChange={(e) => handleSkillChange(index, e.target.value)}
                      placeholder="e.g. Critical Thinking"
                      className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#7C5DFA]/20 focus:border-[#7C5DFA] transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {skills.length === 0 && (
            <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              <p className="text-slate-400 font-bold text-sm">No skills added yet.</p>
              <button
                type="button"
                onClick={addSkill}
                className="mt-4 text-[#7C5DFA] font-black text-xs uppercase tracking-widest hover:underline"
              >
                + Add First Skill
              </button>
            </div>
          )}
        </div>

        {/* Category & Elements */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Category & Elements
          </h2>

          {/* Age Category */}
          {/* Age Category */}
          <div>
            <label htmlFor="age-category-select" className="block text-sm font-medium text-gray-700 mb-1">
              Age Category *
            </label>
            <select
              id="age-category-select"
              name="ageCategory"
              value={form.ageCategory}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.ageCategory ? "border-red-500" : "border-gray-300"
                }`}
            >
              <option value="6-7">6-7 years</option>
              <option value="8-10">8-10 years</option>
              <option value="11-13">11-13 years</option>
            </select>
            {errors.ageCategory && (
              <p className="text-red-500 text-xs mt-1">{errors.ageCategory}</p>
            )}
          </div>


          {/* Core Elements (SWAGO) */}
          {/* Core Elements (SWAGO) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Core Elements (SWAGO) *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {coreElementsOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${form.coreElements.includes(option.value)
                    ? `${option.color} border-current`
                    : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={form.coreElements.includes(option.value)}
                    onChange={() => handleCoreElementToggle(option.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{option.value}</p>
                    <p className="text-xs text-gray-700">{option.label}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.coreElements && (
              <p className="text-red-500 text-xs mt-1">{errors.coreElements}</p>
            )}
          </div>

        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Product Details
          </h2>

          {/* Box Contents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Box Contents *
            </label>
            <textarea
              name="boxContents"
              value={form.boxContents}
              onChange={handleChange}
              rows={4}
              placeholder="List what's included in the box..."
              className={`w-full border rounded-md px-3 py-2 resize-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.boxContents ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.boxContents && (
              <p className="text-red-500 text-xs mt-1">{errors.boxContents}</p>
            )}
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benefits *
            </label>
            <textarea
              name="benefits"
              value={form.benefits}
              onChange={handleChange}
              rows={4}
              placeholder="List the key benefits..."
              className={`w-full border rounded-md px-3 py-2 resize-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.benefits ? "border-red-500" : "border-gray-300"
                }`}
            />
            {errors.benefits && (
              <p className="text-red-500 text-xs mt-1">{errors.benefits}</p>
            )}
          </div>
        </div>

        {/* Inventory */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Inventory
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="50"
                min="0"
                className={`w-full border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.stock ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
            </div>

            {/* Low Stock Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Alert At
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={form.lowStockThreshold}
                onChange={handleChange}
                placeholder="10"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Status
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                Featured Product (Show on homepage)
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                Active (Visible to customers)
              </span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border-2 border-gray-400 text-gray-700 font-medium rounded-lg hover:bg-gray-100 hover:border-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
