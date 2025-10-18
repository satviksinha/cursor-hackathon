import { motion } from "framer-motion";
import { BarChart3, RefreshCw, Brain } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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

interface PersonalitySidebarProps {
  personalityProfile: PersonalityProfile | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function PersonalitySidebar({
  personalityProfile,
  isLoading,
  onRefresh,
}: PersonalitySidebarProps) {
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
    <div className="w-80 bg-zinc-900/60 backdrop-blur-xl border-l border-zinc-800/50 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-zinc-200">
              Personality Profile
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Profile Content */}
        {personalityProfile ? (
          <div className="space-y-4">
            {/* Overall Score */}
            <Card variant="solid" padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-200 mb-1">
                  {Math.round(
                    Object.values(personalityProfile.profile).reduce(
                      (a, b) => a + b,
                      0
                    ) / 5
                  )}
                </div>
                <div className="text-sm text-zinc-400">Overall Score</div>
              </div>
            </Card>

            {/* Individual Traits */}
            <div className="space-y-3">
              {Object.entries(personalityProfile.profile).map(
                ([trait, score]) => (
                  <Card key={trait} variant="solid" padding="sm">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-zinc-300 capitalize">
                          {trait}
                        </span>
                        <span
                          className={`text-sm font-bold ${getTraitColor(
                            score
                          )}`}
                        >
                          {getTraitLevel(score)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getTraitBarColor(
                            score
                          )}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="text-xs text-zinc-400 text-right">
                        {score.toFixed(1)}%
                      </div>
                    </div>
                  </Card>
                )
              )}
            </div>

            {/* Insights */}
            <Card variant="solid" padding="sm">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Insights
              </h3>
              <div className="space-y-2 text-xs text-zinc-400">
                <p>
                  Your personality profile influences how the AI assistant
                  responds to you.
                </p>
                <p>
                  Higher scores indicate stronger traits that shape your
                  communication style.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <Card variant="solid" padding="md">
            <div className="text-center text-zinc-400">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No personality profile available</p>
              <p className="text-sm mt-2">
                Complete the assessment to see your personality traits
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
