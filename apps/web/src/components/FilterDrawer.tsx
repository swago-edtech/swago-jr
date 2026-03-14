"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronRight } from "react-icons/hi";
import { Filters } from "./FilterSidebar";

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  totalResults: number;
};

export default function FilterDrawer({ isOpen, onClose, filters, setFilters, totalResults }: FilterDrawerProps) {
  // We'll manage sections internal to FilterSection components


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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[85%] md:w-[400px] bg-white z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-100 relative">
              <div className="w-full text-center">
                <h2 className="text-sm font-bold tracking-wider uppercase text-[hsl(var(--swago-purple))]">Filters</h2>
              </div>
              <button 
                onClick={onClose} 
                className="absolute right-6 p-2 text-slate-400 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto">
              {/* Age Group */}
              <FilterSection 
                title="Age" 
                isOpen={true} 
              >
                <div className="flex flex-wrap gap-2">
                  {["All", "5-7", "8-10"].map(age => (
                    <button
                      key={age}
                      onClick={() => setFilters({ ...filters, age: age === 'All' ? '' : age })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${(filters.age === age || (filters.age === "" && age === "All"))
                        ? "bg-[hsl(var(--swago-purple))] text-white shadow-lg shadow-purple-200"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Swago Elements */}
              <FilterSection 
                title="Interest/Gameplay" 
                isOpen={true}
              >
                <div className="flex flex-col gap-2">
                  {[
                    { id: "S", name: "Smart Tech" },
                    { id: "W", name: "Willpower" },
                    { id: "A", name: "Ambition" },
                    { id: "G", name: "Growth" },
                    { id: "O", name: "Optimization" },
                  ].map(element => (
                    <button
                      key={element.id}
                      onClick={() => {
                        const current = filters.elements;
                        const next = current.includes(element.id)
                          ? current.filter(id => id !== element.id)
                          : [...current, element.id];
                        setFilters({ ...filters, elements: next });
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${filters.elements.includes(element.id)
                        ? "bg-purple-50 text-[hsl(var(--swago-purple))]"
                        : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${filters.elements.includes(element.id) ? "bg-[hsl(var(--swago-purple))] border-transparent" : "border-slate-200"
                        }`}>
                        {filters.elements.includes(element.id) && <span className="text-[10px] text-white">✓</span>}
                      </div>
                      <span className="text-sm font-bold">{element.name}</span>
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Price Range Slider */}
              <FilterSection 
                title="Price Range" 
                isOpen={true}
              >
                <div className="pt-8 pb-4 px-2">
                  <PriceSlider 
                    min={filters.minPrice ?? 0}
                    max={filters.maxPrice ?? 3000}
                    onChange={(min, max) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
                  />
                </div>
              </FilterSection>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-4 bg-white">
              <button
                onClick={() => {
                   setFilters({ ...filters, search: "", age: "", elements: [], minPrice: undefined, maxPrice: undefined });
                }}
                className="flex-1 py-3 border border-slate-300 transition text-slate-600 rounded-md font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-[hsl(var(--swago-purple))] text-white rounded-md font-bold uppercase tracking-widest text-[10px] hover:bg-opacity-90 transition-colors shadow-lg"
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

function FilterSection({ title, children, isOpen: defaultOpen = false }: { title: string, children: React.ReactNode, isOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen); // Local state for each section toggle
  
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between group"
      >
        <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${isOpen ? 'text-[hsl(var(--swago-purple))]' : 'text-slate-700'}`}>
          {title}
        </span>
        <HiChevronRight className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90 text-[hsl(var(--swago-purple))]' : 'text-slate-300'}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-6 pb-6"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const pricePoints = [0, 499, 999, 1500, 3000];

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

    // Determine which thumb to move based on proximity
    const distMin = Math.abs(index - safeMinIdx);
    const distMax = Math.abs(index - safeMaxIdx);

    if (distMin < distMax) {
      if (index <= safeMaxIdx) onChange(pricePoints[index], pricePoints[safeMaxIdx]);
    } else {
      if (index >= safeMinIdx) onChange(pricePoints[safeMinIdx], pricePoints[index]);
    }
  };

  return (
    <div className="w-full px-1 pt-2 pb-6 group">
      {/* Sleek Price Labels */}
      <div className="flex justify-between items-end mb-10 px-0.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Minimum</span>
          <span className="text-xl font-medium text-slate-900 leading-none tabular-nums">₹{pricePoints[safeMinIdx]}</span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Maximum</span>
          <span className="text-xl font-medium text-slate-900 leading-none tabular-nums">
            {pricePoints[safeMaxIdx] === 3000 ? '₹3000+' : `₹${pricePoints[safeMaxIdx]}`}
          </span>
        </div>
      </div>

      {/* Minimal Slider Bar */}
      <div 
        ref={trackRef}
        className="relative h-1.5 w-full bg-slate-100 rounded-full cursor-pointer transition-colors hover:bg-slate-200"
        onMouseDown={(e) => handleInteraction(e.clientX)}
        onTouchStart={(e) => handleInteraction(e.touches[0].clientX)}
      >
        {/* Active Segment */}
        <motion.div 
          className="absolute h-full bg-[hsl(var(--swago-purple))] rounded-full shadow-[0_0_10px_rgba(124,93,250,0.3)]"
          initial={false}
          animate={{ 
            left: `${getPercentage(safeMinIdx)}%`, 
            width: `${getPercentage(safeMaxIdx) - getPercentage(safeMinIdx)}%` 
          }}
        />

        {/* Minimal Thumbs (Buttons) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Min Handle */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-white border-2 border-[hsl(var(--swago-purple))] rounded-full shadow-md z-30 transition-transform hover:scale-110 active:scale-95"
            animate={{ left: `${getPercentage(safeMinIdx)}%` }}
            initial={false}
          />
          {/* Max Handle */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 bg-white border-2 border-[hsl(var(--swago-purple))] rounded-full shadow-md z-30 transition-transform hover:scale-110 active:scale-95"
            animate={{ left: `${getPercentage(safeMaxIdx)}%` }}
            initial={false}
          />
        </div>
      </div>

      {/* Discrete Scale Labels */}
      <div className="relative mt-8 flex justify-between px-0.5">
        {pricePoints.map((point, i) => (
          <button
            key={point}
            onClick={() => handleInteraction(0)} // Placeholder, interaction logic is handled by point specific math if needed, but the track click handles this
            className="flex flex-col items-center gap-2 group/btn"
            style={{ pointerEvents: 'none' }} // Labels are visual
          >
            <div className={`w-1 h-1 rounded-full bg-slate-200 transition-all ${
              i >= safeMinIdx && i <= safeMaxIdx ? 'bg-purple-300 scale-125' : ''
            }`} />
            <span className={`text-[9px] font-bold tracking-tight transition-colors ${
              i === safeMinIdx || i === safeMaxIdx ? 'text-[hsl(var(--swago-purple))]' : 'text-slate-300'
            }`}>
              ₹{point === 3000 ? '3000+' : point}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
