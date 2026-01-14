"use client";

import { motion } from "framer-motion";

type Step = {
  number: number;
  label: string;
  status: "completed" | "active" | "locked";
};

interface ProgressJourneyBarProps {
  currentStep: number;
  ambassadorStatus: string;
}

export default function ProgressJourneyBar({ currentStep, ambassadorStatus }: ProgressJourneyBarProps) {
  const steps: Step[] = [
    {
      number: 1,
      label: "Profile Created",
      status: currentStep >= 1 ? "completed" : "locked",
    },
    {
      number: 2,
      label: "Entry Challenge",
      status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "locked",
    },
    {
      number: 3,
      label: "Brain Gym",
      status: currentStep === 3 ? "active" : currentStep > 3 ? "completed" : "locked",
    },
    {
      number: 4,
      label: "Brand Ambassador",
      status: currentStep >= 4 ? "active" : "locked",
    },
  ];

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
        Your Ambassador Journey
      </h3>
      
      {/* Desktop View - Horizontal */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 z-0">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center z-10 relative">
            {/* Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                step.status === "completed"
                  ? "bg-green-500 text-white"
                  : step.status === "active"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              {step.status === "completed" ? "✓" : step.status === "locked" ? "🔒" : step.number}
            </motion.div>

            {/* Label */}
            <p
              className={`text-xs md:text-sm font-medium text-center max-w-[80px] ${
                step.status === "locked" ? "text-gray-400" : "text-gray-700"
              }`}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile View - Vertical */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-start gap-4">
            {/* Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                step.status === "completed"
                  ? "bg-green-500 text-white"
                  : step.status === "active"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              {step.status === "completed" ? "✓" : step.status === "locked" ? "🔒" : step.number}
            </motion.div>

            {/* Label & Line */}
            <div className="flex-1 pb-4">
              <p
                className={`text-sm font-medium ${
                  step.status === "locked" ? "text-gray-400" : "text-gray-700"
                }`}
              >
                {step.label}
              </p>
              {index < steps.length - 1 && (
                <div className="w-0.5 h-8 bg-gray-200 ml-5 mt-2">
                  {step.status === "completed" && (
                    <div className="w-full h-full bg-gradient-to-b from-purple-500 to-pink-500" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
