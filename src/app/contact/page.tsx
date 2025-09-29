import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Swago Junior',
  description: 'Get in touch with Swago Junior for any questions about our kids learning kits',
};

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z" />
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

export default function ContactPage() {
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
                  <PhoneIcon />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Phone</h3>
                  <p className="text-slate-600">+91 6283883397</p>
                  <p className="text-sm text-slate-500 mt-1">Mon - Fri, 9 AM - 6 PM IST</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-slate-50 rounded-xl">
                <div className="text-[hsl(var(--swago-purple))]">
                  <EmailIcon />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">Email</h3>
                  <p className="text-slate-600">swago.club@gmail.com</p>
                  <p className="text-sm text-slate-500 mt-1">We&#39;ll respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-slate-50 rounded-xl">
                <div className="text-[hsl(var(--swago-purple))]">
                  <LocationIcon />
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
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <input 
                    id="firstName"
                    name="firstName"
                    type="text" 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input 
                    id="lastName"
                    name="lastName"
                    type="text" 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input 
                  id="phone"
                  name="phone"
                  type="tel" 
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <select 
                  id="subject"
                  name="subject"
                  title="Select inquiry subject"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent"
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
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea 
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent resize-none"
                  placeholder="Tell us how we can help..."
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                Send Message
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