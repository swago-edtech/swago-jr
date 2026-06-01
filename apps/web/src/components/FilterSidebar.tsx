"use client";

// Define the shape of our filters
export type Filters = {
  search: string;
  age: string;
  elements: string[];
  minPrice?: number;
  maxPrice?: number;
};

// Define the props the component will receive
type FilterSidebarProps = {
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
};

// Data for the filters
const ageGroups = [
  { label: "All", value: "All" },
  { label: "6+ yrs", value: "6-7" },
  { label: "8+ yrs", value: "8-10" },
];
const swagoElements = [
  { id: "S", name: "Smart Tech" },
  { id: "W", name: "Willpower" },
  { id: "A", name: "Ambition" },
  { id: "G", name: "Growth" },
  { id: "O", name: "Optimization" },
];

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {

  const handleAgeChange = (age: string) => {
    onFilterChange({ ...filters, age: age === "All" ? "" : age });
  };

  const handleElementChange = (elementId: string) => {
    const currentElements = filters.elements;
    const newElements = currentElements.includes(elementId)
      ? currentElements.filter(el => el !== elementId)
      : [...currentElements, elementId];
    onFilterChange({ ...filters, elements: newElements });
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-white p-6 rounded-xl shadow-sm border space-y-6">
      {/* Search Input */}
      <div>
        <label htmlFor="search" className="block text-sm font-bold text-gray-700">Search Smart Box</label>
        <input
          type="text"
          id="search"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder="Search kit name..."
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-swago-purple focus:border-swago-purple"
        />
      </div>

      {/* Age Group Filter */}
      <div>
        <h3 className="text-sm font-bold text-gray-700">Age Group</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {ageGroups.map(age => (
            <button
              key={age.value}
              onClick={() => handleAgeChange(age.value)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${(filters.age === age.value || (filters.age === "" && age.value === "All"))
                ? "bg-[hsl(var(--swago-purple))] text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
            >
              {age.label}
            </button>
          ))}
        </div>
      </div>


    </aside>
  );
}