import { motion } from "framer-motion";
import { Brain, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Question {
  id: string;
  dimension: string;
  text: string;
  reverse: boolean;
}

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  onAnswerSelect: (score: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: QuestionCardProps) {
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <Card variant="glass" padding="lg" className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-400">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-sm font-medium text-zinc-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-zinc-200 mb-4">
          {question.text}
        </h2>
        <p className="text-zinc-400 text-sm">
          Rate how much this statement describes you
        </p>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-8">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onClick={() => onAnswerSelect(score)}
            className={`w-full p-4 rounded-2xl border transition-all duration-200 ${
              selectedAnswer === score
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg shadow-blue-500/25"
                : "bg-zinc-800/40 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:border-zinc-600/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {score === 1 && "Strongly Disagree"}
                {score === 2 && "Disagree"}
                {score === 3 && "Neutral"}
                {score === 4 && "Agree"}
                {score === 5 && "Strongly Agree"}
              </span>
              <span className="text-lg font-bold">{score}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        <Button
          variant="primary"
          onClick={onNext}
          disabled={!canGoNext}
          className="flex items-center space-x-2"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
