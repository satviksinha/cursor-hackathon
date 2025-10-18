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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">
            Loading personality assessment...
          </p>
        </div>
      </div>
    );
  }

  if (showResults && profile && insights) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Your Personality Profile
            </h1>
            <p className="text-purple-200 text-lg">
              Discover what makes you unique and how it shapes your preferences
            </p>
          </motion.div>

          {/* Personality Radar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
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
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {getTraitLabel(trait)}
                  </h3>
                  <p className="text-sm text-purple-200">
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
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Primary Traits
              </h3>
              {insights.primary_traits.map((trait, index) => (
                <div key={index} className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-medium">
                      {getTraitLabel(trait.trait)}
                    </span>
                    <span className="text-purple-300">
                      {Math.round(trait.score)}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
                      style={{ width: `${trait.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Content Preferences
              </h3>
              <div className="space-y-2">
                {insights.content_preferences.map((preference, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-purple-200"
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>{preference}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8 space-x-4"
          >
            <button
              onClick={() => router.push(`/chat/${userId}`)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              Start Personalized Chat
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
              }}
              className="bg-white/20 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/30 transition-all duration-200"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">
            Loading personality assessment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-purple-200">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
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
              <h2 className="text-2xl font-bold text-white mb-8 text-center">
                {currentQuestion?.text}
              </h2>

              {/* Answer Scale */}
              <div className="space-y-4 mb-8">
                {[1, 2, 3, 4, 5].map((score) => (
                  <motion.button
                    key={score}
                    onClick={() => handleAnswer(score)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                      answers[currentQuestion.id] === score
                        ? "border-purple-400 bg-purple-400/20 text-white"
                        : "border-white/30 text-white/70 hover:border-white/50 hover:text-white"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">
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
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                currentQuestionIndex === 0
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={nextQuestion}
                disabled={!answers[currentQuestion.id]}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                  !answers[currentQuestion.id]
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={submitAssessment}
                disabled={isSubmitting || !answers[currentQuestion.id]}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                  isSubmitting || !answers[currentQuestion.id]
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
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
