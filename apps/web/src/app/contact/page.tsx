'use client';

import { useState, FormEvent } from 'react';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit form');
      }

      // Success!
      setSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[hsl(var(--swago-purple))] to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Have questions about our learning kits? We&#39;re here to help your child&#39;s learning journey!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-6">Get in Touch</h2>
              <p className="text-slate-600 text-lg mb-8">
                We&#39;d love to hear from you! Whether you have questions about our products, 
                need help with an order, or want to learn more about how Swago Junior can 
                benefit your child&#39;s learning.
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-6 bg-slate-50 rounded-xl">
                <div className="text-[hsl(var(--swago-purple))]">
                  <FiPhone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Phone</h3>
                  <p className="text-slate-600">+91 6283883397</p>
                  <p className="text-sm text-slate-500 mt-1">Mon - Fri, 9 AM - 6 PM IST</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-slate-50 rounded-xl">
                <div className="text-[hsl(var(--swago-purple))]">
                  <FiMail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Email</h3>
                  <p className="text-slate-600">swago.club@gmail.com</p>
                  <p className="text-sm text-slate-500 mt-1">We&#39;ll respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-slate-50 rounded-xl">
                <div className="text-[hsl(var(--swago-purple))]">
                  <FiMapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Address</h3>
                  <p className="text-slate-600">
                    Swago Junior<br />
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-50 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Send us a Message</h2>
            
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <p className="font-medium">✓ Message sent successfully!</p>
                <p className="text-sm mt-1">We&#39;ll get back to you within 24 hours.</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <p className="font-medium">✗ {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
                    placeholder="Your first name"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
                    placeholder="Your last name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
                  placeholder="your.email@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input 
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select 
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  title="Select inquiry subject"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Select a topic</option>
                  <option value="product">Product Questions</option>
                  <option value="order">Order Support</option>
                  <option value="shipping">Shipping & Delivery</option>
                  <option value="general">General Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea 
                  id="message"
                  name="message"
                  rows={5}
                  required
                  minLength={10}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent resize-none"
                  placeholder="Tell us how we can help... (min 10 characters)"
                  disabled={loading}
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">What age groups are your kits for?</h3>
              <p className="text-slate-600">Our learning kits are designed for children aged 5-10 years, with specific products tailored for 5-7 years and 8-10 years age groups.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">How long does shipping take?</h3>
              <p className="text-slate-600">We typically process and ship orders within 2-3 business days. Delivery usually takes 5-7 business days depending on your location.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">What&#39;s your quality guarantee?</h3>
              <p className="text-slate-600">We thoroughly inspect every kit before shipping to ensure the highest quality. Our products are designed to provide lasting educational value for your child.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">Are the materials safe for children?</h3>
              <p className="text-slate-600">Absolutely! All our learning kits use child-safe, non-toxic materials and meet international safety standards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
