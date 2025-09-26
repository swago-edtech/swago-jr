import Link from "next/link";
import { products } from "@/lib/products";

// This will correctly find your "5-7" and "8-10" categories
const ageCategories = Array.from(new Set(products.map(p => p.age_category))).sort();

export default function ChooseYourKit() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">Choose Your Kit</h2>
        <p className="text-slate-600 mb-12">Pick the kit based on your age group and start your Swago journey.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-8">
          {ageCategories.map(category => (
            // 1. Link is updated to use the query parameter and is now the main card element
            <Link 
              key={category} 
              href={`/products?age=${category}`} 
              className="block p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all h-72 flex flex-col text-center"
            >
              {/* 2. New layout for the card content */}
              <p className="text-slate-500">Age</p>
              <p className="text-5xl font-bold my-4 text-slate-800">{category}</p>
              
              {/* This empty div pushes the button to the bottom */}
              <div className="flex-grow"></div> 
              
              <div className="mt-4 text-white font-semibold bg-[hsl(var(--swago-pink))] py-3 rounded-lg hover:opacity-90 transition-opacity">
                View Kits
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}