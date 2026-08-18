import React from 'react';
import Image from 'next/image';
import ReturnGiftForm from './ReturnGiftForm';
import { Metadata } from 'next';
import { connectDB, Product } from '@swago/database';

export const metadata: Metadata = {
  title: 'Return Gifts & Bulk Gifting | SWAGO',
  description: 'Special prices on bulk gifting orders for kids. Beautifully wrapped return gifts that kids actually play with.',
};

async function getGiftingConfig() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/return-gifts`, {
      next: { revalidate: 60 } // Revalidate every minute
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching gifting config', error);
    return null;
  }
}

export default async function ReturnGiftsPage() {
  const config = await getGiftingConfig();
  
  // Fetch active products for the form
  let activeProducts: { id: string, name: string }[] = [];
  try {
    await connectDB();
    const products = await Product.find({ isActive: true }).select('_id name').sort({ name: 1 }).lean();
    activeProducts = products.map((p: any) => ({ id: p._id.toString(), name: p.name }));
  } catch (error) {
    console.error('Error fetching products for return gifts', error);
  }
  
  const defaultBannerDesktop = '/images/gifting-banner.png'; // fallback
  const defaultBannerMobile = '/images/gifting-banner.png'; // fallback

  const desktopBannerUrl = config?.bannerDesktopUrl || defaultBannerDesktop;
  const mobileBannerUrl = config?.bannerMobileUrl || defaultBannerMobile;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Dynamic Banner Section */}
      <section className="w-full relative bg-purple-50">
        {/* Desktop Banner */}
        <div className="hidden md:block w-full relative h-[400px] lg:h-[500px]">
          <Image 
            src={desktopBannerUrl} 
            alt="Swago Return Gifts Banner" 
            fill 
            className="object-cover"
            priority
          />
        </div>
        {/* Mobile Banner */}
        <div className="block md:hidden w-full relative h-[300px]">
          <Image 
            src={mobileBannerUrl} 
            alt="Swago Return Gifts Banner Mobile" 
            fill 
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 font-inter tracking-tight">
            SWAGO RETURN GIFTS <span className="inline-block animate-bounce">🎁</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-medium">
            Make every celebration unforgettable with gifts designed to build focus, confidence, and connection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              🏷️
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Special Bulk Pricing</h3>
            <p className="text-gray-600">Planning for a whole party? Get exclusive special prices on bulk gifting orders.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              🎀
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Beautifully Wrapped</h3>
            <p className="text-gray-600">Every SWAGO gift comes packed and ready to make a child smile instantly.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              🛍️
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">SWAGO Carry Bags</h3>
            <p className="text-gray-600">Individually packed in our signature SWAGO carry bags, ready to hand out.</p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              🧩
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Gifts Kids Play With</h3>
            <p className="text-gray-600">Fun, screen-free gifts designed to build focus, confidence and connection.</p>
          </div>
        </div>

        {/* Form and CTA Section */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">
          
          <div className="lg:w-2/5 bg-gradient-to-br from-purple-50 to-pink-50 border-r border-gray-100 p-8 lg:p-12 text-gray-900 flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Planning a Birthday Party? 🎈</h2>
            <p className="text-lg text-gray-600 mb-10">
              Tell us your <span className="font-bold text-gray-900 underline decoration-wavy decoration-pink-300">number of kids, age group & budget</span> — we'll help you find the perfect return gifts.
            </p>
            
            <div className="bg-white/70 p-5 sm:p-6 rounded-2xl backdrop-blur-sm border border-white mb-6 shadow-sm">
              <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-3">Call for bulk orders</h3>
              <a href="tel:+916283883397" className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-purple-700 hover:text-purple-600 transition">
                📞 +91 62838 83397
              </a>
            </div>
            
            <div className="bg-white/70 p-5 sm:p-6 rounded-2xl backdrop-blur-sm border border-white mb-10 shadow-sm">
              <h3 className="font-semibold text-lg sm:text-xl text-gray-800 mb-3">Mail us</h3>
              <a href="mailto:support@swagojr.com" className="text-base sm:text-lg font-medium flex items-center gap-3 text-purple-700 hover:text-purple-600 transition break-all">
                ✉️ support@swagojr.com
              </a>
            </div>

            <a 
              href="https://wa.me/916283883397?text=Hi!%20I'm%20looking%20for%20bulk%20gifting%20options."
              target="_blank"
              rel="noreferrer"
              className="mt-auto bg-[#25D366] text-white font-bold text-sm sm:text-lg py-4 px-6 rounded-full flex items-center justify-center gap-2 sm:gap-3 hover:bg-[#1ebd5b] transition-all transform hover:scale-105 shadow-md shadow-green-500/20 text-center leading-tight"
            >
              <span>WHATSAPP US FOR BULK GIFTING</span>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
          </div>
          
          <div className="lg:w-3/5 p-2 sm:p-8">
             <ReturnGiftForm products={activeProducts} />
          </div>

        </div>
      </section>
    </div>
  );
}
