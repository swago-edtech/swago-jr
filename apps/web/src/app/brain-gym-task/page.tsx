"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Step1Intro from "./components/Step1Intro";
import Step2Mission from "./components/Step2Mission";
import Step3Reward from "./components/Step3Reward";

export default function BrainGymTaskFlow() {
    const [currentStep, setCurrentStep] = useState(1);
    const router = useRouter();

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1Intro onNext={nextStep} />;
            case 2: return <Step2Mission onNext={nextStep} />;
            case 3: return <Step3Reward onComplete={() => router.push("/profile")} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-[95dvh] w-full bg-slate-50 flex flex-col overflow-hidden relative">
            {/* Container: Full screen everywhere */}
            <div className="w-full h-full flex flex-col flex-1 relative transition-all duration-300">

                {/* Content Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="flex-1 flex flex-col h-full"
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Dots at Bottom */}
                <div className="flex justify-center items-center gap-2 py-2 md:py-6 bg-white border-t border-slate-100">
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`rounded-full transition-all duration-500 ease-out ${currentStep === step ? "bg-[hsl(var(--swago-purple))] w-8 h-2" : "bg-slate-200 w-2 h-2"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
