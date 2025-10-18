"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Brain,
  Mic,
  Camera,
  Zap,
  Sparkles,
  Users,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  // Get user ID from authenticated user or localStorage fallback
  const getUserId = (): string => {
    // First try to get from authenticated user
    if (user?.id) {
      return user.id;
    }

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("user.id");
      if (storedUserId) {
        return storedUserId;
      }
    }

    // If no user ID found, generate a new one
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const newUserId = `user_${timestamp}_${randomStr}`;

    // Store the new user ID in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user.id", newUserId);
    }

    return newUserId;
  };

  const handleCreateClone = () => {
    const userId = getUserId();
    router.push(`/voice-upload/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-20 relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
          className="w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/30"
        >
          <Sparkles className="w-14 h-14 text-white" />
        </motion.div>

        <motion.h1
          className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-8 tracking-tight"
          animate={{
            backgroundPosition: isHovered ? "200% 0%" : "0% 0%",
          }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Neural Marionette
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-semibold text-zinc-200 mb-4">
            Create Your Digital Twin
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-4xl mx-auto leading-relaxed">
            The first AI that truly{" "}
            <span className="text-blue-400 font-semibold">sounds like you</span>{" "}
            and
            <span className="text-purple-400 font-semibold">
              {" "}
              thinks like you
            </span>
            . Upload your voice, complete a personality assessment, and watch as
            we create your personalized AI assistant that responds in your
            unique voice and style.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex justify-center items-center space-x-8 mb-8"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">2 min</div>
            <div className="text-sm text-zinc-500">Voice Upload</div>
          </div>
          <div className="w-px h-8 bg-zinc-700"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">5 min</div>
            <div className="text-sm text-zinc-500">Personality Test</div>
          </div>
          <div className="w-px h-8 bg-zinc-700"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-400">Instant</div>
            <div className="text-sm text-zinc-500">AI Ready</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 max-w-7xl relative z-10"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -8 }}
          className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 text-center shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 group"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-3">
            Voice Cloning
          </h3>
          <p className="text-zinc-400 leading-relaxed">
            Upload your voice sample and watch as ElevenLabs creates a perfect
            digital replica of your unique voice.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -8 }}
          className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 text-center shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 group"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-purple-500/30 transition-all duration-300">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-3">
            Personality Analysis
          </h3>
          <p className="text-zinc-400 leading-relaxed">
            Complete our scientifically-validated Big Five personality
            assessment to understand your unique traits.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -8 }}
          className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 text-center shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 group"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-pink-500/30 transition-all duration-300">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-3">
            Personalized Chat
          </h3>
          <p className="text-zinc-400 leading-relaxed">
            Chat with an AI that responds in your voice and adapts its
            communication style to match your personality.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -8 }}
          className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 text-center shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 group"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-yellow-500/30 transition-all duration-300">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-zinc-100 mb-3">Smart Search</h3>
          <p className="text-zinc-400 leading-relaxed">
            Get search results and recommendations tailored to your personality
            preferences and interests.
          </p>
        </motion.div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10"
      >
        <motion.button
          onClick={handleCreateClone}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-6 px-12 rounded-3xl text-xl shadow-2xl shadow-blue-500/30 hover:shadow-3xl hover:shadow-blue-500/40 transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="relative flex items-center">
            <Sparkles className="w-7 h-7 mr-3" />
            Create Your Dual Clone
          </div>
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-center text-zinc-500 text-sm mt-4"
        >
          Free • No credit card required • Takes 7 minutes
        </motion.p>
      </motion.div>

      {/* Technical Specs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-20 text-center relative z-10"
      >
        <h2 className="text-3xl font-bold text-zinc-200 mb-8">
          Powered by Cutting-Edge AI
        </h2>
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-8 max-w-5xl mx-auto shadow-2xl">
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 px-6 py-3 rounded-2xl border border-blue-500/30"
            >
              <span className="text-blue-300 font-semibold">
                ElevenLabs Voice Cloning
              </span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-green-600/20 to-green-500/20 px-6 py-3 rounded-2xl border border-green-500/30"
            >
              <span className="text-green-300 font-semibold">
                OpenAI GPT-4o-mini
              </span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 px-6 py-3 rounded-2xl border border-purple-500/30"
            >
              <span className="text-purple-300 font-semibold">
                mem0 Local Storage
              </span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 px-6 py-3 rounded-2xl border border-yellow-500/30"
            >
              <span className="text-yellow-300 font-semibold">
                Exa.ai Search
              </span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-pink-600/20 to-pink-500/20 px-6 py-3 rounded-2xl border border-pink-500/30"
            >
              <span className="text-pink-300 font-semibold">
                Big Five Assessment
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
