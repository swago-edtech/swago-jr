import Image from "next/image";

interface StepProps {
  onNext: () => void;
}

export default function Step1Intro({ onNext }: StepProps) {
  return (
    <div className="flex flex-col w-full relative bg-[#f1f3f6] min-h-[88dvh] md:min-h-[70dvh] overflow-x-hidden pb-0 lg:pb-2">
      {/* Main Container */}
      <div className="flex flex-col md:flex-row w-full lg:min-h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-8 lg:py-2 gap-8 md:gap-4 lg:gap-8 items-center justify-between">
        {/* Left Section: Character & Speech Bubble */}
        <div className="w-full md:w-[65%] md:min-h-full flex items-center justify-center shrink-0">
          <div className="relative w-[340px] h-[440px] sm:w-[400px] sm:h-[500px] md:w-[500px] md:h-[600px] lg:w-[650px] lg:h-[750px] mx-auto">

            <div className="absolute top-0 right-0 w-[280px] sm:w-[320px] md:w-[360px] lg:w-[480px]">
              <svg viewBox="0 0 440 330" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">

                <path
                  fill="#efe3da"
                  transform="translate(-8, 8)"
                  d="M140,255 C170,275 240,275 270,255 C300,275 360,265 360,225 C410,245 430,165 380,135 C420,45 290,-5 270,75 C240,25 170,15 140,65 C80,15 20,75 60,145 C10,215 80,285 140,255 Z"
                />
                <path
                  fill="white"
                  stroke="#3d2112"
                  strokeWidth="8"
                  strokeLinejoin="round"
                  d="M140,255 C170,275 240,275 270,255 C300,275 360,265 360,225 C410,245 430,165 380,135 C420,45 290,-5 270,75 C240,25 170,15 140,65 C80,15 20,75 60,145 C10,215 80,285 140,255 Z"
                />

                <circle cx="98" cy="282" r="12" fill="#efe3da" transform="translate(-3, 3)" />
                <circle cx="98" cy="282" r="12" fill="white" stroke="#3d2112" strokeWidth="3" />

                <circle cx="74" cy="306" r="8" fill="#efe3da" transform="translate(-3, 3)" />
                <circle cx="74" cy="306" r="8" fill="white" stroke="#3d2112" strokeWidth="2.5" />

              </svg>

              <p className="absolute inset-0 flex items-center justify-center text-center text-slate-800 font-black text-[14px] sm:text-[15px] md:text-[18px] lg:text-[23px] leading-snug px-10 py-3 sm:px-14 sm:py-4 md:px-16 md:py-5 lg:px-20 lg:py-6 pointer-events-none">
                Hey smart kid, I am Gogo Wondering what you need to do here? I&apos;ve got a mission for you ... and that can earn you 20 swago dollars.
              </p>
            </div>

            <div className="absolute bottom-0 left-0 w-[180px] h-[300px] sm:w-[220px] sm:h-[350px] md:w-[260px] md:h-[420px] lg:w-[340px] lg:h-[540px]">
              <Image
                src="/images/home/step-one-Photoroom.png"
                alt="Gogo the Mascot"
                fill
                priority
                className="object-contain object-bottom"
                sizes="(max-width: 640px) 180px, (max-width: 768px) 220px, (max-width: 1024px) 260px, 340px"
              />
            </div>

          </div>
        </div>


        {/* Right Section: Content */}
        <div className="w-full md:w-[35%] lg:w-[30%] flex flex-col justify-center items-center md:items-start pt-2 pb-2 md:py-0 shrink-0">
          {/* Action Button */}
          <button
            onClick={onNext}
            className="w-full max-w-sm md:max-w-[280px] lg:max-w-md py-[18px] md:py-5 bg-purple-600 hover:bg-purple-700 text-white text-[16px] lg:text-[18px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-purple-600/30 btn-shine btn-text-pop"
          >
            Yes I wanna know the mission
          </button>
        </div>
      </div>
    </div>
  );
}
