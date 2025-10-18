import { motion } from "framer-motion";
import {
  User,
  Brain,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search,
  BarChart3,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface MessageProps {
  message: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    searchResults?: any[];
    personalityContext?: string;
    searchInsights?: string[];
    personalityTraits?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
  };
  userId: string;
  onPlayAudio?: (audioData: string) => void;
  onStopAudio?: () => void;
  isPlaying?: boolean;
  preloadedAudio?: string;
}

export function Message({
  message,
  userId,
  onPlayAudio,
  onStopAudio,
  isPlaying,
  preloadedAudio,
}: MessageProps) {
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize with preloaded audio if available
  useEffect(() => {
    if (preloadedAudio && !audioData) {
      setAudioData(preloadedAudio);
    }
  }, [preloadedAudio, audioData]);

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

  const playAudio = async () => {
    // If we have preloaded audio, use it immediately
    if (audioData) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          onStopAudio?.();
        } else {
          audioRef.current.play();
          onPlayAudio?.(audioData);
        }
      }
      return;
    }

    // If no audio data and it's not a user message, generate it
    if (!message.isUser && !audioData) {
      setIsLoadingAudio(true);
      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(
          `${API_BASE_URL}/api/text-to-speech/${userId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: message.text }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.status === "success" && data.audio_data) {
            // Decode base64 audio data
            const binaryString = atob(data.audio_data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            // Create blob from decoded data
            const audioBlob = new Blob([bytes], {
              type: `audio/${data.format || "mp3"}`,
            });
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudioData(audioUrl);

            if (audioRef.current) {
              audioRef.current.src = audioUrl;
              audioRef.current.play();
              onPlayAudio?.(audioUrl);
            }
          } else {
            console.error("Invalid response format:", data);
          }
        }
      } catch (error) {
        console.error("Audio generation error:", error);
      } finally {
        setIsLoadingAudio(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-3xl ${message.isUser ? "order-2" : "order-1"}`}>
        <div
          className={`rounded-2xl p-6 ${
            message.isUser
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
              : "bg-zinc-800/40 border border-zinc-700/50"
          }`}
        >
          <div className="flex items-start space-x-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                message.isUser
                  ? "bg-white/20"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
              }`}
            >
              {message.isUser ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Brain className="w-5 h-5 text-white" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-zinc-200">
                    {message.isUser ? "You" : "AI Assistant"}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {!message.isUser && (
                  <button
                    onClick={playAudio}
                    disabled={isLoadingAudio}
                    className="p-2 hover:bg-zinc-700/50 rounded-xl transition-colors duration-200"
                  >
                    {isLoadingAudio ? (
                      <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5 text-zinc-400" />
                    ) : (
                      <Play className="w-5 h-5 text-zinc-400" />
                    )}
                  </button>
                )}
              </div>

              <div className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {message.text}
              </div>

              {/* Search Results */}
              {message.searchResults && message.searchResults.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-700/50">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    Search Results
                  </h4>
                  <div className="space-y-3">
                    {message.searchResults.map(
                      (result: any, resultIndex: number) => (
                        <div
                          key={resultIndex}
                          className="bg-zinc-700/30 rounded-xl p-4 border border-zinc-600/30"
                        >
                          <h5 className="font-medium text-zinc-200 mb-2">
                            {result.title}
                          </h5>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            {result.text}
                          </p>
                          {result.url && (
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                            >
                              Read more →
                            </a>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Personality Traits */}
              {message.personalityTraits && (
                <div className="mt-6 pt-6 border-t border-zinc-700/50">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Personality Context
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(message.personalityTraits).map(
                      ([trait, score]) => (
                        <div
                          key={trait}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-zinc-400 capitalize">
                            {trait}:
                          </span>
                          <span
                            className={`text-sm font-medium ${getTraitColor(
                              score
                            )}`}
                          >
                            {getTraitLevel(score)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Search Insights */}
              {message.searchInsights && message.searchInsights.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-700/50">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3">
                    Search Insights
                  </h4>
                  <ul className="space-y-2">
                    {message.searchInsights.map(
                      (insight: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-zinc-400 flex items-start"
                        >
                          <span className="text-blue-400 mr-2">•</span>
                          {insight}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onEnded={() => onStopAudio?.()}
        className="hidden"
      />
    </motion.div>
  );
}
