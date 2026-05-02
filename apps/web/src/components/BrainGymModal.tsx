"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Step1Intro from "@/app/brain-gym-task/components/Step1Intro";
import Step2Mission from "@/app/brain-gym-task/components/Step2Mission";
import Step3Reward from "@/app/brain-gym-task/components/Step3Reward";

interface BrainGymModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BrainGymModal({ isOpen, onClose, onSuccess }: BrainGymModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Intro onNext={nextStep} />;
      case 2:
        return <Step2Mission onNext={nextStep} />;
      case 3:
        return (
          <Step3Reward
            onComplete={() => {
              onSuccess();
              onClose();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-4xl bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90dvh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors z-50 font-bold"
            >
              ✕
            </button>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-6 pt-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress Dots at Bottom */}
            <div className="flex justify-center items-center gap-2 py-6 bg-white border-t border-slate-50">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`rounded-full transition-all duration-500 ease-out ${
                    currentStep === step
                      ? "bg-[hsl(var(--swago-purple))] w-8 h-2"
                      : "bg-slate-200 w-2 h-2"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
