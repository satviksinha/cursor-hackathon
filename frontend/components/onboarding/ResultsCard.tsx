import { motion } from "framer-motion";
import { BarChart3, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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

interface ResultsCardProps {
  profile: PersonalityProfile;
  insights: PersonalityInsights;
  onContinue: () => void;
}

export function ResultsCard({
  profile,
  insights,
  onContinue,
}: ResultsCardProps) {
  const getTraitLevel = (score: number) => {
    if (score >= 75) return "High";
    if (score >= 50) return "Medium";
    return "Low";
  };

  const getTraitColor = (score: number) => {
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getTraitBarColor = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-200 mb-4">
          Assessment Complete!
        </h1>
        <p className="text-zinc-400 text-lg">
          Here's your personalized personality profile
        </p>
      </motion.div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="glass" padding="md" className="text-center">
          <div className="text-4xl font-bold text-zinc-200 mb-2">
            {Math.round(
              Object.values(profile.profile).reduce((a, b) => a + b, 0) / 5
            )}
          </div>
          <div className="text-zinc-400">Overall Personality Score</div>
        </Card>
      </motion.div>

      {/* Personality Traits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass" padding="lg">
          <h2 className="text-xl font-bold text-zinc-200 mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3" />
            Your Personality Traits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(profile.profile).map(([trait, score]) => (
              <div key={trait} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-zinc-300 capitalize">
                    {trait}
                  </span>
                  <span className={`text-lg font-bold ${getTraitColor(score)}`}>
                    {getTraitLevel(score)}
                  </span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-3">
                  <motion.div
                    className={`h-3 rounded-full ${getTraitBarColor(score)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                <div className="text-sm text-zinc-400 text-right">
                  {score.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Primary Traits */}
        <Card variant="glass" padding="md">
          <h3 className="text-lg font-bold text-zinc-200 mb-4">
            Primary Traits
          </h3>
          <div className="space-y-3">
            {insights.primary_traits.map((trait, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-zinc-300 capitalize">{trait.trait}</span>
                <span className="text-green-400 font-medium">
                  {trait.score.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Secondary Traits */}
        <Card variant="glass" padding="md">
          <h3 className="text-lg font-bold text-zinc-200 mb-4">
            Secondary Traits
          </h3>
          <div className="space-y-3">
            {insights.secondary_traits.map((trait, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-zinc-300 capitalize">{trait.trait}</span>
                <span className="text-yellow-400 font-medium">
                  {trait.score.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass" padding="md">
          <h3 className="text-lg font-bold text-zinc-200 mb-4">
            Personalized Recommendations
          </h3>
          <ul className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <li key={index} className="text-zinc-300 flex items-start">
                <span className="text-blue-400 mr-2 mt-1">•</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>

      {/* Content Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card variant="glass" padding="md">
          <h3 className="text-lg font-bold text-zinc-200 mb-4">
            Content Preferences
          </h3>
          <div className="flex flex-wrap gap-2">
            {insights.content_preferences.map((preference, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
              >
                {preference}
              </span>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <Button
          variant="primary"
          size="lg"
          onClick={onContinue}
          className="px-8 py-4"
        >
          <span>Continue to Chat</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
