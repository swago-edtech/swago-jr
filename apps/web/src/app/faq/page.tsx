"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FAQ = {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
};

const CATEGORIES = {
  all: "All Questions",
  general: "General",
  shipping: "Shipping & Delivery",
  payment: "Payment & Pricing",
  products: "Products & Usage",
  returns: "Returns & Refunds",
  account: "Account & Login",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "from-gray-400 to-gray-500",
  shipping: "from-[hsl(var(--swago-sky-blue))] to-blue-500",
  payment: "from-[hsl(var(--swago-teal))] to-green-500",
  products: "from-[hsl(var(--swago-purple))] to-purple-500",
  returns: "from-[hsl(var(--swago-orange))] to-orange-500",
  account: "from-[hsl(var(--swago-pink))] to-pink-500",
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Fetch FAQs
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/faqs`);
        const data = await res.json();

        if (data.success) {
          setFaqs(data.faqs);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  // Filter FAQs
  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Toggle accordion
  const toggleFaq = (faqId: string) => {
    setOpenFaqId(openFaqId === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-[hsl(var(--swago-orange))] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-purple-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Find answers to common questions about Swago 
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Search Bar */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-800 placeholder-slate-400"
            />
            <SearchIcon />
          </div>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          className="mb-8 overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex gap-2 pb-2">
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === key
                    ? "bg-[hsl(var(--swago-purple))] text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            <p className="text-slate-500 mt-4">Loading FAQs...</p>
          </div>
        ) : filteredFAQs.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white rounded-lg shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-slate-500 text-lg">No FAQs found</p>
            <p className="text-slate-400 text-sm mt-2">
              Try changing your search or category filter
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq._id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFaq(faq._id)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium text-white bg-gradient-to-r ${
                        CATEGORY_COLORS[faq.category] || "from-gray-400 to-gray-500"
                      }`}
                    >
                      {CATEGORIES[faq.category as keyof typeof CATEGORIES]}
                    </span>
                    <span className="text-slate-800 font-medium flex-1">
                      {faq.question}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: openFaqId === faq._id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDownIcon />
                  </motion.div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {openFaqId === faq._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Contact Section */}
{/* Contact Section */}
<motion.div
  className="mt-12 bg-[hsl(var(--swago-orange))]/10 rounded-lg p-8 text-center border border-purple-100"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.6 }}
>
  <h2 className="text-2xl font-bold text-slate-800 mb-2">
    Still have questions?
  </h2>
  <p className="text-slate-600 mb-6">
    Can&apos;t find the answer you&apos;re looking for? Please get in touch with our team.
  </p>
  <div className="flex flex-col sm:flex-row gap-4 justify-center">
    <a
      href="mailto:swago.club@gmail.com"
      className="inline-flex items-center gap-2 bg-[hsl(var(--swago-purple))] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
    >
      <EmailIcon />
      Email Us
    </a>
    <a
      href="tel:+916283883397"
      className="inline-flex items-center gap-2 bg-white text-[hsl(var(--swago-orange))] px-6 py-3 rounded-lg font-medium border-2 border-[hsl(var(--swago-orange))] hover:bg-purple-50 transition-colors"
    >
      <PhoneIcon />
      Call Us
    </a>
  </div>
</motion.div>

      </div>
    </div>
  );
}

// SVG Icons
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5 text-slate-400"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const EmailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z"
    />
  </svg>
);
