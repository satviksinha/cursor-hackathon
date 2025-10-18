"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface TrainingStatus {
  status: string;
  model_id?: string;
  voice_id?: string;
  progress: number;
  training_status?: string;
  training_progress?: number;
  message?: string;
  error?: string;
}

export default function TrainingPage({
  params,
}: {
  params: { userId: string };
}) {
  const router = useRouter();
  const [status, setStatus] = useState<TrainingStatus>({
    status: "training",
    progress: 0,
  });
  const [isPolling, setIsPolling] = useState(true);
  const [isStartingTraining, setIsStartingTraining] = useState(false);

  const pollStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/${params.userId}/status`
      );
      const data = await response.json();

      setStatus(data);

      // Use training_status if available, otherwise fall back to status
      const currentStatus = data.training_status || data.status;
      const currentProgress = data.training_progress || data.progress;

      if (currentStatus === "succeeded") {
        setIsPolling(false);
        toast.success("Training complete! Your marionette is ready.");
        // Redirect to chat after a delay
        setTimeout(() => {
          router.push(`/chat/${params.userId}`);
        }, 2000);
      } else if (currentStatus === "failed") {
        setIsPolling(false);
        toast.error("Training failed. Please try again.");
      }
    } catch (error) {
      console.error("Status polling error:", error);
      toast.error("Failed to check training status");
    }
  };

  const startTraining = async () => {
    setIsStartingTraining(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/train/${params.userId}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success("Training started!");
        setIsPolling(true);
        // Poll immediately to get updated status
        pollStatus();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to start training");
      }
    } catch (error) {
      console.error("Start training error:", error);
      toast.error("Failed to start training");
    } finally {
      setIsStartingTraining(false);
    }
  };

  // useEffect(() => {
  //   // Start polling immediately
  //   pollStatus();

  //   // Poll every 5 seconds
  //   const interval = setInterval(pollStatus, 5000);

  //   return () => clearInterval(interval);
  // }, [params.userId, router]);

  const getStatusIcon = () => {
    const currentStatus = status.training_status || status.status;
    switch (currentStatus) {
      case "succeeded":
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      case "failed":
        return <AlertCircle className="w-8 h-8 text-red-400" />;
      case "running":
        return <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />;
      case "not_started":
        return <Brain className="w-8 h-8 text-gray-400" />;
      default:
        return <Brain className="w-8 h-8 text-purple-400" />;
    }
  };

  const getStatusText = () => {
    const currentStatus = status.training_status || status.status;
    switch (currentStatus) {
      case "validating_files":
        return "Validating your data...";
      case "queued":
        return "Processing your data...";
      case "running":
        return "Creating embeddings...";
      case "succeeded":
        return "RAG processing complete!";
      case "failed":
        return "Processing failed";
      case "not_started":
        return "Ready to start processing";
      default:
        return "Preparing RAG processing...";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Neural Resurrection
          </h1>
          <p className="text-xl text-gray-300">
            We're processing your digital consciousness with RAG...
          </p>
        </motion.div>

        {/* Training Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8"
        >
          {/* Status Icon */}
          <div className="text-center mb-6">
            <motion.div
              animate={{
                scale:
                  (status.training_status || status.status) === "running"
                    ? [1, 1.1, 1]
                    : 1,
                rotate:
                  (status.training_status || status.status) === "running"
                    ? [0, 5, -5, 0]
                    : 0,
              }}
              transition={{
                duration: 2,
                repeat:
                  (status.training_status || status.status) === "running"
                    ? Infinity
                    : 0,
              }}
            >
              {getStatusIcon()}
            </motion.div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {getStatusText()}
            </h2>
            <p className="text-gray-400">
              {(status.training_status || status.status) === "running"
                ? "Creating embeddings and indexing your communication style..."
                : (status.training_status || status.status) === "succeeded"
                ? "Your marionette is ready to come alive!"
                : (status.training_status || status.status) === "not_started"
                ? "Click the button below to start processing your marionette..."
                : "Please wait while we process your data..."}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-gray-400">
                {status.training_progress || status.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${status.training_progress || status.progress}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Manual Start Button */}
          {(status.training_status === "not_started" ||
            !status.training_status) && (
            <div className="text-center mb-8">
              <motion.button
                onClick={startTraining}
                disabled={isStartingTraining}
                whileHover={!isStartingTraining ? { scale: 1.05 } : {}}
                whileTap={!isStartingTraining ? { scale: 0.95 } : {}}
                className={`px-8 py-4 rounded-full font-bold text-lg transition-all ${
                  !isStartingTraining
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isStartingTraining ? (
                  <>
                    <Loader2 className="w-6 h-6 inline mr-2 animate-spin" />
                    Starting Training...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 inline mr-2" />
                    Start Training
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Error Display */}
          {status.error && (
            <div className="mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-red-400 font-medium">Error:</span>
              </div>
              <p className="text-red-300 text-sm mt-1">
                {(() => {
                  if (typeof status.error === "string") {
                    return status.error;
                  }

                  if (status.error && typeof status.error === "object") {
                    const errorObj = status.error as any;

                    // Check if it's a meaningful error object
                    if (errorObj.message && errorObj.message !== null) {
                      return errorObj.message;
                    }

                    // If all properties are null, show a generic message
                    if (
                      errorObj.code === null &&
                      errorObj.message === null &&
                      errorObj.param === null
                    ) {
                      return "An unexpected error occurred. Please try again.";
                    }

                    // For other object structures, try to extract meaningful info
                    return (
                      errorObj.message || errorObj.error || "An error occurred"
                    );
                  }

                  return "An unexpected error occurred. Please try again.";
                })()}
              </p>
            </div>
          )}

          {/* Training Steps */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  (status.training_progress || status.progress) >= 20
                    ? "bg-green-500"
                    : "bg-gray-600"
                }`}
              >
                {(status.training_progress || status.progress) >= 20 ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                )}
              </div>
              <span
                className={`text-sm ${
                  (status.training_progress || status.progress) >= 20
                    ? "text-green-400"
                    : "text-gray-400"
                }`}
              >
                Data preprocessing and validation
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  (status.training_progress || status.progress) >= 40
                    ? "bg-green-500"
                    : "bg-gray-600"
                }`}
              >
                {(status.training_progress || status.progress) >= 40 ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                )}
              </div>
              <span
                className={`text-sm ${
                  (status.training_progress || status.progress) >= 40
                    ? "text-green-400"
                    : "text-gray-400"
                }`}
              >
                Text chunking and embedding generation
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  (status.training_progress || status.progress) >= 60
                    ? "bg-green-500"
                    : "bg-gray-600"
                }`}
              >
                {(status.training_progress || status.progress) >= 60 ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                )}
              </div>
              <span
                className={`text-sm ${
                  (status.training_progress || status.progress) >= 60
                    ? "text-green-400"
                    : "text-gray-400"
                }`}
              >
                Vector database indexing
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  (status.training_progress || status.progress) >= 80
                    ? "bg-green-500"
                    : "bg-gray-600"
                }`}
              >
                {(status.training_progress || status.progress) >= 80 ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                )}
              </div>
              <span
                className={`text-sm ${
                  (status.training_progress || status.progress) >= 80
                    ? "text-green-400"
                    : "text-gray-400"
                }`}
              >
                Voice cloning with ElevenLabs
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  (status.training_progress || status.progress) >= 100
                    ? "bg-green-500"
                    : "bg-gray-600"
                }`}
              >
                {(status.training_progress || status.progress) >= 100 ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                )}
              </div>
              <span
                className={`text-sm ${
                  (status.training_progress || status.progress) >= 100
                    ? "text-green-400"
                    : "text-gray-400"
                }`}
              >
                RAG system ready for resurrection
              </span>
            </div>
          </div>
        </motion.div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            What's Happening?
          </h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              <strong className="text-blue-400">RAG Processing:</strong> We're
              creating embeddings from your text data and storing them in a
              vector database for instant retrieval and personality matching.
            </p>
            <p>
              <strong className="text-green-400">Voice Cloning:</strong>{" "}
              ElevenLabs is analyzing your voice sample to create a perfect
              replica that can speak any text in your voice.
            </p>
            <p>
              <strong className="text-purple-400">Instant Setup:</strong> Unlike
              fine-tuning which takes 20-60 minutes, RAG processing completes in
              seconds by indexing your communication patterns.
            </p>
          </div>
        </motion.div>

        {/* Redirect Notice */}
        {(status.training_status || status.status) === "succeeded" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <p className="text-green-400 font-medium">
              Redirecting to your marionette in 2 seconds...
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
