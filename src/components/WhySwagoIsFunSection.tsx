import Image from "next/image";

// Data for the three features
const features = [
  {
    icon: "/images/icon-games.png",
    title: "Play games and complete challenges",
    description: "Kids earn points and badges while having fun.",
  },
  {
    icon: "/images/icon-skills.png",
    title: "Learn important skills",
    description: "Coding, creativity, and problem solving built into play.",
  },
  {
    icon: "/images/icon-trophy.png",
    title: "Watch your Swago Score rise",
    description: "Track growth with Swago Score and become an Alpha Leader!",
  },
];

export default function WhySwagoIsFunSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-12">Why Swago is Fun</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center">
              <Image
                src={feature.icon}
                alt={feature.title}
                width={80}
                height={80}
                className="mb-4"
              />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}