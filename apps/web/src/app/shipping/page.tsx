import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | Swago ',
  description: 'Learn about our shipping options, delivery times, and policies for Swago educational smart box',
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[hsl(var(--swago-purple))] to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping & Delivery Policy</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Fast, secure delivery of your child&#39;s learning journey
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">

          {/* Introduction */}
          <div>
            <p className="text-lg text-slate-600 leading-relaxed">
              We&#39;re committed to getting your Swago learning smart box to you safely and promptly.
              Here&#39;s everything you need to know about our shipping and delivery process.
            </p>
          </div>

          {/* Processing Time */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Order Processing Time
            </h2>
            <p className="text-blue-700 text-lg mb-3">
              <strong>2-3 Business Days</strong> - We carefully inspect and pack each learning kit to ensure quality
            </p>
            <ul className="list-disc pl-6 space-y-2 text-blue-700">
              <li>Orders placed before 2 PM IST are prioritized for same-day processing</li>
              <li>Weekend orders are processed on the next business day</li>
              <li>You&#39;ll receive an email confirmation once your order is packed and ready to ship</li>
              <li>A tracking number will be provided once the courier picks up your package</li>
            </ul>
          </div>

          {/* Delivery Time */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
              Delivery Timeline
            </h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">Standard Delivery: 5-7 Business Days</h3>
                <p className="text-green-700">Available across India through trusted courier partners</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">Metro Cities: 3-5 Business Days</h3>
                <p className="text-green-700">Faster delivery to major cities like Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">Remote Areas: 7-10 Business Days</h3>
                <p className="text-green-700">Some remote locations may require additional delivery time</p>
              </div>
            </div>
          </div>

          {/* Shipping Charges */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-amber-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Shipping Charges
            </h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-bold text-amber-800 mb-2">Calculated at Checkout</h3>
                <p className="text-amber-700">Shipping costs are calculated based on your delivery location and order weight</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-bold text-amber-800 mb-2">Free Shipping Offers</h3>
                <p className="text-amber-700">Watch for special promotions that may include free shipping on orders above certain amounts</p>
              </div>
              <p className="text-amber-700 text-sm">
                <strong>Note:</strong> All shipping charges and delivery estimates will be clearly displayed before you complete your order.
              </p>
            </div>
          </div>

          {/* NO RETURNS POLICY - NEW SECTION */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Important: No Returns Policy
            </h2>
            <div className="bg-white p-4 rounded-lg mb-4">
              <p className="text-red-800 font-bold text-lg mb-2">All Sales Are Final</p>
              <p className="text-red-700">We do not accept returns, exchanges, or cancellations for any of our learning smart box to maintain hygiene standards and educational integrity.</p>
            </div>
            <div className="space-y-3 text-red-700">
              <p><strong>Why No Returns?</strong></p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Educational materials are designed for hands-on learning and cannot be safely redistributed</li>
                <li>We maintain strict hygiene and safety standards for all children&#39;s products</li>
                <li>Each kit is carefully inspected before shipping to ensure premium quality</li>
                <li>This policy allows us to offer competitive pricing and invest in better materials</li>
              </ul>
              <p className="text-sm mt-3">
                <strong>Please review your order carefully before completing your purchase.</strong>
              </p>
            </div>
          </div>

          {/* Delivery Information } 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-slate-800 mb-4">What You Need to Know</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>Someone must be available to receive the delivery</li>
                <li>Valid phone number is required for delivery coordination</li>
                <li>Courier will attempt delivery 2-3 times before returning</li>
                <li>Packages may be left with building security if authorized</li>
                <li>ID verification may be required for high-value orders</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Tracking Your Order</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>Tracking number sent via email and SMS</li>
                <li>Real-time updates on delivery status</li>
                <li>Estimated delivery date provided</li>
                <li>Direct contact with courier partner if needed</li>
                <li>Delivery confirmation with recipient name</li>
              </ul>
            </div>
          </div> */}

          {/* Important Notes */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-orange-800 mb-4">Important Delivery Notes</h2>
            <div className="space-y-3 text-orange-700">
              <p><strong>Address Accuracy:</strong> Please ensure your delivery address is complete and accurate. We cannot be responsible for delays or non-delivery due to incorrect addresses.</p>
              <p><strong>Weather & External Factors:</strong> Delivery times may be affected by weather conditions, natural disasters, strikes, or other circumstances beyond our control.</p>
              <p><strong>Order Changes:</strong> Once an order is placed and payment is processed, the delivery address cannot be changed. Please review carefully before completing your purchase.</p>
              <p><strong>Damage During Transit:</strong> If your package arrives damaged, please take photos and contact us within 48 hours at swago.club@gmail.com or +91 6283883397. This is the only exception where we can provide assistance.</p>
            </div>
          </div>

          {/* Coverage Areas */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">Delivery Coverage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-bold text-purple-800 mb-2">Pan-India Coverage</h3>
                <p className="text-purple-700 text-sm">We deliver to all states and union territories</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-bold text-purple-800 mb-2">Trusted Partners</h3>
                <p className="text-purple-700 text-sm">Reliable courier services with tracking</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-bold text-purple-800 mb-2">Secure Packaging</h3>
                <p className="text-purple-700 text-sm">Extra care for fragile educational materials</p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-[hsl(var(--swago-purple))] bg-opacity-10 p-6 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Shipping Questions?</h2>
            <p className="text-slate-600 mb-4">Our customer service team is here to help with any delivery-related inquiries.</p>
            <div className="space-y-2 text-slate-700">
              <p><strong>Email:</strong> swago.club@gmail.com</p>
              <p><strong>Phone:</strong> +91 6283883397</p>
              <p><strong>Hours:</strong> Mon - Fri, 9 AM - 6 PM IST</p>
            </div>
            <p className="text-slate-500 text-sm mt-4">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}