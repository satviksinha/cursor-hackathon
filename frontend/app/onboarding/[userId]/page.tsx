"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { QuestionCard } from "@/components/onboarding/QuestionCard";
import { ResultsCard } from "@/components/onboarding/ResultsCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";

interface Question {
  id: string;
  dimension: string;
  text: string;
  reverse: boolean;
}

interface QuestionnaireAnswer {
  question_id: string;
  score: number;
}

interface PersonalityProfile {
  user_id: string;
  profile: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  timestamp: string;
}

interface PersonalityInsights {
  primary_traits: Array<{ trait: string; score: number }>;
  secondary_traits: Array<{ trait: string; score: number }>;
  recommendations: string[];
  content_preferences: string[];
}

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [insights, setInsights] = useState<PersonalityInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await api.getQuestions();
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
      } else {
        setError("Failed to load questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (score: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: score,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitAnswers();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitAnswers = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const answersArray: QuestionnaireAnswer[] = Object.entries(answers).map(
        ([question_id, score]) => ({
          question_id,
          score,
        })
      );

      const response = await api.assessPersonality(userId, answersArray);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setInsights(data.insights);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to submit assessment");
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      setError("Failed to submit assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    router.push(`/chat/${userId}`);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const canGoNext = selectedAnswer !== null && selectedAnswer !== undefined;
  const canGoPrevious = currentQuestionIndex > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-zinc-400">Loading personality assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert type="error">{error}</Alert>
        </div>
      </div>
    );
  }

  if (profile && insights) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white py-12 px-6">
        <ResultsCard
          profile={profile}
          insights={insights}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-zinc-400">Processing your responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12 px-6">
      <AnimatePresence mode="wait">
        {currentQuestion && (
          <QuestionCard
            key={currentQuestionIndex}
            question={currentQuestion}
            currentIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
