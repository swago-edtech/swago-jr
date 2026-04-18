import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Swago ',
  description: 'Learn how Swago  protects your privacy and handles your personal information',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[hsl(var(--swago-purple))] to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Your privacy matters to us. Learn how we protect and handle your information.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">

          {/* Introduction */}
          <div>
            <p className="text-lg text-slate-600 leading-relaxed mb-4">
              At Swago , we respect your privacy and are committed to protecting your personal information.
              This policy explains how we collect, use, and safeguard your data when you use our website and purchase our educational smart box.
            </p>
            <p className="text-slate-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-slate-50 p-8 rounded-xl space-y-6">

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">What Information We Collect</h2>
              <p className="text-slate-600 mb-3">We collect information necessary to provide our services:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>Name, phone number, and email address</li>
                <li>Shipping address for order delivery</li>
                <li>Order history and preferences</li>
                <li>Website usage data and cookies</li>
                <li>Phone number for OTP verification via Twilio</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">How We Use Your Information</h2>
              <p className="text-slate-600">We use your information to process orders, ship products, provide customer support, send order updates, improve our services, and maintain security. We never use your data for spam or unwanted marketing.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Information Sharing</h2>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-3">
                <p className="text-red-800 font-semibold">We Never Sell Your Data</p>
              </div>
              <p className="text-slate-600">We only share your information with payment processors (for secure payments), shipping partners (for delivery), Twilio (for OTP verification), and legal authorities when required by law.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Data Security & Your Rights</h2>
              <p className="text-slate-600 mb-3">We protect your information with SSL encryption, secure servers, and access controls. You have the right to access, correct, or delete your personal information. Contact us at swago.club@gmail.com to exercise these rights.</p>
              <p className="text-slate-600">We use cookies to improve your experience and remember your preferences. You can manage cookies through your browser settings.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Children&#39;s Privacy</h2>
              <p className="text-slate-600">While our products are for children, we don&#39;t collect information directly from children under 13. Parents or guardians make all purchases and provide information on behalf of their children.</p>
            </div>

          </div>

          {/* Contact Section */}
          <div className="bg-[hsl(var(--swago-purple))] bg-opacity-10 p-6 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Questions About Privacy?</h2>
            <p className="text-slate-600 mb-4">We&#39;re here to help with any privacy-related questions or concerns.</p>
            <div className="space-y-2 text-slate-700">
              <p><strong>Email:</strong> swago.club@gmail.com</p>
              <p><strong>Phone:</strong> +91 6283883397</p>
            </div>
            <p className="text-slate-500 text-sm mt-4">
              We may update this policy occasionally. Changes will be posted here with a new date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}