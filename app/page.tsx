"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Brain, Mic, Camera, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/25">
          <Brain className="w-12 h-12 text-white" />
        </div>

        <motion.h1
          className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 tracking-tight"
          animate={{
            backgroundPosition: isHovered ? "200% 0%" : "0% 0%",
          }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Neural Marionette
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-4xl mx-auto leading-relaxed"
        >
          Forget generic AI assistants. We've built a system that learns your{" "}
          <span className="text-blue-400 font-semibold">
            personality through interactive questionnaires
          </span>{" "}
          and adapts every response to match your unique traits. Your data stays{" "}
          <span className="text-purple-400 font-semibold">
            local and private
          </span>{" "}
          while getting truly personalized assistance.
        </motion.p>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-6xl"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">
            Big Five Assessment
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Scientifically-validated personality questionnaire with 20
            questions.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Mic className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">
            Local-First Privacy
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Personality profiles stored locally with mem0 - never leaves your
            device.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Camera className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">
            Personalized Responses
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            AI responses tailored to your unique personality traits and
            preferences.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">
            Smart Search
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Search results customized based on your personality preferences.
          </p>
        </motion.div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Link href="/onboarding/demo-user">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-10 rounded-2xl text-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200"
          >
            <Brain className="w-6 h-6 inline mr-2" />
            Discover Your Personality
          </motion.button>
        </Link>
      </motion.div>

      {/* Technical Specs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-16 text-center"
      >
        <h2 className="text-2xl font-bold text-zinc-200 mb-6">
          Technical Architecture
        </h2>
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 max-w-4xl shadow-lg">
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-zinc-300">
            <span className="bg-blue-600/20 px-3 py-1 rounded-full">
              OpenAI GPT-4o-mini
            </span>
            <span className="bg-green-600/20 px-3 py-1 rounded-full">
              mem0 Local Storage
            </span>
            <span className="bg-purple-600/20 px-3 py-1 rounded-full">
              Exa.ai Search
            </span>
            <span className="bg-yellow-600/20 px-3 py-1 rounded-full">
              Big Five Assessment
            </span>
            <span className="bg-red-600/20 px-3 py-1 rounded-full">
              Privacy-First Design
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
