"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
// Removed socket.io-client import - using native WebSocket instead

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  videoData?: string;
  audioData?: string;
  audioChunks?: string[];
  isAudioComplete?: boolean;
}

export default function ChatPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Initialize native WebSocket connection
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const wsPath = `${wsUrl}/ws/${params.userId}`;

    socketRef.current = new WebSocket(wsPath);

    socketRef.current.onopen = () => {
      setIsConnected(true);
      toast.success("Connected to your marionette!");

      // Send initial greeting
      setTimeout(() => {
        sendMessage("Hello! Can you introduce yourself?");
      }, 1000);
    };

    socketRef.current.onclose = () => {
      setIsConnected(false);
      toast.error("Disconnected from marionette");
    };

    socketRef.current.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
      toast.error("Connection error");
      setIsConnected(false);
    };

    socketRef.current.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data.type);

        if (data.type === "text_chunk") {
          // Handle streaming text
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              // Update existing message
              return prev.map((msg, index) =>
                index === prev.length - 1
                  ? { ...msg, text: msg.text + data.content }
                  : msg
              );
            } else {
              // Create new message
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  text: data.content,
                  isUser: false,
                  timestamp: new Date(),
                },
              ];
            }
          });
        } else if (data.type === "video") {
          // Handle video data
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              return prev.map((msg, index) =>
                index === prev.length - 1
                  ? { ...msg, videoData: data.data }
                  : msg
              );
            }
            return prev;
          });
        } else if (data.type === "audio") {
          // Handle complete audio data
          console.log(
            "Received complete audio:",
            data.data.length,
            "characters"
          );
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              return prev.map((msg, index) =>
                index === prev.length - 1
                  ? { ...msg, audioData: data.data }
                  : msg
              );
            }
            return prev;
          });
        } else if (data.type === "audio_chunk") {
          // Handle streaming audio chunks
          console.log("Received audio chunk:", data.data.length, "characters");
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              const currentChunks = lastMessage.audioChunks || [];
              const newChunks = [...currentChunks, data.data];
              console.log("Total chunks so far:", newChunks.length);
              return prev.map((msg, index) =>
                index === prev.length - 1
                  ? { ...msg, audioChunks: newChunks }
                  : msg
              );
            }
            return prev;
          });
        } else if (data.type === "audio_complete") {
          // Handle audio completion - properly combine base64 chunks
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && !lastMessage.isUser && lastMessage.audioChunks) {
              try {
                // Convert base64 chunks to binary, concatenate, then back to base64
                const binaryChunks = lastMessage.audioChunks.map((chunk) =>
                  Uint8Array.from(atob(chunk), (c) => c.charCodeAt(0))
                );

                // Calculate total length
                const totalLength = binaryChunks.reduce(
                  (sum, chunk) => sum + chunk.length,
                  0
                );

                // Create combined binary data
                const combinedBinary = new Uint8Array(totalLength);
                let offset = 0;
                for (const chunk of binaryChunks) {
                  combinedBinary.set(chunk, offset);
                  offset += chunk.length;
                }

                // Convert back to base64
                const combinedAudio = btoa(
                  String.fromCharCode(...combinedBinary)
                );

                console.log(
                  "Audio complete, chunks:",
                  lastMessage.audioChunks.length,
                  "combined length:",
                  combinedAudio.length
                );

                return prev.map((msg, index) =>
                  index === prev.length - 1
                    ? {
                        ...msg,
                        isAudioComplete: true,
                        audioData: combinedAudio,
                      }
                    : msg
                );
              } catch (error) {
                console.error("Error combining audio chunks:", error);
                return prev;
              }
            }
            return prev;
          });
        } else if (data.type === "error") {
          toast.error(data.message);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [params.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      console.log("WebSocket state:", socketRef.current?.readyState);
      console.log("Video enabled:", isVideoEnabled);

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        console.log("Sending via WebSocket");
        // Send message via WebSocket with video preference
        socketRef.current.send(
          JSON.stringify({
            type: "chat",
            message: text.trim(),
            enableVideo: isVideoEnabled,
          })
        );
      } else {
        console.log("WebSocket not available, using HTTP fallback");
        // Fallback to HTTP API
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
          }/api/chat/${params.userId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: text.trim() }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              text: data.response,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        } else {
          throw new Error("Failed to send message");
        }
      }
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Send message error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording functionality would go here
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Neural Marionette</h1>
            <p className="text-gray-400">
              Real-time conversation with your digital twin
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-sm text-gray-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  className={`max-w-3xl ${
                    message.isUser ? "order-2" : "order-1"
                  }`}
                >
                  {/* Video Display */}
                  {message.videoData && !message.isUser && isVideoEnabled && (
                    <div className="mb-2">
                      <video
                        ref={videoRef}
                        className="w-full max-w-md rounded-lg border border-gray-600"
                        autoPlay
                        muted
                      >
                        <source
                          src={`data:video/mp4;base64,${message.videoData}`}
                          type="video/mp4"
                        />
                      </video>
                    </div>
                  )}

                  {/* Audio Display */}
                  {message.audioData && !message.isUser && (
                    <div className="mb-2">
                      <audio
                        className="w-full max-w-md"
                        controls
                        autoPlay
                        onLoadedMetadata={(e) => {
                          console.log(
                            "Regular audio loaded metadata:",
                            e.currentTarget.duration
                          );
                        }}
                        onError={(e) => {
                          console.error("Regular audio error:", e);
                        }}
                        onCanPlay={(e) => {
                          console.log(
                            "Regular audio can play:",
                            e.currentTarget.duration
                          );
                        }}
                      >
                        <source
                          src={`data:audio/mpeg;base64,${message.audioData}`}
                          type="audio/mpeg"
                        />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Streaming Audio Display */}
                  {message.audioChunks &&
                    message.audioChunks.length > 0 &&
                    !message.isUser && (
                      <div className="mb-2">
                        <div className="flex items-center space-x-2">
                          <audio
                            className="w-full max-w-md"
                            controls
                            autoPlay
                            key={message.audioChunks.length} // Force re-render when chunks change
                            onLoadedMetadata={(e) => {
                              console.log(
                                "Audio loaded metadata:",
                                e.currentTarget.duration
                              );
                            }}
                            onError={(e) => {
                              console.error("Audio error:", e);
                            }}
                            onCanPlay={(e) => {
                              console.log(
                                "Audio can play:",
                                e.currentTarget.duration
                              );
                            }}
                          >
                            <source
                              src={`data:audio/mpeg;base64,${message.audioChunks.join(
                                ""
                              )}`}
                              type="audio/mpeg"
                            />
                            Your browser does not support the audio element.
                          </audio>
                          {!message.isAudioComplete && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              <span className="text-xs text-gray-400">
                                Streaming...
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.isUser
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "bg-gray-700/50 backdrop-blur-sm text-gray-100 border border-gray-600"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-gray-300">
                      Your marionette is thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-700 bg-gray-800/30 backdrop-blur-sm">
            <form
              onSubmit={handleSubmit}
              className="flex items-center space-x-4"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-full px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-3 rounded-full transition-colors ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-600 hover:bg-gray-500 text-gray-300"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className={`p-3 rounded-full transition-colors ${
                    isVideoEnabled
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-600 hover:bg-gray-500 text-gray-300"
                  }`}
                >
                  {isVideoEnabled ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )}
                </button>

                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800/30 backdrop-blur-sm border-l border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Marionette Status
          </h3>

          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Connection
              </h4>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <span className="text-sm text-gray-400">
                  {isConnected ? "Active" : "Disconnected"}
                </span>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Features
              </h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isVideoEnabled ? "bg-green-400" : "bg-gray-500"
                    }`}
                  />
                  <span>Video Generation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Voice Cloning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Personality AI</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Performance
              </h4>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Latency: &lt;3s</div>
                <div>Quality: High</div>
                <div>Uptime: 99.9%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
