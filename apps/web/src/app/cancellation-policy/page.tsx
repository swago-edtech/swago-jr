import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation Policy | Swago ',
  description: 'Learn about our cancellation policy for Swago  educational kits',
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[hsl(var(--swago-purple))] to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cancellation Policy</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Our commitment to quality means all orders are processed immediately
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          
          {/* Introduction */}
          <div>
            <p className="text-lg text-slate-600 leading-relaxed">
              At Swago , we begin processing your order immediately to ensure fast delivery of our premium educational kits. 
              This policy explains our cancellation terms and the reasons behind our approach.
            </p>
          </div>

          {/* No Cancellation Policy */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-red-800 mb-6 flex items-center">
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              No Cancellation Policy
            </h2>
            <div className="bg-white p-6 rounded-lg mb-6">
              <p className="text-red-800 font-bold text-xl mb-3">Orders Cannot Be Cancelled</p>
              <p className="text-red-700 text-lg">
                Once an order is placed and payment is processed, it cannot be cancelled. We begin preparing your learning kit immediately to ensure quick delivery.
              </p>
            </div>
          </div>

          {/* Why No Cancellations */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Why We Don&apos;t Accept Cancellations</h2>
            <div className="space-y-6">
              
              <div className="flex items-start space-x-4">
                <div className="bg-blue-600 text-white rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 mb-2">Immediate Processing</h3>
                  <p className="text-blue-700">We start quality inspection and packaging within hours of order placement to ensure the fastest possible delivery to your child.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-600 text-white rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 mb-2">Quality Assurance</h3>
                  <p className="text-blue-700">Each kit undergoes thorough inspection and customization based on your child&apos;s age group, making it ready specifically for your order.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-600 text-white rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 mb-2">Fast Delivery Promise</h3>
                  <p className="text-blue-700">Our no-cancellation policy allows us to maintain our promise of 2-3 day processing and quick delivery times.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-600 text-white rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 mb-2">Cost Efficiency</h3>
                  <p className="text-blue-700">This policy helps us offer competitive pricing by reducing administrative overhead and inventory management costs.</p>
                </div>
              </div>
            </div>
          </div>

          {/* What We Offer Instead */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-green-800 mb-6">What We Offer Instead</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 rounded-lg border border-green-200">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-bold text-green-800">Detailed Information</h3>
                </div>
                <p className="text-green-700 text-sm">Comprehensive product descriptions, age recommendations, and kit contents to help you make informed decisions.</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-green-200">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364" />
                  </svg>
                  <h3 className="font-bold text-green-800">Pre-Purchase Support</h3>
                </div>
                <p className="text-green-700 text-sm">Our customer service team is available to answer questions and help you choose the perfect kit before ordering.</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-green-200">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-bold text-green-800">Quality Guarantee</h3>
                </div>
                <p className="text-green-700 text-sm">Every kit is thoroughly inspected before shipping to ensure you receive exactly what&apos;s described in perfect condition.</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-green-200">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <h3 className="font-bold text-green-800">Post-Purchase Support</h3>
                </div>
                <p className="text-green-700 text-sm">If you have questions about using the kit or need guidance, our support team is here to help maximize your child&apos;s learning experience.</p>
              </div>
            </div>
          </div>

          {/* Important Reminder */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-amber-800 mb-4">⚠️ Important Reminder</h2>
            <div className="space-y-3 text-amber-700">
              <p><strong>Please Review Carefully:</strong> Make sure to review your order details, including product selection, child&apos;s age, and delivery address before completing your purchase.</p>
              <p><strong>No Refunds:</strong> As per our returns policy, we also do not provide refunds for any orders.</p>
              <p><strong>Have Questions?</strong> Contact our customer service team before placing your order if you need any clarification about products or policies.</p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-[hsl(var(--swago-purple))] bg-opacity-10 p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Questions Before Ordering?</h2>
            <p className="text-slate-600 mb-6">Our customer service team is here to help you make the right choice for your child&apos;s learning journey.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Support
                </h3>
                <p className="text-slate-600 text-lg font-medium">swago.club@gmail.com</p>
                <p className="text-slate-500 text-sm mt-2">Response within 24 hours</p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone Support
                </h3>
                <p className="text-slate-600 text-lg font-medium">+91 6283883397</p>
                <p className="text-slate-500 text-sm mt-2">Mon-Fri, 9 AM - 6 PM IST</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center p-6 bg-slate-100 rounded-xl">
            <p className="text-slate-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-slate-500 mt-2 text-sm">
              This policy is designed to ensure the best service and fastest delivery for our customers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}