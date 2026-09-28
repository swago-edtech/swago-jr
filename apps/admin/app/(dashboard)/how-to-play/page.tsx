"use client";

import { useEffect, useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl, getYouTubeVideoId, slugify } from "@swago/utils";

type HowToPlayVideo = {
  _id: string;
  slug: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  description: string;
  productId: { _id: string; name: string } | null;
  isActive: boolean;
};

type ProductOption = { _id: string; name: string };

type FormState = {
  title: string;
  slug: string;
  youtubeUrl: string;
  description: string;
  productId: string;
  isActive: boolean;
};

type Message = { type: "success" | "error"; text: string };

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  youtubeUrl: "",
  description: "",
  productId: "",
  isActive: true,
};

const INPUT_CLASS =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function toFormState(video: HowToPlayVideo): FormState {
  return {
    title: video.title,
    slug: video.slug,
    youtubeUrl: video.youtubeUrl,
    description: video.description || "",
    productId: video.productId?._id || "",
    isActive: video.isActive,
  };
}

// Admin runs on :3001 locally (storefront on :3000) and on admin.<domain> in production.
function getStorefrontOrigin(): string {
  const { protocol, hostname, port } = window.location;
  if (port === "3001") return `${protocol}//${hostname}:3000`;
  return `${protocol}//${hostname.replace(/^admin\./, "")}`;
}

export default function HowToPlayConfigPage() {
  const [videos, setVideos] = useState<HowToPlayVideo[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [storefrontOrigin, setStorefrontOrigin] = useState("");

  const previewId = getYouTubeVideoId(form.youtubeUrl);
  const submitLabel = editingId ? "Save Changes" : "Add Video";

  function showMessage(type: Message["type"], text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function pageUrl(slug: string): string {
    return `${storefrontOrigin}/how-to-play/${slug}`;
  }

  async function fetchVideos() {
    const res = await fetch("/api/how-to-play");
    const data = await res.json();
    if (data.success) setVideos(data.videos);
  }

  useEffect(() => {
    setStorefrontOrigin(getStorefrontOrigin());

    const loadProducts = fetch("/api/products?isActive=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProducts(data.products);
      });

    Promise.all([fetchVideos(), loadProducts])
      .catch((error) => console.error("Error loading how-to-play config:", error))
      .finally(() => setLoading(false));
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSlugTouched(false);
  }

  function startEdit(video: HowToPlayVideo) {
    setForm(toFormState(video));
    setEditingId(video._id);
    setSlugTouched(true);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!previewId) {
      showMessage("error", "Enter a valid YouTube link");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/how-to-play/${editingId}` : "/api/how-to-play", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, productId: form.productId || null }),
      });
      const data = await res.json();

      if (!data.success) {
        showMessage("error", data.error || "Failed to save video");
        return;
      }

      showMessage("success", editingId ? "Video updated" : "Video added");
      resetForm();
      await fetchVideos();
    } catch (error) {
      console.error("Error saving how-to-play video:", error);
      showMessage("error", "Failed to save video");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(video: HowToPlayVideo) {
    if (!confirm(`Delete "${video.title}"?\n\n/how-to-play/${video.slug} will stop working.`)) return;

    setDeleting(video._id);
    try {
      const res = await fetch(`/api/how-to-play/${video._id}`, { method: "DELETE" });
      const data = await res.json();

      if (!data.success) {
        showMessage("error", data.error || "Failed to delete video");
        return;
      }

      if (editingId === video._id) resetForm();
      showMessage("success", "Video deleted");
      await fetchVideos();
    } catch (error) {
      console.error("Error deleting how-to-play video:", error);
      showMessage("error", "Failed to delete video");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">How to Play Videos</h1>
        <p className="text-gray-600 mt-1">
          Each video gets its own page at{" "}
          <span className="font-mono text-sm text-gray-800">/how-to-play/&lt;route&gt;</span>
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingId ? "Edit Video" : "Add Video"}
          </h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-blue-600 hover:underline">
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="htp-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="htp-title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Seek Rush"
                maxLength={150}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="htp-slug" className="block text-sm font-medium text-gray-700 mb-1">
                Route *
              </label>
              <div className="flex rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent overflow-hidden">
                <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-300 whitespace-nowrap">
                  /how-to-play/
                </span>
                <input
                  id="htp-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    updateField("slug", slugify(e.target.value));
                  }}
                  placeholder="seek-rush"
                  className="flex-1 min-w-0 px-3 py-2 text-sm text-black placeholder-gray-400 outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Filled from the title. Lowercase letters, numbers and dashes.</p>
            </div>

            <div>
              <label htmlFor="htp-youtube" className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Link *
              </label>
              <input
                id="htp-youtube"
                value={form.youtubeUrl}
                onChange={(e) => updateField("youtubeUrl", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={INPUT_CLASS}
              />
              {form.youtubeUrl && !previewId && (
                <p className="text-xs text-red-600 mt-1">Not a recognised YouTube link</p>
              )}
            </div>

            <div>
              <label htmlFor="htp-product" className="block text-sm font-medium text-gray-700 mb-1">
                Linked Product
              </label>
              <select
                id="htp-product"
                value={form.productId}
                onChange={(e) => updateField("productId", e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">No product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Optional. Shows a buy button under the video.</p>
            </div>

            <div>
              <label htmlFor="htp-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="htp-description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                placeholder="Optional short intro shown under the video"
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="htp-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="htp-active" className="text-sm font-medium text-gray-700">
                Show this page on the website
              </label>
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-1">Preview</p>
            <div className="aspect-video rounded-md overflow-hidden bg-gray-100 border border-gray-200">
              {previewId ? (
                <iframe
                  src={getYouTubeEmbedUrl(previewId)}
                  title="Video preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <PlayCircle className="w-10 h-10 mb-2" />
                  <p className="text-xs">Paste a YouTube link to preview</p>
                </div>
              )}
            </div>
            {form.slug && (
              <p className="text-xs text-gray-500 mt-2 font-mono break-all">{pageUrl(form.slug)}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>

      {/* Videos List */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading videos...</p>
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No how-to-play videos yet. Add your first one above.</p>
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </div>
          <ul className="divide-y divide-gray-200">
            {videos.map((video) => (
              <li
                key={video._id}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 ${
                  editingId === video._id ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <img
                    src={getYouTubeThumbnailUrl(video.youtubeVideoId)}
                    alt=""
                    className="w-24 sm:w-32 aspect-video object-cover rounded-md bg-gray-100 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${
                          video.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {video.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <a
                      href={pageUrl(video.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-mono break-all mt-1"
                    >
                      /how-to-play/{video.slug}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    {video.productId && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">Product: {video.productId.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-3">
                  <button onClick={() => startEdit(video)} className="text-sm text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(video)}
                    disabled={deleting === video._id}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deleting === video._id ? "..." : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
