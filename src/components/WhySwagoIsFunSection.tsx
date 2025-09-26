import Image from "next/image";
import Link from "next/link";

// Updated data to include colors for the new card design
const features = [
  {
    icon: "/images/icon-games.png",
    title: "Play games and complete challenges",
    description: "Kids earn points and badges while having fun.",
    borderColor: "border-sky-400",
    iconBgColor: "bg-sky-100",
  },
  {
    icon: "/images/icon-skills.png",
    title: "Learn important skills",
    description: "Coding, creativity, and problem-solving built into play.",
    borderColor: "border-lime-400",
    iconBgColor: "bg-lime-100",
  },
  {
    icon: "/images/icon-trophy.png",
    title: "Watch your Swago Score rise",
    description: "Discover the joys of Swago Score and become an Alpha Leader!",
    borderColor: "border-purple-400",
    iconBgColor: "bg-purple-100",
  },
];

export default function WhySwagoIsFunSection() {
  return (
    // Section with a new gradient background
    <section className="py-20 bg-gradient-to-b from-cyan-50 to-white">
      <div className="container mx-auto px-4 text-center">
        
        {/* New Titles */}
        <h2 className="text-4xl font-black text-slate-800 uppercase">
          The Swago <span className="text-[hsl(var(--swago-purple))]">Advantage</span>
        </h2>
        <p className="mt-2 text-slate-600">Why should you choose Swago for your little rockstar</p>
        
        {/* Redesigned Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className={`bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-4 ${feature.borderColor} shadow-lg text-left flex items-center gap-4 hover:scale-105 transition-transform`}
            >
              <div className={`flex-shrink-0 p-3 rounded-2xl ${feature.iconBgColor}`}>
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={48}
                  height={48}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{feature.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* New Integrated Call to Action */}
        <h3 className="mt-20 text-3xl font-bold text-slate-800 tracking-tight">
          START YOUR SWAGO ADVENTURE TODAY!
        </h3>
        <Link 
          href="/products" // Points to products page for now
          className="btn-shine mt-6 inline-block bg-[hsl(var(--swago-orange))] text-white font-bold px-10 py-4 rounded-lg shadow-lg"
        >
          SIGN UP NOW
        </Link>
      </div>
    </section>
  );
}