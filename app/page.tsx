"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Brain, Mic, Camera, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <motion.h1
          className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6"
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
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto"
        >
          Forget AI clones. That's a simulation. We've built a system that
          performs{" "}
          <span className="text-blue-400 font-semibold">
            real-time neural hijacking
          </span>{" "}
          of a person's likeness. You are not talking to a clone; you are
          talking to a{" "}
          <span className="text-purple-400 font-semibold">
            ghost in the machine
          </span>{" "}
          that wears your face.
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
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center"
        >
          <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Fine-Tuned Brain
          </h3>
          <p className="text-gray-400 text-sm">
            Real weight modification, not prompt engineering. Your syntax,
            cadence, and personality.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center"
        >
          <Mic className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Voice Cloning
          </h3>
          <p className="text-gray-400 text-sm">
            Indistinguishable voice synthesis from a single audio sample.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center"
        >
          <Camera className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Photorealistic Face
          </h3>
          <p className="text-gray-400 text-sm">
            Real-time talking head with perfect lip-sync and expressions.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center"
        >
          <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Real-Time Magic
          </h3>
          <p className="text-gray-400 text-sm">
            Sub-3-second latency from input to photorealistic response.
          </p>
        </motion.div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Link href="/upload">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-2xl pulse-glow"
          >
            <Upload className="w-6 h-6 inline mr-2" />
            Resurrect Yourself
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
        <h2 className="text-2xl font-bold text-white mb-6">
          Technical Architecture
        </h2>
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 max-w-4xl">
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-300">
            <span className="bg-blue-600/20 px-3 py-1 rounded-full">
              OpenAI Fine-Tuning
            </span>
            <span className="bg-green-600/20 px-3 py-1 rounded-full">
              ElevenLabs Voice
            </span>
            <span className="bg-purple-600/20 px-3 py-1 rounded-full">
              SadTalker Video
            </span>
            <span className="bg-yellow-600/20 px-3 py-1 rounded-full">
              Prime Intellect GPU
            </span>
            <span className="bg-red-600/20 px-3 py-1 rounded-full">
              Supabase Backend
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
