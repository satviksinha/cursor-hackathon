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
    personalityContext?: string
  ) => {
    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      isUser,
      timestamp: new Date(),
      searchResults,
      personalityContext,
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
          data.personality_context
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

      const response = await api.textToSpeech(params.userId, text);
      const data = await response.json();

      if (data.status === "success") {
        // Convert base64 to blob and create audio URL
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audio_data), (c) => c.charCodeAt(0))],
          { type: "audio/mpeg" }
        );

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
      } else {
        setIsPlayingVoice(null);
        toast.error("Failed to generate voice");
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Personality Assistant
                </h1>
                <p className="text-purple-200 text-sm">
                  {personalityProfile
                    ? "Personalized for you"
                    : "Learning about you..."}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  voiceEnabled
                    ? "bg-purple-500/30 hover:bg-purple-500/40"
                    : "bg-white/20 hover:bg-white/30"
                }`}
                title={voiceEnabled ? "Disable Voice" : "Enable Voice"}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-5 h-5 text-white" />
                ) : (
                  <VolumeX className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={() => fetchPersonalityProfile()}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Refresh Profile"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() =>
                  setShowPersonalitySidebar(!showPersonalitySidebar)
                }
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="View Personality Profile"
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => router.push(`/onboarding/${params.userId}`)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Retake Assessment"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  className={`max-w-3xl p-4 rounded-2xl ${
                    message.isUser
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-white/10 backdrop-blur-lg text-white border border-white/20"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.isUser
                          ? "bg-white/20"
                          : "bg-gradient-to-r from-purple-400 to-pink-400"
                      }`}
                    >
                      {message.isUser ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Brain className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {message.isUser ? "You" : "Assistant"}
                        </p>
                        {!message.isUser && voiceEnabled && (
                          <div className="flex items-center space-x-2">
                            {isPlayingVoice === message.id ? (
                              <button
                                onClick={stopVoice}
                                className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
                                title="Stop Voice"
                              >
                                <Pause className="w-3 h-3 text-red-300" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  playVoice(message.id, message.text)
                                }
                                className="p-1 bg-purple-500/20 hover:bg-purple-500/30 rounded transition-colors"
                                title="Play Voice"
                              >
                                <Play className="w-3 h-3 text-purple-300" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{message.text}</p>

                      {/* Search Results */}
                      {message.searchResults &&
                        message.searchResults.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <div className="flex items-center space-x-2 mb-2">
                              <Search className="w-4 h-4 text-purple-300" />
                              <span className="text-sm font-medium text-purple-300">
                                Found {message.searchResults.length} relevant
                                sources:
                              </span>
                            </div>
                            <div className="space-y-2">
                              {message.searchResults
                                .slice(0, 2)
                                .map((result, index) => (
                                  <div
                                    key={index}
                                    className="bg-white/10 rounded-lg p-2"
                                  >
                                    <p className="text-sm font-medium text-purple-200">
                                      {result.title || "Untitled"}
                                    </p>
                                    <p className="text-xs text-white/70 line-clamp-2">
                                      {result.text ||
                                        result.description ||
                                        "No description available"}
                                    </p>
                                  </div>
                                ))}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-4 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span className="text-white">Thinking...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything... I'll respond based on your personality!"
                className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 resize-none"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-white/70">
                <input
                  type="checkbox"
                  checked={includeSearch}
                  onChange={(e) => setIncludeSearch(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Search</span>
              </label>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personality Sidebar */}
      <AnimatePresence>
        {showPersonalitySidebar && personalityProfile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white/10 backdrop-blur-lg border-l border-white/20 overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Your Personality Profile
              </h2>

              <div className="space-y-4">
                {Object.entries(personalityProfile.profile).map(
                  ([trait, score]) => (
                    <div key={trait} className="bg-white/10 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">
                          {getTraitLabel(trait)}
                        </span>
                        <span className="text-purple-300 font-bold">
                          {Math.round(score)}
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                        <div
                          className={`bg-gradient-to-r ${getTraitColor(
                            trait
                          )} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-purple-200">
                        {getTraitDescription(trait, score)} -{" "}
                        {score >= 70 ? "High" : score >= 30 ? "Medium" : "Low"}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <h3 className="text-lg font-semibold text-white mb-3">
                  How This Affects Your Experience
                </h3>
                <div className="space-y-2 text-sm text-purple-200">
                  <p>
                    • Your responses are tailored to your personality traits
                  </p>
                  <p>• Search results match your preferences</p>
                  <p>• Communication style adapts to your needs</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
