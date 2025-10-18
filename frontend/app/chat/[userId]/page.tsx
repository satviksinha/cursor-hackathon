"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { Message } from "@/components/chat/Message";
import { ChatInput } from "@/components/chat/ChatInput";
import { PersonalitySidebar } from "@/components/chat/PersonalitySidebar";
import { Alert } from "@/components/ui/Alert";

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

export default function ChatPage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personalityProfile, setPersonalityProfile] =
    useState<PersonalityProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showPersonalitySidebar, setShowPersonalitySidebar] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchPersonalityProfile();
  }, [userId]);

  const fetchPersonalityProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await api.getPersonalityProfile(userId);
      if (response.ok) {
        const data = await response.json();
        // Handle the backend response format
        if (data.status === "success" && data.profile) {
          setPersonalityProfile(data.profile);
        } else {
          setPersonalityProfile(data);
        }
      }
    } catch (error) {
      console.error("Error fetching personality profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const addMessage = (
    text: string,
    isUser: boolean,
    additionalData?: Partial<Message>
  ) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      ...additionalData,
    };
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    addMessage(messageText, true);
    setIsLoading(true);

    try {
      const response = await api.sendPersonalizedChat(userId, {
        message: messageText,
      });

      if (response.ok) {
        const data = await response.json();

        addMessage(data.response, false, {
          searchResults: data.search_results,
          personalityContext: data.personality_context,
          searchInsights: data.search_insights,
          personalityTraits: personalityProfile?.profile,
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = (audioData: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioData);
    audioRef.current = audio;
    setIsPlayingVoice(audioData);

    audio.onended = () => {
      setIsPlayingVoice(null);
      audioRef.current = null;
    };

    audio.play().catch((error) => {
      console.error("Audio playback error:", error);
      setIsPlayingVoice(null);
    });
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingVoice(null);
    audioRef.current = null;
  };

  const handleToggleAudio = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled && isPlayingVoice) {
      handleStopAudio();
    }
  };

  const handleSettingsClick = () => {
    router.push(`/onboarding/${userId}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader
          userName="Your AI Assistant"
          isAudioEnabled={voiceEnabled}
          onToggleAudio={handleToggleAudio}
          onSettingsClick={handleSettingsClick}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-zinc-200 mb-2">
                Start a conversation
              </h2>
              <p className="text-zinc-400">
                Ask me anything! I'll respond based on your personality profile.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              userId={userId}
              onPlayAudio={handlePlayAudio}
              onStopAudio={handleStopAudio}
              isPlaying={isPlayingVoice === message.id}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span className="text-zinc-400 text-sm ml-2">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <ChatInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          disabled={!personalityProfile}
        />
      </div>

      {/* Personality Sidebar */}
      {showPersonalitySidebar && (
        <PersonalitySidebar
          personalityProfile={personalityProfile}
          isLoading={isLoadingProfile}
          onRefresh={fetchPersonalityProfile}
        />
      )}
    </div>
  );
}
