"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface BrainGymQuizProps {
  kidProfileId: string;
  onComplete: () => void;
}

interface Riddle {
  question: string;
  options: string[];
  reward: number;
}

export default function BrainGymQuiz({ kidProfileId, onComplete }: BrainGymQuizProps) {
  const [riddle, setRiddle] = useState<Riddle | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiddle();
  }, []);

  const fetchRiddle = async () => {
    try {
      const res = await fetch(`/api/ambassador/brain-gym?kidProfileId=${kidProfileId}`);
      const data = await res.json();

      if (res.ok) {
        if (data.alreadyCompleted) {
          setResult({ correct: true, message: data.message });
        } else {
          setRiddle(data.riddle);
        }
      }
    } catch (error) {
      console.error("Failed to fetch riddle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/ambassador/brain-gym", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidProfileId,
          answer: selectedAnswer,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ correct: data.correct, message: data.message });
        if (data.correct) {
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[hsl(var(--swago-purple))] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Brain Gym...</p>
      </div>
    );
  }

  if (result) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-2xl shadow-xl p-8 text-center ${
          result.correct ? "bg-green-50" : "bg-[hsl(var(--swago-orange))]/10"
        }`}
      >
        <div className="text-6xl mb-4">{result.correct ? "🎉" : "🤔"}</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {result.correct ? "Awesome!" : "Try Again!"}
        </h3>
        <p className="text-lg text-gray-700">{result.message}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl">🧠</div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Swago Brain Gym</h3>
          <p className="text-sm text-gray-600">
            Solve this riddle to earn {riddle?.reward || 0} Swago Dollars!
          </p>
        </div>
      </div>

      {riddle && (
        <div className="space-y-6">
          <div className="bg-[hsl(var(--swago-purple))]/10 rounded-lg p-6 border border-[hsl(var(--swago-purple))]/30">
            <p className="text-lg font-semibold text-gray-800 text-center">
              {riddle.question}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {riddle.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedAnswer(option)}
                className={`p-4 rounded-lg border-2 font-semibold text-lg transition-all ${
                  selectedAnswer === option
                    ? "border-[hsl(var(--swago-purple))] bg-[hsl(var(--swago-purple))]/10 text-[hsl(var(--swago-purple))]"
                    : "border-gray-300 bg-white text-gray-700 hover:border-[hsl(var(--swago-purple))]/50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Checking..." : "Submit Answer 🚀"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
