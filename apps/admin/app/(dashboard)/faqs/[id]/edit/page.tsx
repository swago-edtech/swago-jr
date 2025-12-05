"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

type FAQ = {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
};

const CATEGORIES = {
  general: "General",
  shipping: "Shipping & Delivery",
  payment: "Payment & Pricing",
  products: "Products & Usage",
  returns: "Returns & Refunds",
  account: "Account & Login",
};

export default function EditFAQPage() {
  const router = useRouter();
  const params = useParams();
  const faqId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faq, setFaq] = useState<FAQ | null>(null);

  // Form state
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "general",
    order: "0",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch FAQ data
  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const res = await fetch(`/api/faqs/${faqId}`);
        const data = await res.json();

        if (data.success) {
          const faqData = data.faq;
          setFaq(faqData);
          setForm({
            question: faqData.question,
            answer: faqData.answer,
            category: faqData.category,
            order: faqData.order.toString(),
            isActive: faqData.isActive,
          });
        } else {
          alert("Failed to load FAQ");
          router.push("/faqs");
        }
      } catch (error) {
        console.error("Error fetching FAQ:", error);
        alert("Failed to load FAQ");
        router.push("/faqs");
      } finally {
        setLoading(false);
      }
    };

    fetchFAQ();
  }, [faqId, router]);

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

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.question.trim()) {
      newErrors.question = "Question is required";
    } else if (form.question.trim().length < 10) {
      newErrors.question = "Question must be at least 10 characters";
    }

    if (!form.answer.trim()) {
      newErrors.answer = "Answer is required";
    } else if (form.answer.trim().length < 20) {
      newErrors.answer = "Answer must be at least 20 characters";
    }

    if (!form.category) {
      newErrors.category = "Category is required";
    }

    const orderNum = parseInt(form.order);
    if (isNaN(orderNum) || orderNum < 0) {
      newErrors.order = "Order must be a positive number";
    }

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
      setSaving(true);

      const res = await fetch(`/api/faqs/${faqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category,
          order: parseInt(form.order),
          isActive: form.isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("FAQ updated successfully!");
        router.push("/faqs");
      } else {
        alert("Failed to update FAQ: " + data.error);
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      alert("Failed to update FAQ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading FAQ...</p>
      </div>
    );
  }

  if (!faq) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">FAQ not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit FAQ</h1>
          <p className="text-gray-600 mt-1">Update FAQ details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Question */}
        <div>
          <label htmlFor="question-input" className="block text-sm font-medium text-gray-700 mb-1">
            Question *
          </label>
          <input
            id="question-input"
            type="text"
            name="question"
            value={form.question}
            onChange={handleChange}
            placeholder="e.g., How long does shipping take?"
            aria-label="FAQ question"
            className={`w-full border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.question ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.question && (
            <p className="text-red-500 text-xs mt-1">{errors.question}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Minimum 10 characters. Keep it clear and concise.
          </p>
        </div>

        {/* Answer */}
        <div>
          <label htmlFor="answer-textarea" className="block text-sm font-medium text-gray-700 mb-1">
            Answer *
          </label>
          <textarea
            id="answer-textarea"
            name="answer"
            value={form.answer}
            onChange={handleChange}
            rows={6}
            placeholder="Provide a detailed answer..."
            aria-label="FAQ answer"
            className={`w-full border rounded-md px-3 py-2 resize-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.answer ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.answer && (
            <p className="text-red-500 text-xs mt-1">{errors.answer}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Minimum 20 characters. Be thorough and helpful.
          </p>
        </div>

        {/* Category & Order */}
        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category-select"
              name="category"
              value={form.category}
              onChange={handleChange}
              aria-label="FAQ category"
              className={`w-full border rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category ? "border-red-500" : "border-gray-300"
              }`}
            >
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category}</p>
            )}
          </div>

          {/* Order */}
          <div>
            <label htmlFor="order-input" className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <input
              id="order-input"
              type="number"
              name="order"
              value={form.order}
              onChange={handleChange}
              min="0"
              placeholder="0"
              aria-label="Display order number"
              className={`w-full border rounded-md px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.order ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.order && (
              <p className="text-red-500 text-xs mt-1">{errors.order}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first (0 = top)
            </p>
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="isActive-checkbox" className="flex items-center gap-2 cursor-pointer">
            <input
              id="isActive-checkbox"
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="w-4 h-4"
              aria-label="Active status"
            />
            <span className="text-sm text-gray-700">
              Active (Visible to customers)
            </span>
          </label>
        </div>

        {/* Submit Buttons */}
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
    disabled={saving}
    className="flex-1 bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
  >
    {saving ? "Saving..." : "Save Changes"}
  </button>
</div>

      </form>
    </div>
  );
}
