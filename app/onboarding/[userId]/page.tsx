"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

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
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await api.getQuestions();
      const data = await response.json();
      if (data.status === "success") {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (score: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: score,
    }));
  };

  const nextQuestion = () => {
    if (questions.length > 0 && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const submitAssessment = async () => {
    if (questions.length === 0) return;

    setIsSubmitting(true);
    try {
      const questionnaireAnswers: QuestionnaireAnswer[] = Object.entries(
        answers
      ).map(([question_id, score]) => ({ question_id, score }));

      const response = await api.assessPersonality(
        userId,
        questionnaireAnswers
      );

      const data = await response.json();
      if (data.status === "success") {
        setProfile(data.profile);
        setInsights(data.insights);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Failed to submit assessment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTraitColor = (trait: string) => {
    const colors = {
      openness: "from-purple-400 to-purple-600",
      conscientiousness: "from-blue-400 to-blue-600",
      extraversion: "from-green-400 to-green-600",
      agreeableness: "from-pink-400 to-pink-600",
      neuroticism: "from-red-400 to-red-600",
    };
    return colors[trait as keyof typeof colors] || "from-gray-400 to-gray-600";
  };

  const getTraitLabel = (trait: string) => {
    const labels = {
      openness: "Openness",
      conscientiousness: "Conscientiousness",
      extraversion: "Extraversion",
      agreeableness: "Agreeableness",
      neuroticism: "Neuroticism",
    };
    return labels[trait as keyof typeof labels] || trait;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <p className="text-zinc-200 text-xl font-semibold">
            Loading personality assessment...
          </p>
        </div>
      </div>
    );
  }

  if (showResults && profile && insights) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Your Personality Profile
            </h1>
            <p className="text-xl text-zinc-400 font-medium">
              Discover what makes you unique and how it shapes your preferences
            </p>
          </motion.div>

          {/* Personality Radar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-zinc-800/50 shadow-lg"
          >
            <h2 className="text-2xl font-bold text-zinc-200 mb-8 text-center">
              Big Five Personality Traits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(profile.profile).map(([trait, score]) => (
                <div key={trait} className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke={`url(#${trait})`}
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 56 * (1 - score / 100)
                        }`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient
                          id={trait}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {Math.round(score)}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-200 mb-2">
                    {getTraitLabel(trait)}
                  </h3>
                  <p className="text-sm text-zinc-400 font-medium">
                    {score >= 70 ? "High" : score >= 30 ? "Medium" : "Low"}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-800/50 shadow-lg"
            >
              <h3 className="text-xl font-bold text-zinc-200 mb-6">
                Primary Traits
              </h3>
              {insights.primary_traits.map((trait, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-200 font-semibold">
                      {getTraitLabel(trait.trait)}
                    </span>
                    <span className="text-zinc-400 font-bold">
                      {Math.round(trait.score)}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800/50 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full shadow-lg"
                      style={{ width: `${trait.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-800/50 shadow-lg"
            >
              <h3 className="text-xl font-bold text-zinc-200 mb-6">
                Content Preferences
              </h3>
              <div className="space-y-4">
                {insights.content_preferences.map((preference, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 text-zinc-300"
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="leading-relaxed">{preference}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12 space-x-6"
          >
            <button
              onClick={() => router.push(`/chat/${userId}`)}
              className="bg-gradient-to-br from-blue-500 to-purple-600 text-white px-10 py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 text-lg"
            >
              Start Personalized Chat
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
              }}
              className="bg-zinc-800/50 text-zinc-300 px-10 py-4 rounded-2xl font-semibold hover:bg-zinc-700/50 hover:text-zinc-200 transition-all duration-200 border border-zinc-700/50 hover:border-zinc-600/50 text-lg"
            >
              Retake Assessment
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  // Don't render the questionnaire until questions are loaded
  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <p className="text-zinc-200 text-xl font-semibold">
            Loading personality assessment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-8 border border-zinc-800/50 shadow-lg"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-zinc-200 font-semibold text-lg">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-zinc-400 font-medium">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-zinc-800/50 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              ></motion.div>
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-zinc-200 mb-8 text-center leading-relaxed">
                {currentQuestion?.text}
              </h2>

              {/* Answer Scale */}
              <div className="space-y-4 mb-8">
                {[1, 2, 3, 4, 5].map((score) => (
                  <motion.button
                    key={score}
                    onClick={() => handleAnswer(score)}
                    className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 ${
                      answers[currentQuestion.id] === score
                        ? "border-blue-400 bg-blue-400/20 text-zinc-200 shadow-lg shadow-blue-400/20"
                        : "border-zinc-700/50 text-zinc-400 hover:border-zinc-600/50 hover:text-zinc-300 hover:bg-zinc-800/30"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        {score === 1 && "Strongly Disagree"}
                        {score === 2 && "Disagree"}
                        {score === 3 && "Neutral"}
                        {score === 4 && "Agree"}
                        {score === 5 && "Strongly Agree"}
                      </span>
                      <span className="text-2xl font-bold">{score}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                currentQuestionIndex === 0
                  ? "bg-zinc-800/30 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-200 border border-zinc-700/50"
              }`}
            >
              Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestion.id]}
                className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                  !answers[currentQuestion.id]
                    ? "bg-zinc-800/30 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={submitAssessment}
                disabled={isSubmitting || !answers[currentQuestion.id]}
                className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                  isSubmitting || !answers[currentQuestion.id]
                    ? "bg-zinc-800/30 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                }`}
              >
                {isSubmitting ? "Analyzing..." : "Complete Assessment"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
