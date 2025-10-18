"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  MessageCircle,
  User,
  Brain,
  Search,
  Settings,
  BarChart3,
  RefreshCw,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

interface Message {
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

export default function ChatPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [personalityProfile, setPersonalityProfile] =
    useState<PersonalityProfile | null>(null);
  const [showPersonalitySidebar, setShowPersonalitySidebar] = useState(false);
  const [includeSearch, setIncludeSearch] = useState(true);
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchPersonalityProfile();
    // Add initial greeting
    setTimeout(() => {
      addMessage(
        "Hello! I'm your AI assistant. To provide you with personalized responses, please complete the personality assessment first. You can do this by clicking the settings button above.",
        false
      );
    }, 1000);
  }, []);

  // Refresh profile when component becomes visible (e.g., returning from assessment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPersonalityProfile();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchPersonalityProfile = async () => {
    try {
      const response = await api.getPersonalityProfile(params.userId);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setPersonalityProfile(data.profile);
          // Update greeting if this is the first time we found a profile
          if (messages.length === 1) {
            // Replace the first message with a new personalized greeting
            setMessages((prev) => [
              {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                text: "Hello! I'm your personalized AI assistant. I've learned about your personality and I'm here to help you in a way that matches your unique traits. What would you like to explore today?",
                isUser: false,
                timestamp: new Date(),
                searchResults: undefined,
                personalityContext: undefined,
              },
              ...prev.slice(1),
            ]);
          }
        }
      } else if (response.status === 404) {
        // Profile doesn't exist yet - user needs to complete assessment
        console.log(
          "No personality profile found - user needs to complete assessment"
        );
        setPersonalityProfile(null);
      }
    } catch (error) {
      console.error("Failed to fetch personality profile:", error);
    }
  };

  const addMessage = (
    text: string,
    isUser: boolean,
    searchResults?: any[],
    personalityContext?: string,
    searchInsights?: string[],
    personalityTraits?: any
  ) => {
    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      isUser,
      timestamp: new Date(),
      searchResults,
      personalityContext,
      searchInsights,
      personalityTraits,
    };
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Check if user has completed personality assessment
    if (!personalityProfile) {
      addMessage(
        "I'd love to help you, but first I need to learn about your personality! Please complete the personality assessment by clicking the settings button above, then come back here for personalized responses.",
        false
      );
      return;
    }

    const userMessage = inputText.trim();
    setInputText("");
    setIsLoading(true);

    // Add user message immediately
    addMessage(userMessage, true);

    try {
      const response = await api.sendPersonalizedChat(params.userId, {
        message: userMessage,
        include_search: includeSearch,
      });

      const data = await response.json();

      if (data.status === "success") {
        addMessage(
          data.response,
          false,
          data.search_results,
          data.personality_context,
          data.search_insights,
          data.personality_traits
        );
      } else {
        addMessage(
          "I'm sorry, I encountered an error. Please try again.",
          false
        );
        toast.error("Failed to get response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage("I'm sorry, I encountered an error. Please try again.", false);
      toast.error("Connection error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  const getTraitLevel = (score: number) => {
    if (score >= 70) return "High";
    if (score >= 30) return "Medium";
    return "Low";
  };

  const getTraitDescription = (trait: string, score: number) => {
    if (score >= 70) return "High";
    if (score >= 30) return "Medium";
    return "Low";
  };

  const playVoice = async (messageId: string, text: string) => {
    if (!voiceEnabled) return;

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsPlayingVoice(messageId);

      // Use streaming TTS for real-time playback
      const response = await api.textToSpeechStream(params.userId, text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create audio from streaming response
      const audioBlob = new Blob([await response.arrayBuffer()], {
        type: "audio/mpeg",
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlayingVoice(null);
        URL.revokeObjectURL(audioUrl);
        toast.error("Failed to play voice");
      };

      await audio.play();
    } catch (error) {
      console.error("Voice playback error:", error);
      setIsPlayingVoice(null);
      toast.error("Voice playback failed");
    }
  };

  const stopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingVoice(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Neural Assistant
                </h1>
                <p className="text-zinc-400 text-sm font-medium">
                  {personalityProfile
                    ? "Personalized intelligence"
                    : "Learning your personality..."}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  voiceEnabled
                    ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/20"
                    : "bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400"
                }`}
                title={voiceEnabled ? "Disable Voice" : "Enable Voice"}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => fetchPersonalityProfile()}
                className="p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl transition-all duration-200 text-zinc-400 hover:text-white"
                title="Refresh Profile"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setShowPersonalitySidebar(!showPersonalitySidebar)
                }
                className="p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl transition-all duration-200 text-zinc-400 hover:text-white"
                title="View Personality Profile"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push(`/onboarding/${params.userId}`)}
                className="p-3 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl transition-all duration-200 text-zinc-400 hover:text-white"
                title="Retake Assessment"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-4xl p-6 rounded-3xl ${
                    message.isUser
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "bg-zinc-900/60 backdrop-blur-xl text-white border border-zinc-800/50 shadow-lg"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        message.isUser
                          ? "bg-white/20"
                          : "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25"
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
                        <p className="text-sm font-semibold text-zinc-200">
                          {message.isUser ? "You" : "Assistant"}
                        </p>
                        {!message.isUser && voiceEnabled && (
                          <div className="flex items-center space-x-2">
                            {isPlayingVoice === message.id ? (
                              <button
                                onClick={stopVoice}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all duration-200 text-red-400 hover:text-red-300"
                                title="Stop Voice"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  playVoice(message.id, message.text)
                                }
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-all duration-200 text-blue-400 hover:text-blue-300"
                                title="Play Voice"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-zinc-100 leading-relaxed">
                        {message.text}
                      </p>

                      {/* Enhanced Search Results */}
                      {message.searchResults &&
                        message.searchResults.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-zinc-700/50">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Search className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-lg font-semibold text-zinc-200">
                                Research Context
                              </span>
                            </div>

                            {/* Search Insights */}
                            {message.searchInsights &&
                              message.searchInsights.length > 0 && (
                                <div className="mb-6 p-4 bg-zinc-800/40 rounded-2xl border border-zinc-700/50">
                                  <p className="text-sm font-medium text-zinc-300 mb-3">
                                    Why these searches were triggered:
                                  </p>
                                  <div className="space-y-2">
                                    {message.searchInsights.map(
                                      (insight, index) => (
                                        <p
                                          key={index}
                                          className="text-sm text-zinc-400 flex items-start space-x-2"
                                        >
                                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                          <span>{insight}</span>
                                        </p>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Categorized Search Results */}
                            <div className="space-y-4">
                              {message.searchResults.map(
                                (searchGroup, groupIndex) => (
                                  <div
                                    key={groupIndex}
                                    className="bg-zinc-800/30 backdrop-blur-sm rounded-2xl p-5 border border-zinc-700/30 hover:border-zinc-600/50 transition-all duration-200"
                                  >
                                    <div className="flex items-center space-x-3 mb-4">
                                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                                      <span className="text-base font-semibold text-zinc-200">
                                        {searchGroup.strategy
                                          .replace("_", " ")
                                          .replace(/\b\w/g, (l: string) =>
                                            l.toUpperCase()
                                          )}
                                      </span>
                                      {message.personalityTraits && (
                                        <div className="flex space-x-2">
                                          {searchGroup.strategy ===
                                            "contrarian" &&
                                            message.personalityTraits.openness >
                                              70 && (
                                              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full font-medium">
                                                High Openness
                                              </span>
                                            )}
                                          {searchGroup.strategy ===
                                            "calming_content" &&
                                            message.personalityTraits
                                              .neuroticism > 70 && (
                                              <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full font-medium">
                                                High Neuroticism
                                              </span>
                                            )}
                                          {searchGroup.strategy ===
                                            "structured" &&
                                            message.personalityTraits
                                              .conscientiousness > 70 && (
                                              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium">
                                                High Conscientiousness
                                              </span>
                                            )}
                                          {searchGroup.strategy ===
                                            "social_trends" &&
                                            message.personalityTraits
                                              .extraversion > 70 && (
                                              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full font-medium">
                                                High Extraversion
                                              </span>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-3">
                                      {searchGroup.results
                                        .slice(0, 2)
                                        .map(
                                          (
                                            result: any,
                                            resultIndex: number
                                          ) => (
                                            <div
                                              key={resultIndex}
                                              className="bg-zinc-900/40 rounded-xl p-4 hover:bg-zinc-900/60 transition-all duration-200"
                                            >
                                              <p className="text-sm font-semibold text-zinc-200 mb-2">
                                                {result.title || "Untitled"}
                                              </p>
                                              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                                                {result.text ||
                                                  result.description ||
                                                  "No description available"}
                                              </p>
                                              {result.url && (
                                                <a
                                                  href={result.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                                                >
                                                  <span>View source</span>
                                                  <svg
                                                    className="w-3 h-3"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                    />
                                                  </svg>
                                                </a>
                                              )}
                                            </div>
                                          )
                                        )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      <p className="text-xs text-white/50 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 p-6 rounded-3xl shadow-lg max-w-4xl">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      <span className="text-lg font-semibold text-zinc-200">
                        Neural Assistant is thinking...
                      </span>
                    </div>
                    {personalityProfile && (
                      <div className="space-y-2">
                        {personalityProfile.profile.openness > 70 && (
                          <div className="flex items-center space-x-3 text-sm text-zinc-400">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span>
                              Searching contrarian viewpoints (High Openness:{" "}
                              {personalityProfile.profile.openness.toFixed(1)})
                            </span>
                          </div>
                        )}
                        {personalityProfile.profile.neuroticism > 70 && (
                          <div className="flex items-center space-x-3 text-sm text-zinc-400">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <span>
                              Finding calming content (High Neuroticism:{" "}
                              {personalityProfile.profile.neuroticism.toFixed(
                                1
                              )}
                              )
                            </span>
                          </div>
                        )}
                        {personalityProfile.profile.conscientiousness > 70 && (
                          <div className="flex items-center space-x-3 text-sm text-zinc-400">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>
                              Gathering structured data (High Conscientiousness:{" "}
                              {personalityProfile.profile.conscientiousness.toFixed(
                                1
                              )}
                              )
                            </span>
                          </div>
                        )}
                        {personalityProfile.profile.extraversion > 70 && (
                          <div className="flex items-center space-x-3 text-sm text-zinc-400">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>
                              Checking social trends (High Extraversion:{" "}
                              {personalityProfile.profile.extraversion.toFixed(
                                1
                              )}
                              )
                            </span>
                          </div>
                        )}
                        <div className="flex items-center space-x-3 text-sm text-zinc-400">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span>Analyzing personality-driven insights...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    personalityProfile
                      ? "Ask me anything... I'll personalize my response based on your personality!"
                      : "Complete your personality assessment first to get personalized responses."
                  }
                  className="w-full p-5 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl text-zinc-100 placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-base leading-relaxed"
                  rows={3}
                  disabled={!personalityProfile || isLoading}
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-3 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSearch}
                    onChange={(e) => setIncludeSearch(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="font-medium">Search</span>
                </label>
                <button
                  onClick={sendMessage}
                  disabled={
                    !inputText.trim() || isLoading || !personalityProfile
                  }
                  className="p-5 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-zinc-400 font-medium">
                {personalityProfile
                  ? `Personalized for ${getTraitLevel(
                      personalityProfile.profile.openness
                    )} Openness, ${getTraitLevel(
                      personalityProfile.profile.conscientiousness
                    )} Conscientiousness`
                  : "Complete assessment to enable personalization"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personality Sidebar */}
      <AnimatePresence>
        {showPersonalitySidebar && personalityProfile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800/50 overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Personality Profile
                </h2>
              </div>

              <div className="space-y-6">
                {Object.entries(personalityProfile.profile).map(
                  ([trait, score]) => (
                    <div
                      key={trait}
                      className="bg-zinc-800/40 rounded-2xl p-6 border border-zinc-700/30"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-zinc-200">
                          {getTraitLabel(trait)}
                        </span>
                        <span className="text-xl text-white font-bold">
                          {Math.round(score)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800/50 rounded-full h-3 mb-3">
                        <div
                          className={`bg-gradient-to-r ${getTraitColor(
                            trait
                          )} h-3 rounded-full transition-all duration-500 shadow-lg`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-400 font-medium">
                          {getTraitDescription(trait, score)}
                        </p>
                        <p className="text-sm text-zinc-500 font-semibold">
                          {score >= 70
                            ? "High"
                            : score >= 30
                            ? "Medium"
                            : "Low"}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-10 pt-8 border-t border-zinc-700/50">
                <h3 className="text-xl font-semibold text-zinc-200 mb-6">
                  How This Affects Your Experience
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Your responses are tailored to your personality traits
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Search results are customized based on your preferences
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      Communication style adapts to your unique profile
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
