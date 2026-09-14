'use client';

import React, { useState } from 'react';

export default function ReturnGiftForm({ products = [] }: { products?: { id: string, name: string }[] }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    product: '',
    quantity: '',
    address: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/return-gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit the form');
      }

      setSuccess(true);
      setFormData({
        name: '',
        phone: '',
        email: '',
        product: '',
        quantity: '',
        address: '',
        message: '',
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center my-8">
        <h3 className="text-2xl font-bold text-green-700 mb-4">Thank You! 🎉</h3>
        <p className="text-green-600">Your bulk gifting inquiry has been submitted successfully. Our team will get in touch with you shortly.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-6 px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 max-w-4xl mx-auto w-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400"></div>
      
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Choose your product *</label>
          <select
            name="product"
            required
            value={formData.product}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all appearance-none"
          >
            <option value="" disabled>Please select</option>
            {products.length > 0 ? (
              products.map((p) => {
                const parts = p.name.split('|');
                const displayName = parts[0].trim();
                const finalName = displayName.length > 55 ? displayName.substring(0, 52) + '...' : displayName;
                return (
                  <option key={p.id} value={p.name}>{finalName}</option>
                );
              })
            ) : (
              <>
                <option value="Smart Play Kit">Smart Play Kit</option>
                <option value="Puzzle Box">Puzzle Box</option>
                <option value="Learning Flashcards">Learning Flashcards</option>
                <option value="Science Experiment Kit">Science Experiment Kit</option>
                <option value="Art & Craft Set">Art & Craft Set</option>
              </>
            )}
            <option value="Other">Other (Please specify in message)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select the quantity *</label>
          <select
            name="quantity"
            required
            value={formData.quantity}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all appearance-none"
          >
            <option value="" disabled>Please select</option>
            <option value="less than 15 units">Less than 15 units</option>
            <option value="15 - 30 units">15 - 30 units</option>
            <option value="31 - 50 units">31 - 50 units</option>
            <option value="51 - 100 units">51 - 100 units</option>
            <option value="More than 100 units">More than 100 units</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
          <input
            type="text"
            name="address"
            required
            value={formData.address}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            placeholder="Your full delivery address"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all resize-none"
            placeholder="Tell us more about your party theme or any specific requirements..."
          ></textarea>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center md:justify-start">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#6b2c91] text-white px-10 py-3 rounded-full font-bold text-lg hover:bg-[#5a237a] transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
