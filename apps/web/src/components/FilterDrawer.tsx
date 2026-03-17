"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronUp, HiChevronDown } from "react-icons/hi";
import { Filters } from "./FilterSidebar";

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  totalResults: number;
};

export default function FilterDrawer({ isOpen, onClose, filters, setFilters, totalResults }: FilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[85%] md:w-[400px] bg-white z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 pb-2 flex items-center justify-between border-b border-slate-50 relative">
              <h2 className="text-2xl font-black text-slate-800">Refine By</h2>
              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-black transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
              {/* Price Filter Section */}
              <FilterSection title="PRICE" defaultOpen={true}>
                <PriceSlider 
                  min={filters.minPrice ?? 0}
                  max={filters.maxPrice ?? 3000}
                  onChange={(min, max) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
                />
              </FilterSection>

              {/* Age Group Filter Section */}
              <FilterSection title="AGE GROUP" defaultOpen={true}>
                <div className="flex flex-col gap-4 mt-2">
                  {[
                    { label: "2+", count: 1 },
                    { label: "3+", count: 21 },
                    { label: "4+", count: 5 },
                    { label: "5+", count: 2 },
                    { label: "6+", count: 1 }
                  ].map(age => {
                    const value = age.label.replace('+', '');
                    // For mapping to existing structure: match labels or convert
                    // Assuming age values map to strings like "2", "3", etc.
                    return (
                      <label key={age.label} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox"
                            checked={filters.age === age.label}
                            onChange={() => setFilters({ ...filters, age: filters.age === age.label ? '' : age.label })}
                            className="w-5 h-5 border-2 border-slate-300 rounded-sm appearance-none checked:bg-black checked:border-black transition-colors cursor-pointer"
                          />
                          <svg className={`absolute w-3 h-3 text-white pointer-events-none transform transition-transform ${filters.age === age.label ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-base text-slate-700 font-medium group-hover:text-black">
                          {age.label} ({age.count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </FilterSection>

              {/* Product Type Section */}
              <FilterSection title="PRODUCT TYPE" defaultOpen={true}>
                <div className="flex flex-col gap-4 mt-2">
                  {[
                    { label: "Activity Kit", id: "Activity", count: 22 },
                    { label: "Construction Type", id: "Construction", count: 1 },
                    { label: "Educational Toys", id: "Educational", count: 8 }
                  ].map(type => (
                    <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox"
                          checked={filters.elements.includes(type.id)}
                          onChange={() => {
                            const current = filters.elements;
                            const next = current.includes(type.id)
                              ? current.filter(id => id !== type.id)
                              : [...current, type.id];
                            setFilters({ ...filters, elements: next });
                          }}
                          className="w-5 h-5 border-2 border-slate-300 rounded-sm appearance-none checked:bg-black checked:border-black transition-colors cursor-pointer"
                        />
                        <svg className={`absolute w-3 h-3 text-white pointer-events-none transform transition-transform ${filters.elements.includes(type.id) ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-base text-slate-700 font-medium group-hover:text-black">
                        {type.label} ({type.count})
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-4 bg-white">
              <button
                onClick={() => {
                   setFilters({ ...filters, search: "", age: "", elements: [], minPrice: undefined, maxPrice: undefined });
                }}
                className="flex-1 py-4 border-2 border-black transition text-black bg-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-slate-50 active:scale-[0.98]"
              >
                Clear All
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-black text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors shadow-lg active:scale-[0.98]"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FilterSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between group"
      >
        <span className="text-sm font-black text-slate-700 tracking-[0.1em] uppercase">
          {title}
        </span>
        {isOpen ? (
          <HiChevronUp className="w-6 h-6 text-slate-400 group-hover:text-black transition-colors" />
        ) : (
          <HiChevronDown className="w-6 h-6 text-slate-400 group-hover:text-black transition-colors" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-8">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const pricePoints = [0, 499, 899, 999, 1500, 3000];

function PriceSlider({ min, max, onChange }: { min: number, max: number, onChange: (min: number, max: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const minIdx = pricePoints.findIndex(p => p === min);
  const maxIdx = pricePoints.findIndex(p => p === max);

  const safeMinIdx = minIdx === -1 ? 0 : minIdx;
  const safeMaxIdx = maxIdx === -1 ? pricePoints.length - 1 : maxIdx;

  const getPercentage = (index: number) => (index / (pricePoints.length - 1)) * 100;

  const handleInteraction = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percent * (pricePoints.length - 1));

    const distMin = Math.abs(index - safeMinIdx);
    const distMax = Math.abs(index - safeMaxIdx);

    if (distMin < distMax) {
      if (index <= safeMaxIdx) onChange(pricePoints[index], pricePoints[safeMaxIdx]);
    } else {
      if (index >= safeMinIdx) onChange(pricePoints[safeMinIdx], pricePoints[index]);
    }
  };

  return (
    <div className="w-full pt-4">
      {/* Slider Visual */}
      <div 
        ref={trackRef}
        className="relative h-[6px] w-full bg-slate-100 rounded-full cursor-pointer mb-10"
        onMouseDown={(e) => handleInteraction(e.clientX)}
      >
        <div className="absolute inset-0 bg-slate-900/10 rounded-full" />
        <motion.div 
          className="absolute h-full bg-slate-900 rounded-full"
          initial={false}
          animate={{ 
            left: `${getPercentage(safeMinIdx)}%`, 
            width: `${getPercentage(safeMaxIdx) - getPercentage(safeMinIdx)}%` 
          }}
        />
        
        {/* Thumbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-slate-900 rounded-full cursor-pointer pointer-events-auto border-4 border-white shadow-sm"
            animate={{ left: `${getPercentage(safeMinIdx)}%` }}
            initial={false}
            onMouseDown={(e) => {
              e.stopPropagation();
              // Add dragging logic if needed, but for now interaction handles click-to-move
            }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 bg-slate-900 rounded-full cursor-pointer pointer-events-auto border-4 border-white shadow-sm"
            animate={{ left: `${getPercentage(safeMaxIdx)}%` }}
            initial={false}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          />
        </div>
      </div>

      {/* Input Fields */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center border border-slate-200 rounded-md px-3 py-2.5 bg-white">
          <span className="text-slate-500 mr-2 text-lg">₹</span>
          <input 
            type="text" 
            value={pricePoints[safeMinIdx]}
            readOnly
            className="w-full text-right outline-none text-slate-400 font-medium bg-transparent"
          />
        </div>
        <span className="text-slate-500 font-medium">To</span>
        <div className="flex-1 flex items-center border border-slate-200 rounded-md px-3 py-2.5 bg-white">
          <span className="text-slate-500 mr-2 text-lg">₹</span>
          <input 
            type="text" 
            value={pricePoints[safeMaxIdx].toFixed(1)}
            readOnly
            className="w-full text-right outline-none text-slate-400 font-medium bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}
