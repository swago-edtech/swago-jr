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
    ageCategory: "5-7",
    coreElements: [] as string[],
    boxContents: "",
    benefits: "",
    stock: "0",
    lowStockThreshold: "10",
    isFeatured: false,
    isActive: true,
  });

  const [images, setImages] = useState<string[]>([]);
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

  // Remove image
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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
          ageCategory: form.ageCategory,
          coreElements: form.coreElements,
          boxContents: form.boxContents,
          benefits: form.benefits,
          stock: parseInt(form.stock),
          lowStockThreshold: parseInt(form.lowStockThreshold),
          isFeatured: form.isFeatured,
          isActive: form.isActive,
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
              className={`w-full border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
              className={`w-full border rounded-md px-3 py-2 resize-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? "border-red-500" : "border-gray-300"
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
                className={`w-full border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? "border-red-500" : "border-gray-300"
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
    className={`w-full border rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      errors.ageCategory ? "border-red-500" : "border-gray-300"
    }`}
  >
    <option value="5-7">5-7 years</option>
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
        className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition ${
          form.coreElements.includes(option.value)
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
              className={`w-full border rounded-md px-3 py-2 resize-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.boxContents ? "border-red-500" : "border-gray-300"
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
              className={`w-full border rounded-md px-3 py-2 resize-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.benefits ? "border-red-500" : "border-gray-300"
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
                className={`w-full border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.stock ? "border-red-500" : "border-gray-300"
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
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
