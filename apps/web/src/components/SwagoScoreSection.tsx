import Image from "next/image";

// A small checkmark icon component for the list
const CheckIcon = () => (
  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function SwagoScoreSection() {
  return (
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
          
          {/* Right side: New Text Content */}
          <div>
            <h2 className="text-4xl font-bold mb-4">
              Swago Score – Your Child’s Growth Passport
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              The Swago Score tracks your child’s progress across our 5 Core Elements — Smart Tech, Willpower, Ambition, Growth, and Optimization.
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckIcon />
                <span className="text-slate-700">
                  <strong>See Real Growth:</strong> Every activity, challenge, and skill practiced adds to the score.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon />
                <span className="text-slate-700">
                  <strong>Stay Motivated:</strong> Points, badges, and unlocked missions make learning fun and rewarding.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon />
                <span className="text-slate-700">
                  <strong>Celebrate Achievements:</strong> Parents can visibly track progress and milestones.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckIcon />
                <span className="text-slate-700">
                  <strong>Personalized & Adaptive:</strong> Highlights strengths, growth areas, and new opportunities.
                </span>
              </li>
            </ul>

            <p className="text-slate-600 text-lg leading-relaxed mt-6 font-medium">
              Swago Score turns play into measurable growth, helping every child develop the skills, confidence, and mindset of an Alpha Leader.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}