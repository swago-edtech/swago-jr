'use client';

import React, { useState, useTransition } from 'react';
import { updateGiftingConfig } from './actions';
import { Upload, X } from 'lucide-react';

export default function ConfigForm({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState({ type: '', text: '' });

  const [desktopBannerUrl, setDesktopBannerUrl] = useState(initialData?.bannerDesktopUrl || '');
  const [mobileBannerUrl, setMobileBannerUrl] = useState(initialData?.bannerMobileUrl || '');
  
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, device: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (device === 'desktop') setUploadingDesktop(true);
    else setUploadingMobile(true);

    const body = new FormData();
    body.append("file", file);

    try {
        const res = await fetch("/api/products/upload", {
            method: "POST",
            body,
        });
        const data = await res.json();
        if (data.success) {
            if (device === 'desktop') setDesktopBannerUrl(data.url);
            else setMobileBannerUrl(data.url);
        } else {
            alert(data.error || "Upload failed");
        }
    } catch (error) {
        alert("Error uploading file");
    } finally {
        if (device === 'desktop') setUploadingDesktop(false);
        else setUploadingMobile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('bannerDesktopUrl', desktopBannerUrl);
    formData.append('bannerMobileUrl', mobileBannerUrl);
    
    startTransition(async () => {
      setMessage({ type: '', text: '' });
      const res = await updateGiftingConfig(formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to save configuration.' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Desktop Banner Upload */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
            <label className="block text-sm font-medium text-gray-700">Desktop Banner Image</label>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
                Recommended 1920x500 (~4:1 Ratio)
            </span>
        </div>
        {desktopBannerUrl ? (
            <div className="relative w-full aspect-[4/1] bg-gray-100 rounded-xl overflow-hidden group border border-gray-200">
                <img src={desktopBannerUrl} alt="Desktop Banner Preview" className="w-full h-full object-cover" />
                <button
                    type="button"
                    onClick={() => setDesktopBannerUrl("")}
                    className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    title="Remove Image"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        ) : (
            <label className="flex flex-col items-center justify-center w-full aspect-[4/1] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingDesktop ? (
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                    ) : (
                        <>
                            <Upload className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="mb-2 text-sm text-gray-500 font-semibold text-center px-4">
                                Click to upload desktop banner
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG or WebP (Max 5MB)</p>
                        </>
                    )}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'desktop')} disabled={uploadingDesktop} />
            </label>
        )}
      </div>

      {/* Mobile Banner Upload */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
            <label className="block text-sm font-medium text-gray-700">Mobile Banner Image</label>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
                Recommended 800x800 or 1080x1080 (1:1 Ratio)
            </span>
        </div>
        {mobileBannerUrl ? (
            <div className="relative w-64 md:w-96 aspect-[1/1] bg-gray-100 rounded-xl overflow-hidden group border border-gray-200 mx-auto sm:mx-0">
                <img src={mobileBannerUrl} alt="Mobile Banner Preview" className="w-full h-full object-cover" />
                <button
                    type="button"
                    onClick={() => setMobileBannerUrl("")}
                    className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    title="Remove Image"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        ) : (
            <label className="flex flex-col items-center justify-center w-64 md:w-96 aspect-[1/1] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition mx-auto sm:mx-0">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingMobile ? (
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                    ) : (
                        <>
                            <Upload className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="mb-2 text-sm text-gray-500 font-semibold text-center px-4">
                                Click to upload mobile banner
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG or WebP (Max 5MB)</p>
                        </>
                    )}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'mobile')} disabled={uploadingMobile} />
            </label>
        )}
      </div>

      <div className="pt-6 border-t border-gray-200 flex justify-end">
        <button
          type="submit"
          disabled={isPending || uploadingDesktop || uploadingMobile}
          className="bg-purple-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 transition-colors shadow-sm"
        >
          {isPending ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
}
