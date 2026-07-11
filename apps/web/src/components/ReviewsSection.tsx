"use client";

import { FaStar, FaQuoteRight } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";

const reviews = [
  {
    id: 1,
    date: "12.05.2025",
    text: "கடந்த 5 ஆண்டுகளாக நான் சரண்யா மேடம் அவர்களிடம் ஆன்லைனில் யோகா கற்று வருகிறேன். அவர் அன்பான வழிகாட்டியாக இருந்து, புதிய முயற்சிகள் மூலம் எங்களை ஊக்கப்படுத்துகிறார்; இந்த பயணம் எனக்கு உடலும் மனமும் இலகுவாக உணரச் செய்துள்ளது.",
    name: "Priya Satish",
    role: "TAMIL NADU",
    rating: 5,
  },
  {
    id: 2,
    date: "28.08.2025",
    text: "I joined Sara's classes during being diagnosed with PCOS, and her guidance made a real difference in my health. I became fitter, more energetic, mentally calmer, and saw encouraging improvement in my reports.",
    name: "Shivani Dua Arora",
    role: "ALLAHABAD",
    rating: 5,
  },
  {
    id: 3,
    date: "03.11.2025",
    text: "From my very first class, Sara mam made yoga feel safe, welcoming, and deeply personal. Her individual guidance and genuine care helped yoga become not just something I do, but something I live.",
    name: "Ramesh Grover",
    role: "FARIDABAD",
    rating: 5,
  },
  {
    id: 4,
    date: "15.01.2026",
    text: "I once came to class feeling mentally drained, and Sara ma'am's calm pacing and gentle words helped me feel lighter, calmer, and more grounded. She reminded me that healing can be quiet, gentle, and deeply personal.",
    name: "Anukriti",
    role: "FARIDABAD",
    rating: 5,
  },
];

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

