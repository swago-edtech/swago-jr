import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Swago ',
  description: 'Terms and conditions for using Swago services and purchasing our educational smart box',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[hsl(var(--swago-purple))] to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Please read these terms carefully before using our services
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none">

          {/* Introduction */}
          <div className="mb-12">
            <p className="text-lg text-slate-600 leading-relaxed">
              Welcome to Swago! These Terms and Conditions (&quot;Terms&quot;) govern your use of our website,
              services, and the purchase of our educational learning smart box. By accessing our website or
              purchasing our products, you agree to be bound by these Terms.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="mb-12 p-6 bg-slate-50 rounded-xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Table of Contents</h2>
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <a href="#acceptance" className="text-[hsl(var(--swago-purple))] hover:underline">1. Acceptance of Terms</a>
              <a href="#products" className="text-[hsl(var(--swago-purple))] hover:underline">2. Product Information</a>
              <a href="#ordering" className="text-[hsl(var(--swago-purple))] hover:underline">3. Ordering & Payment</a>
              <a href="#shipping" className="text-[hsl(var(--swago-purple))] hover:underline">4. Shipping & Delivery</a>
              <a href="#returns" className="text-[hsl(var(--swago-purple))] hover:underline">5. Returns Policy</a>
              <a href="#intellectual" className="text-[hsl(var(--swago-purple))] hover:underline">6. Intellectual Property</a>
              <a href="#privacy" className="text-[hsl(var(--swago-purple))] hover:underline">7. Privacy & Data</a>
              <a href="#liability" className="text-[hsl(var(--swago-purple))] hover:underline">8. Limitation of Liability</a>
              <a href="#changes" className="text-[hsl(var(--swago-purple))] hover:underline">9. Changes to Terms</a>
              <a href="#contact" className="text-[hsl(var(--swago-purple))] hover:underline">10. Contact Information</a>
            </nav>
          </div>

          {/* Terms Content */}
          <div className="space-y-12">

            {/* 1. Acceptance of Terms */}
            <section id="acceptance">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">1. Acceptance of Terms</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  By accessing and using the Swago website (www.swagojr.com) and purchasing our products,
                  you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
                <p>
                  If you do not agree with any part of these terms, you must not use our website or purchase our products.
                </p>
                <p>
                  These terms apply to all visitors, users, and customers of Swago services.
                </p>
              </div>
            </section>

            {/* 2. Product Information */}
            <section id="products">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">2. Product Information & Availability</h2>
              <div className="space-y-4 text-slate-600">
                <h3 className="text-xl font-semibold text-slate-800">Product Descriptions</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We strive to provide accurate product descriptions, images, and specifications</li>
                  <li>All learning smart box are designed for specific age groups as indicated on product pages</li>
                  <li>Colors and appearance may vary slightly from images due to monitor settings</li>
                  <li>We reserve the right to modify product specifications without prior notice</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Product Availability</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All products are subject to availability</li>
                  <li>We reserve the right to discontinue products at any time</li>
                  <li>In case of unavailability after order placement, we will notify you and process a full refund</li>
                </ul>
              </div>
            </section>

            {/* 3. Ordering & Payment */}
            <section id="ordering">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">3. Ordering & Payment</h2>
              <div className="space-y-4 text-slate-600">
                <h3 className="text-xl font-semibold text-slate-800">Order Process</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All orders are subject to acceptance and availability</li>
                  <li>We reserve the right to refuse or cancel orders at our discretion</li>
                  <li>Order confirmation will be sent via email after successful payment</li>
                  <li>Orders cannot be cancelled once payment is processed</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Payment Terms</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payment is required in full at the time of order placement</li>
                  <li>We accept major credit cards, debit cards, and digital payment methods</li>
                  <li>All prices are in Indian Rupees (INR) and include applicable taxes</li>
                  <li>Payment processing is handled by secure third-party providers</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Pricing</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All prices are subject to change without prior notice</li>
                  <li>The price applicable is the one displayed at the time of order placement</li>
                  <li>Any applicable taxes and shipping charges will be clearly displayed before payment</li>
                </ul>
              </div>
            </section>

            {/* 4. Shipping & Delivery */}
            <section id="shipping">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">4. Shipping & Delivery</h2>
              <div className="space-y-4 text-slate-600">
                <h3 className="text-xl font-semibold text-slate-800">Delivery Timeline</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Orders are typically processed within 2-3 business days</li>
                  <li>Standard delivery takes 5-7 business days from dispatch</li>
                  <li>Delivery times may vary based on location and external factors</li>
                  <li>We are not responsible for delays caused by courier services or natural disasters</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Shipping Charges</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Shipping charges are calculated based on delivery location and order value</li>
                  <li>Free shipping may be available for orders above certain value thresholds</li>
                  <li>All shipping costs will be displayed before order confirmation</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Delivery Requirements</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Accurate delivery address must be provided at the time of ordering</li>
                  <li>Someone must be available to receive the delivery during business hours</li>
                  <li>We are not responsible for packages left unattended as per delivery instructions</li>
                </ul>
              </div>
            </section>

            {/* 5. Returns Policy */}
            <section id="returns">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">5. Returns & Cancellation Policy</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-red-800 mb-3">No Returns Policy</h3>
                <p className="text-red-700">
                  <strong>All sales are final.</strong> We do not accept returns, exchanges, or cancellations
                  for any of our learning smart box to maintain hygiene standards and educational integrity.
                </p>
              </div>
              <div className="space-y-4 text-slate-600">
                <h3 className="text-xl font-semibold text-slate-800">Damage During Shipping</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>If your order arrives damaged, contact us within 48 hours of delivery</li>
                  <li>Provide photos of the damaged items and packaging</li>
                  <li>We will investigate and provide appropriate resolution for shipping damage</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Wrong Item Delivered</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>If you receive an incorrect item, notify us within 48 hours</li>
                  <li>We will arrange pickup of the incorrect item and send the right product</li>
                  <li>This applies only to errors on our part, not customer ordering mistakes</li>
                </ul>
              </div>
            </section>

            {/* 6. Intellectual Property */}
            <section id="intellectual">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">6. Intellectual Property Rights</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  All content on the Swago website, including but not limited to text, graphics,
                  logos, images, product designs, and educational materials, are the property of Swago
                  and are protected by intellectual property laws.
                </p>
                <h3 className="text-xl font-semibold text-slate-800">Permitted Use</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You may use our website for personal, non-commercial purposes only</li>
                  <li>You may not reproduce, distribute, or create derivative works from our content</li>
                  <li>Educational materials in purchased smart box are for personal learning use only</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Prohibited Activities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Reproducing or reselling our educational materials</li>
                  <li>Using our content for commercial purposes without permission</li>
                  <li>Reverse engineering or copying our product designs</li>
                  <li>Using automated systems to access our website</li>
                </ul>
              </div>
            </section>

            {/* 7. Privacy & Data */}
            <section id="privacy">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">7. Privacy & Data Protection</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  Your privacy is important to us. Please review our Privacy Policy to understand
                  how we collect, use, and protect your personal information.
                </p>
                <h3 className="text-xl font-semibold text-slate-800">Data Collection</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We collect information necessary to process orders and provide customer service</li>
                  <li>We use secure payment processors and do not store credit card information</li>
                  <li>We may use cookies to improve your browsing experience</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Data Usage</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your data is used solely for order processing and customer communication</li>
                  <li>We do not sell or share your personal information with third parties</li>
                  <li>You may request data deletion by contacting our support team</li>
                </ul>
              </div>
            </section>

            {/* 8. Limitation of Liability */}
            <section id="liability">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">8. Limitation of Liability</h2>
              <div className="space-y-4 text-slate-600">
                <h3 className="text-xl font-semibold text-slate-800">Service Disclaimer</h3>
                <p>
                  Our services and products are provided &quot;as is&quot; without any warranties, express or implied.
                  We strive to provide accurate information but do not guarantee the completeness or accuracy
                  of all content on our website.
                </p>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Liability Limitations</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Our liability is limited to the cost of the purchased product</li>
                  <li>We are not liable for indirect, incidental, or consequential damages</li>
                  <li>We are not responsible for educational outcomes or learning results</li>
                  <li>Use of our products is at your own risk and discretion</li>
                </ul>

                <h3 className="text-xl font-semibold text-slate-800 mt-6">Safety Notice</h3>
                <p className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <strong>Important:</strong> Adult supervision is recommended for children using our learning smart box.
                  While our products meet safety standards, proper supervision ensures safe and effective learning.
                </p>
              </div>
            </section>

            {/* 9. Changes to Terms */}
            <section id="changes">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">9. Changes to Terms</h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  We reserve the right to modify these Terms and Conditions at any time. Changes will be
                  effective immediately upon posting on our website. Your continued use of our services
                  after changes are posted constitutes acceptance of the revised terms.
                </p>
                <p>
                  We recommend reviewing these terms periodically to stay informed of any updates.
                </p>
              </div>
            </section>

            {/* 10. Contact Information */}
            <section id="contact">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">10. Contact Information</h2>
              <div className="bg-slate-50 p-6 rounded-xl">
                <p className="text-slate-600 mb-4">
                  If you have any questions about these Terms and Conditions, please contact us:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                  <div>
                    <strong>Email:</strong> swago.club@gmail.com
                  </div>
                  <div>
                    <strong>Phone:</strong> +91 6283883397
                  </div>
                </div>
                <div className="mt-4">
                  <strong>Address:</strong> Swago , India
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-16 p-6 bg-slate-100 rounded-xl text-center">
            <p className="text-slate-600">
              <strong>Last updated:</strong> {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-slate-500 mt-2 text-sm">
              These terms are governed by the laws of India.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}