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
import { LiveBrowser } from "@/components/chat/LiveBrowser";
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
  const [showLiveBrowser, setShowLiveBrowser] = useState(false);
  const [browserSearchQuery, setBrowserSearchQuery] = useState("");
  const [preloadedSearchResults, setPreloadedSearchResults] = useState<any[]>(
    []
  );
  const [preloadedAudio, setPreloadedAudio] = useState<Record<string, string>>(
    {}
  );

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
  ): string => {
    const messageId = Date.now().toString();
    const message: Message = {
      id: messageId,
      text,
      isUser,
      timestamp: new Date(),
      ...additionalData,
    };
    setMessages((prev) => [...prev, message]);
    return messageId;
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

        const messageId = addMessage(data.response, false, {
          searchResults: data.search_results,
          personalityContext: data.personality_context,
          searchInsights: data.search_insights,
          personalityTraits: personalityProfile?.profile,
        });

        // Pre-generate audio for immediate playback
        if (voiceEnabled) {
          preGenerateAudio(data.response, messageId);
        }

        // Check if the message contains searchable topics and open browser
        await checkForSearchableTopics(messageText, data.response);
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

  const preGenerateAudio = async (text: string, messageId: string) => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_BASE_URL}/api/text-to-speech/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
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

          // Store the pre-generated audio URL
          setPreloadedAudio((prev) => ({
            ...prev,
            [messageId]: audioUrl,
          }));
        }
      }
    } catch (error) {
      console.error("Pre-generation audio error:", error);
    }
  };

  const checkForSearchableTopics = async (
    userMessage: string,
    aiResponse: string
  ) => {
    // Keywords that suggest the user wants to search for something
    const searchKeywords = [
      "favorite books",
      "best books",
      "recommend books",
      "book recommendations",
      "movies",
      "films",
      "watch",
      "streaming",
      "netflix",
      "disney",
      "music",
      "songs",
      "artists",
      "albums",
      "playlist",
      "restaurants",
      "food",
      "recipes",
      "cooking",
      "dining",
      "travel",
      "places to visit",
      "destinations",
      "hotels",
      "products",
      "buy",
      "purchase",
      "shopping",
      "amazon",
      "news",
      "latest",
      "current events",
      "trending",
      "tutorials",
      "how to",
      "learn",
      "courses",
      "education",
      "games",
      "gaming",
      "reviews",
      "tech",
      "technology",
    ];

    const combinedText = `${userMessage} ${aiResponse}`.toLowerCase();

    // Check if any search keywords are mentioned
    const foundKeywords = searchKeywords.filter((keyword) =>
      combinedText.includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
      // Extract the most relevant search query
      let searchQuery = "";

      // Try to extract specific terms from the message
      if (combinedText.includes("books")) {
        searchQuery = userMessage.includes("favorite")
          ? "best books recommendations"
          : "book recommendations";
      } else if (
        combinedText.includes("movies") ||
        combinedText.includes("films")
      ) {
        searchQuery = "best movies to watch";
      } else if (combinedText.includes("music")) {
        searchQuery = "popular music artists";
      } else if (
        combinedText.includes("restaurants") ||
        combinedText.includes("food")
      ) {
        searchQuery = "best restaurants near me";
      } else if (combinedText.includes("travel")) {
        searchQuery = "best travel destinations";
      } else {
        // Use the user's message as search query
        searchQuery = userMessage;
      }

      // Show loading toast first
      toast.loading("🔍 Searching for results...", {
        duration: 2000,
      });

      // Pre-load search results before showing browser
      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const response = await fetch(`${API_BASE_URL}/api/exa/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            num_results: 3,
            search_type: "auto",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.results && data.results.length > 0) {
            // Set search query and pre-loaded results, then show browser
            setBrowserSearchQuery(searchQuery);
            setPreloadedSearchResults(data.results);
            setShowLiveBrowser(true);

            // Show success toast
            toast.success("🔍 Found results! Opening live browser...", {
              duration: 3000,
            });
            return;
          }
        }
      } catch (error) {
        console.log("Pre-search error:", error);
      }

      // Fallback: show browser even if pre-search failed
      setBrowserSearchQuery(searchQuery);
      setPreloadedSearchResults([]); // Clear any previous results
      setShowLiveBrowser(true);

      // Show a toast notification
      toast.success("🔍 Opening live browser to search for that!", {
        duration: 3000,
      });
    }
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
      <div
        className={`flex flex-col transition-all duration-300 ${
          showLiveBrowser ? "w-1/2" : "flex-1"
        }`}
      >
        <ChatHeader
          userName="Your AI Assistant"
          isAudioEnabled={voiceEnabled}
          onToggleAudio={handleToggleAudio}
          onSettingsClick={handleSettingsClick}
          onBrowserClick={() => setShowLiveBrowser(!showLiveBrowser)}
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
              preloadedAudio={preloadedAudio[message.id]}
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

      {/* Live Browser Panel */}
      {showLiveBrowser && (
        <div className="w-1/2 border-l border-zinc-800/50">
          <LiveBrowser
            isOpen={true}
            onClose={() => setShowLiveBrowser(false)}
            searchQuery={browserSearchQuery}
            autoSearch={true}
            embedded={true}
            preloadedResults={preloadedSearchResults}
          />
        </div>
      )}

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
