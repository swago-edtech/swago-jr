import Image from "next/image";

export default function SwagoScoreSection() {
  return (
    // Changed bg-white to bg-yellow-50 for a light yellow background
    <section className="py-20 bg-yellow-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left side: Illustration */}
          <div className="text-center">
            <Image
              src="/images/illustration-score.png"
              alt="Swago Scorecard illustration"
              width={400}
              height={350}
              className="inline-block"
            />
          </div>
          
          {/* Right side: Text Content */}
          <div>
            <h2 className="text-4xl font-bold mb-4">Swago Score</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Kids earn points, badges, and achievements for every skill they practice. This is called the Swago Score—a fun way to track growth and celebrate learning!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}