function DesktopReviews({ reviews }: { reviews: any[] }) {
  const getTilt = (idx: number) => {
    const tilts = [
      "-rotate-[4deg]",
      "rotate-[3deg]",
      "-rotate-[2deg]",
      "rotate-[4deg]",
      "-rotate-[3deg]",
    ];
    return tilts[idx % tilts.length];
  };

  return (
    <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-8 select-none">
      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slideToClickedSlide={true}
        loop={true}
        slidesPerView={"auto"}
        coverflowEffect={{
          rotate: 0,
          stretch: -20,
          depth: 130,
          modifier: 1,
          slideShadows: false,
        }}
        navigation={{
          nextEl: ".swiper-button-next-custom",
          prevEl: ".swiper-button-prev-custom",
        }}
        modules={[EffectCoverflow, Navigation]}
        className="py-4 px-4"
      >
        {[...reviews, ...reviews, ...reviews].map((review, index) => (
          <SwiperSlide
            key={index}
            style={{ width: "380px", height: "auto" }}
            className="transition-all duration-300 group py-12"
          >
            {({ isActive }) => (
              <div
                className={`relative w-full h-full p-8 rounded-[2rem] flex flex-col justify-between transition-all duration-500 min-h-[320px] ${
                  isActive
                    ? "bg-[#3e2e25] text-white shadow-2xl scale-105 z-20 rotate-0"
                    : `bg-[#fcfaf6] text-[#4a4a4a] shadow-xl border border-[#efeadd] opacity-90 scale-95 ${getTilt(
                        index
                      )} group-hover:opacity-100`
                }`}
              >
                {/* Quote Icon Tab */}
                <div className="absolute top-0 right-0 overflow-hidden rounded-tr-[2rem]">
                  <div
                    className={`w-14 h-14 rounded-bl-3xl flex items-center justify-center transition-colors duration-500 ${
                      isActive ? "bg-[#2c2019]" : "bg-[#f4efe8]"
                    }`}
                  >
                    <FaQuoteRight
                      className={isActive ? "text-gray-400" : "text-[#bdae9c]"}
                      size={20}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                      <img
                        src={`https://ui-avatars.com/api/?name=${review.name}&background=random`}
                        alt={review.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4
                        className={`text-[17px] font-semibold leading-tight ${
                          isActive ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {review.name}
                      </h4>
                      <p
                        className={`text-[10px] uppercase tracking-[0.15em] font-bold mt-1 ${
                          isActive ? "text-[#a89b93]" : "text-[#9d938b]"
                        }`}
                      >
                        {review.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex text-[#f4b400] mb-5 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={
                          i < review.rating
                            ? "text-[#f4b400]"
                            : isActive
                            ? "text-gray-600"
                            : "text-[#e2d5c3]"
                        }
                        size={18}
                      />
                    ))}
                  </div>

                  <p
                    className={`text-[15px] leading-relaxed ${
                      isActive ? "text-gray-200" : "text-gray-600"
                    }`}
                  >
                    "{review.text}"
                  </p>
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Arrows */}
      <div className="flex justify-center items-center gap-6 mt-2">
        <button className="swiper-button-prev-custom w-14 h-14 rounded-full border border-[#e5d5c5] flex items-center justify-center text-gray-500 hover:bg-white transition-all hover:shadow-md bg-transparent cursor-pointer z-10 relative">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button className="swiper-button-next-custom w-14 h-14 rounded-full border border-[#e5d5c5] flex items-center justify-center text-gray-500 hover:bg-white transition-all hover:shadow-md bg-transparent cursor-pointer z-10 relative">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

const MobileReviews = ({ reviews }: { reviews: any[] }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const slider = sliderRef.current;
    const autoScroll = () => {
      if (!slider) return;
      scrollRef.current += 0.4;
      if (scrollRef.current >= slider.scrollWidth / 2) {
        scrollRef.current = 0;
      }
      slider.scrollLeft = scrollRef.current;
      animationRef.current = requestAnimationFrame(autoScroll);
    };
    animationRef.current = requestAnimationFrame(autoScroll);
    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const handleMouseEnter = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const handleMouseLeave = () => {
    animationRef.current = requestAnimationFrame(() => {
      const slider = sliderRef.current;
      const autoScroll = () => {
        if (!slider) return;
        scrollRef.current += 0.4;
        if (scrollRef.current >= slider.scrollWidth / 2) {
          scrollRef.current = 0;
        }
        slider.scrollLeft = scrollRef.current;
        animationRef.current = requestAnimationFrame(autoScroll);
      };
      autoScroll();
    });
  };

  return (
    <div
      ref={sliderRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex gap-16 overflow-hidden mt-6 px-6 md:px-16 pb-8"
    >
      {[...reviews, ...reviews].map((review, index) => (
        <div
          key={index}
          className="min-w-[320px] md:min-w-[360px] bg-white p-6 rounded-2xl shadow-sm transition hover:shadow-md border border-transparent hover:border-[#e5e5e5]"
        >
          {/* TEXT */}
          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            {review.text}
          </p>
          {/* USER */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">— {review.name}</p>
              <p className="text-xs text-gray-400">{review.role}</p>
            </div>
            {/* STARS */}
            <div className="flex text-[#f4b400]">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < review.rating ? "text-[#f4b400]" : "text-gray-300"}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ReviewsSection = ({ initialReviews }: { initialReviews?: any[] }) => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const displayReviews = initialReviews && initialReviews.length > 0 ? initialReviews : reviews;

  return (
    <section className="py-16 overflow-hidden bg-[#fcfaf6]">
      {/* ===== HEADING ===== */}
      <div className="text-center mb-12 px-6">
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-4 overflow-hidden md:overflow-visible">
          <div className="h-[1px] w-10 md:w-24 bg-[#c89b3c]"></div>
          <h2 className="text-xl md:text-3xl font-semibold whitespace-nowrap">
            Our Customer Reviews
          </h2>
          <div className="h-[1px] w-10 md:w-24 bg-[#c89b3c]"></div>
        </div>
        {/* STARS */}
        <div className="flex justify-center gap-1 text-[#f4b400] text-xl mb-2">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} />
          ))}
        </div>
        <p className="text-gray-500 text-sm">15+ Reviews</p>
      </div>

      {isDesktop ? <DesktopReviews reviews={displayReviews} /> : <MobileReviews reviews={displayReviews} />}
    </section>
  );
};

export default ReviewsSection;
