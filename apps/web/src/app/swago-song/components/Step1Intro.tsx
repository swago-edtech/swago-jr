import Image from "next/image";

interface StepProps {
  onNext: () => void;
}

export default function Step1Intro({ onNext }: StepProps) {
  return (
    <div className="flex flex-col w-full relative bg-[#f1f3f6] min-h-screen overflow-x-hidden pb-8 lg:pb-2">
      {/* Main Container */}
      <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-8 lg:py-2 gap-8 md:gap-4 lg:gap-8 items-center justify-between">
        {/* Left Section: Character & Speech Bubble */}
        <div className="w-full md:w-[65%] lg:w-[65%] flex flex-col items-center justify-center relative pt-0 shrink-0">
          <div className="relative w-full max-w-[360px] md:max-w-full flex flex-col md:flex-row-reverse md:items-end md:justify-center shrink-0 mx-auto">
            {/* Speech Bubble (Cloud shape) */}
            <div className="relative z-10 self-end md:self-start w-[300px] sm:w-[340px] md:w-[400px] lg:w-[440px] aspect-[4/3] flex flex-col items-center justify-center mr-0 ml-auto -mb-6 md:mb-0 md:mt-0 shrink-0 md:-ml-8 lg:-ml-12 md:-mt-8">
              <svg
                viewBox="0 0 440 300"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Shadow path */}
                <path
                  fill="#efe3da"
                  transform="translate(-8, 8)"
                  d="M140,255 C170,275 240,275 270,255 C300,275 360,265 360,225 C410,245 430,165 380,135 C420,45 290,-5 270,75 C240,25 170,15 140,65 C80,15 20,75 60,145 C10,215 80,285 140,255 Z"
                />
                {/* Main cloud path */}
                <path
                  fill="#ffffff"
                  stroke="#3d2112"
                  strokeWidth="8"
                  strokeLinejoin="round"
                  d="M140,255 C170,275 240,275 270,255 C300,275 360,265 360,225 C410,245 430,165 380,135 C420,45 290,-5 270,75 C240,25 170,15 140,65 C80,15 20,75 60,145 C10,215 80,285 140,255 Z"
                />
              </svg>
              <div className="relative z-10 w-[78%] text-center mt-2 px-1">
                <p className="text-[#131d2e] font-black text-[15.5px] sm:text-[17.5px] lg:text-[18px] tracking-tight leading-[1.25]">
                  Hey smart kid, I am
                  <br />
                  Gogo Wondering what
                  <br />
                  you need to do here? I've
                  <br />
                  got a mission for you ...
                  <br />
                  and that can earn you
                  <br />
                  20 swago dollars.
                </p>
              </div>
              {/* Thought bubbles tail */}
              <div className="absolute bottom-1 lg:-bottom-2 left-[20%] sm:left-[25%] md:left-2 md:-bottom-2 lg:-bottom-6 w-6 h-6 z-0">
                <div className="absolute inset-0 bg-[#efe3da] rounded-full translate-x-[-3px] translate-y-[3px]"></div>
                <div className="absolute inset-0 bg-white border-[3px] border-[#3d2112] rounded-full"></div>
              </div>
              <div className="absolute -bottom-4 lg:-bottom-12 left-[10%] sm:left-[15%] md:-left-4 md:-bottom-[10%] lg:-left-6 lg:-bottom-16 w-4 h-4 z-0">
                <div className="absolute inset-0 bg-[#efe3da] rounded-full translate-x-[-3px] translate-y-[3px]"></div>
                <div className="absolute inset-0 bg-white border-[2.5px] border-[#3d2112] rounded-full"></div>
              </div>
            </div>

            {/* Mascot */}
            <div className="relative w-[200px] h-[320px] min-h-[320px] md:w-[320px] md:h-[460px] md:min-h-[460px] lg:w-[360px] lg:h-[500px] shrink-0 z-20 self-start md:self-end ml-2 sm:ml-4 md:ml-0 mt-4 md:mt-0 md:-mb-16 pointer-events-none">
              <Image
                src="/images/home/step-one-Photoroom.png"
                alt="Gogo the Mascot"
                fill
                className="object-contain md:object-right"
                priority
                sizes="(max-width: 768px) 200px, 360px"
              />
            </div>
          </div>
        </div>

        {/* Right Section: Content */}
        <div className="w-full md:w-[35%] lg:w-[30%] flex flex-col justify-center items-center md:items-start pt-2 pb-2 md:py-0 shrink-0">
          {/* Action Button */}
          <button
            onClick={onNext}
            className="w-full max-w-sm md:max-w-[280px] lg:max-w-md py-[18px] md:py-5 bg-[#2E006A] hover:bg-[#410091] text-white text-[16px] md:text-[18px] font-bold uppercase tracking-wider rounded-full transition-transform active:scale-[0.98] shadow-lg shadow-purple-900/20"
          >
            Yes I wanna know the mission
          </button>
        </div>
      </div>
    </div>
  );
}
